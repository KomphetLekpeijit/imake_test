import { Module, forwardRef } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { TasksModule } from '../tasks/tasks.module';
import { ExecutionLogsModule } from '../execution-logs/execution-logs.module';
import { HttpClientModule } from '../http-client/http-client.module';
import { SseModule } from '../sse/sse.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    forwardRef(() => TasksModule),
    ExecutionLogsModule,
    HttpClientModule,
    SseModule,
    NotificationModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
