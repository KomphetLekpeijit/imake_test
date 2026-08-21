import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExecutionLogsService } from './execution-logs.service';

@Controller('api/execution-logs')
export class ExecutionLogsController {
  constructor(private readonly logsService: ExecutionLogsService) {}

  @Get()
  findAll(
    @Query('taskId') taskId?: string,
    @Query('status') status?: string,
  ) {
    return this.logsService.findAll(taskId, status);
  }

  @Get('stats')
  getStats() {
    return this.logsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(id);
  }
}
