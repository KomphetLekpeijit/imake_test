import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { ExecutionLogsModule } from './execution-logs/execution-logs.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SseModule } from './sse/sse.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    TasksModule,
    ExecutionLogsModule,
    SchedulerModule,
    SseModule,
    NotificationModule,
  ],
})
export class AppModule {}
