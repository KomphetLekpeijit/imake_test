import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExecutionLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(taskId?: string, status?: string) {
    const where: any = {};
    if (taskId) where.taskId = taskId;
    if (status) where.status = status;

    return this.prisma.executionLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: { task: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    return this.prisma.executionLog.findUnique({
      where: { id },
      include: { task: true },
    });
  }

  async create(data: {
    taskId: string;
    triggerType: string;
    startedAt: Date;
    requestPayload?: any;
    status?: string;
  }) {
    return this.prisma.executionLog.create({
      data: {
        taskId: data.taskId,
        triggerType: data.triggerType,
        startedAt: data.startedAt,
        status: data.status || 'running',
        requestPayload: data.requestPayload || {},
      },
    });
  }

  async update(id: string, data: {
    finishedAt: Date;
    durationMs: number;
    status: string;
    httpStatusCode?: number;
    responseBody?: string;
    retryCount?: number;
  }) {
    return this.prisma.executionLog.update({
      where: { id },
      data: {
        finishedAt: data.finishedAt,
        durationMs: data.durationMs,
        status: data.status,
        httpStatusCode: data.httpStatusCode,
        responseBody: data.responseBody,
        retryCount: data.retryCount,
      },
    });
  }

  async getStats() {
    const total = await this.prisma.executionLog.count();
    const success = await this.prisma.executionLog.count({ where: { status: 'success' } });
    const failed = await this.prisma.executionLog.count({ where: { status: 'failed' } });
    const timeout = await this.prisma.executionLog.count({ where: { status: 'timeout' } });
    const activeTasks = await this.prisma.task.count({ where: { isActive: true } });
    const totalTasks = await this.prisma.task.count();

    return {
      total,
      success,
      failed,
      timeout,
      activeTasks,
      totalTasks,
      successRate: total > 0 ? ((success / total) * 100).toFixed(1) : '0',
    };
  }
}
