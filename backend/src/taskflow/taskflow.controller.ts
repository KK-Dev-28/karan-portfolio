import {
  Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { TaskflowService } from './taskflow.service';
import { TaskflowAuthGuard } from './taskflow-auth.guard';
import { CreateTodoDto, UpdateTodoDto, SubTaskDto, CommentDto, TimeEntryDto, RegisterDto, LoginDto } from './taskflow.dto';

/* Route paths match what the deployed TaskFlow client already calls, so the
   client needs no change beyond its API base URL. */
@Controller('users')
export class TaskflowUserController {
  constructor(private readonly svc: TaskflowService) {}

  @Post('register') register(@Body() dto: RegisterDto) { return this.svc.register(dto); }
  @Post('login')    login(@Body() dto: LoginDto)       { return this.svc.login(dto); }
}

@Controller('todos')
@UseGuards(TaskflowAuthGuard)
export class TaskflowTodoController {
  constructor(private readonly svc: TaskflowService) {}

  private uid(req: any): string { return req.taskflowUserId; }

  /* Declared before any ':id' route so 'stats' is never read as an id. */
  @Get('stats') stats(@Req() req: any) { return this.svc.stats(this.uid(req)); }

  @Get()  list(@Req() req: any)                              { return this.svc.list(this.uid(req)); }
  @Post() create(@Req() req: any, @Body() dto: CreateTodoDto) { return this.svc.create(this.uid(req), dto); }

  @Patch(':id')  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.svc.update(this.uid(req), id, dto);
  }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.remove(this.uid(req), id);
  }

  @Post(':id/subtasks')     addSubTask(@Req() req: any, @Param('id') id: string, @Body() dto: SubTaskDto) {
    return this.svc.addSubTask(this.uid(req), id, dto);
  }
  @Post(':id/comments')     addComment(@Req() req: any, @Param('id') id: string, @Body() dto: CommentDto) {
    return this.svc.addComment(this.uid(req), id, dto);
  }
  @Post(':id/time-entries') addTimeEntry(@Req() req: any, @Param('id') id: string, @Body() dto: TimeEntryDto) {
    return this.svc.addTimeEntry(this.uid(req), id, dto);
  }
}
