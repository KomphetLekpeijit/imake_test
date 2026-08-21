import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('api/tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly schedulerService: SchedulerService,
  ) {}

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTaskDto) {
    const task = await this.tasksService.create(dto);
    if (task.isActive) {
      this.schedulerService.scheduleTask(task.id, task.cronExpression, task.name);
    }
    return task;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    const task = await this.tasksService.update(id, dto);
    this.schedulerService.rescheduleTask(
      task.id,
      task.cronExpression,
      task.name,
      task.isActive,
    );
    return task;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    this.schedulerService.unscheduleTask(id);
    return this.tasksService.remove(id);
  }
}
