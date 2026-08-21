import { Module, forwardRef } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [
    forwardRef(() => SchedulerModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
