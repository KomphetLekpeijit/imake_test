import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from 'croner';
import { TasksService } from '../tasks/tasks.service';
import { ExecutionLogsService } from '../execution-logs/execution-logs.service';
import { HttpClientService } from '../http-client/http-client.service';
import { SseService } from '../sse/sse.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private jobs: Map<string, Cron> = new Map();
  private runningTasks: Set<string> = new Set();
  private taskSyncRunning = false;

  constructor(
    private tasksService: TasksService,
    private logsService: ExecutionLogsService,
    private httpClient: HttpClientService,
    private sseService: SseService,
    private notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    await this.syncTasksFromDB();
    this.logger.log('Scheduler initialized - periodic sync every 10s');
  }

  async syncTasksFromDB() {
    this.taskSyncRunning = true;
    try {
      const activeTasks = await this.tasksService.getActiveTasks();
      const activeIds = new Set(activeTasks.map((t) => t.id));

      for (const task of activeTasks) {
        if (!this.jobs.has(task.id)) {
          this.scheduleTask(task.id, task.cronExpression, task.name);
        }
      }

      for (const [jobId, job] of this.jobs.entries()) {
        if (!activeIds.has(jobId)) {
          job.stop();
          this.jobs.delete(jobId);
          this.logger.log(`Unscheduled inactive task: ${jobId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Task sync failed: ${error}`);
    } finally {
      this.taskSyncRunning = false;
    }
  }

  scheduleTask(taskId: string, cronExpression: string, taskName: string) {
    if (this.jobs.has(taskId)) {
      this.jobs.get(taskId)!.stop();
    }

    try {
      const job = new Cron(cronExpression, async () => {
        await this.executeTask(taskId, 'scheduled');
      });

      this.jobs.set(taskId, job);
      this.logger.log(`Scheduled task: ${taskName} [${taskId}] (${cronExpression})`);
    } catch (error) {
      this.logger.error(`Invalid cron for task ${taskName}: ${error}`);
    }
  }

  unscheduleTask(taskId: string) {
    if (this.jobs.has(taskId)) {
      this.jobs.get(taskId)!.stop();
      this.jobs.delete(taskId);
      this.runningTasks.delete(taskId);
      this.logger.log(`Unscheduled task: ${taskId}`);
    }
  }

  async reloadTask(taskId: string) {
    const task = await this.tasksService.findOne(taskId);
    if (task.isActive) {
      this.scheduleTask(task.id, task.cronExpression, task.name);
    } else {
      this.unscheduleTask(task.id);
    }
  }

  rescheduleTask(taskId: string, cronExpression: string, taskName: string, isActive: boolean) {
    if (isActive) {
      this.scheduleTask(taskId, cronExpression, taskName);
    } else {
      this.unscheduleTask(taskId);
    }
  }

  async executeTask(taskId: string, triggerType: 'scheduled' | 'manual') {
    if (this.runningTasks.has(taskId)) {
      this.logger.warn(`Task ${taskId} is already running, skipping`);
      const task = await this.tasksService.findOne(taskId);
      await this.logsService.create({
        taskId,
        triggerType,
        startedAt: new Date(),
        requestPayload: task.payload,
        status: 'skipped',
      });
      this.sseService.emit({
        type: 'task_skipped',
        data: {
          taskId,
          taskName: task.name,
          logId: '',
          triggerType,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    this.runningTasks.add(taskId);

    const task = await this.tasksService.findOne(taskId);
    const maxRetries = task.maxRetries ?? 3;
    const baseDelay = 1000;

    this.logger.log(`Executing task: ${task.name} (${triggerType})`);

    this.sseService.emit({
      type: 'task_started',
      data: {
        taskId,
        taskName: task.name,
        logId: '',
        triggerType,
        timestamp: new Date().toISOString(),
      },
    });

    let lastResult: any = null;
    let retryCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const log = await this.logsService.create({
        taskId,
        triggerType,
        startedAt: new Date(),
        requestPayload: task.payload,
      });

      try {
        const result = await this.httpClient.dispatch({
          url: task.targetUrl,
          method: task.httpMethod,
          headers: task.headers as Record<string, string>,
          payload: task.payload,
          timeout: task.timeoutSeconds,
        });

        let status: string;
        if (result.isTimeout) {
          status = 'timeout';
        } else if (result.statusCode >= 200 && result.statusCode < 300) {
          status = 'success';
        } else {
          status = 'failed';
        }

        await this.logsService.update(log.id, {
          finishedAt: new Date(),
          durationMs: result.durationMs,
          status,
          httpStatusCode: result.statusCode,
          responseBody: result.body,
          retryCount: attempt,
        });

        lastResult = { status, result };

        if (status === 'success') {
          this.logger.log(`Task ${task.name} completed: success (${result.durationMs}ms, attempt ${attempt + 1})`);
          this.sseService.emit({
            type: 'task_completed',
            data: {
              taskId,
              taskName: task.name,
              logId: log.id,
              status,
              durationMs: result.durationMs,
              httpStatusCode: result.statusCode,
              triggerType,
              timestamp: new Date().toISOString(),
            },
          });
          break;
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          this.logger.warn(`Task ${task.name} ${status} on attempt ${attempt + 1}, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retryCount = attempt + 1;
        } else {
          this.logger.error(`Task ${task.name} ${status} after ${maxRetries + 1} attempts`);
          this.sseService.emit({
            type: status === 'timeout' ? 'task_timeout' : 'task_failed',
            data: {
              taskId,
              taskName: task.name,
              logId: log.id,
              status,
              durationMs: result.durationMs,
              httpStatusCode: result.statusCode,
              triggerType,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (error: any) {
        await this.logsService.update(log.id, {
          finishedAt: new Date(),
          durationMs: 0,
          status: 'failed',
          responseBody: error.message,
          retryCount: attempt,
        });

        lastResult = { status: 'failed', error: error.message };

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          this.logger.warn(`Task ${task.name} failed on attempt ${attempt + 1}, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retryCount = attempt + 1;
        } else {
          this.logger.error(`Task ${task.name} failed after ${maxRetries + 1} attempts: ${error.message}`);
          this.sseService.emit({
            type: 'task_failed',
            data: {
              taskId,
              taskName: task.name,
              logId: log.id,
              status: 'failed',
              triggerType,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    }

    await this.tasksService.updateNextRun(taskId);
    this.runningTasks.delete(taskId);

    if (lastResult && task.webhookUrl) {
      this.notificationService.sendWebhook(task.webhookUrl, task.webhookType || 'discord', {
        taskName: task.name,
        taskDescription: task.description || '',
        taskId: task.id,
        status: lastResult.status,
        errorMessage: lastResult.error,
        responseBody: lastResult.result?.body,
        httpStatusCode: lastResult.result?.statusCode,
        durationMs: lastResult.result?.durationMs,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async triggerTask(taskId: string) {
    await this.executeTask(taskId, 'manual');
  }

  getStatus() {
    return {
      scheduledJobs: this.jobs.size,
      runningTasks: this.runningTasks.size,
      runningTaskIds: Array.from(this.runningTasks),
    };
  }
}
