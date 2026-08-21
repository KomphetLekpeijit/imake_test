import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Cron } from 'croner';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { executionLogs: true } } },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        executionLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto) {
    const nextRunAt = this.calculateNextRun(dto.cronExpression);
    return this.prisma.task.create({
      data: {
        name: dto.name,
        description: dto.description,
        cronExpression: dto.cronExpression,
        targetUrl: dto.targetUrl,
        httpMethod: dto.httpMethod || 'POST',
        headers: dto.headers || {},
        payload: dto.payload || {},
        timeoutSeconds: dto.timeoutSeconds || 30,
        maxRetries: dto.maxRetries ?? 3,
        webhookUrl: dto.webhookUrl || null,
        webhookType: dto.webhookType || null,
        isActive: dto.isActive ?? true,
        nextRunAt,
      },
    });
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.cronExpression) {
      data.nextRunAt = this.calculateNextRun(dto.cronExpression);
    }
    return this.prisma.task.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  async getActiveTasks() {
    return this.prisma.task.findMany({
      where: { isActive: true },
    });
  }

  async updateNextRun(id: string) {
    const task = await this.findOne(id);
    const nextRunAt = this.calculateNextRun(task.cronExpression);
    return this.prisma.task.update({
      where: { id },
      data: { nextRunAt },
    });
  }

  private calculateNextRun(cronExpression: string): Date {
    try {
      const job = new Cron(cronExpression, {
        timezone: 'Asia/Bangkok',
      });
      const next = job.nextRun();
      if (!next) return new Date();
      return next;
    } catch {
      return new Date();
    }
  }
}
