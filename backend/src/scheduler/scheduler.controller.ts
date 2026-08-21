import {
  Controller,
  Post,
  Param,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('api/scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('trigger/:taskId')
  @HttpCode(HttpStatus.OK)
  async trigger(@Param('taskId') taskId: string) {
    await this.schedulerService.triggerTask(taskId);
    return { message: 'Task triggered successfully' };
  }

  @Post('reload/:taskId')
  @HttpCode(HttpStatus.OK)
  async reload(@Param('taskId') taskId: string) {
    await this.schedulerService.reloadTask(taskId);
    return { message: 'Task reloaded successfully' };
  }

  @Get('status')
  getStatus() {
    return this.schedulerService.getStatus();
  }

  @Post('reload-all')
  @HttpCode(HttpStatus.OK)
  async reloadAll() {
    await this.schedulerService.syncTasksFromDB();
    return { message: 'All tasks reloaded' };
  }
}
