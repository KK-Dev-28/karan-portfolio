import {
  Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { TaskflowService } from './taskflow.service';
import { TaskflowAuthGuard } from './taskflow-auth.guard';
import { RegisterDto, LoginDto, TodoBody } from './taskflow.dto';

/* Routes are mounted at /api/users/* and /api/todos to match what the deployed
   TaskFlow client already calls, so the demo needs a new API base URL and
   nothing else. Neither path collides with an existing portfolio controller. */

@ApiTags('TaskFlow demo')
@Controller('users')
export class TaskflowUserController {
  constructor(private svc: TaskflowService) {}

  /* Each registration writes an account plus seven seeded tasks, so this is
     the costliest public endpoint here. Generous for the one account a real
     visitor needs, hostile to a script farming rows. */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  register(@Body() dto: RegisterDto) {
    return this.svc.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  login(@Body() dto: LoginDto) {
    return this.svc.login(dto);
  }
}

@ApiTags('TaskFlow demo')
@ApiBearerAuth()
@Controller('todos')
@UseGuards(TaskflowAuthGuard)
export class TaskflowTodoController {
  constructor(private svc: TaskflowService) {}

  @Get()
  list(@Req() req: any) {
    return this.svc.list(req.taskflowUserId);
  }

  /* Bodies stay untyped so Nest skips the strict global pipe — the service
     sanitizes against an allowlist instead. See taskflow.dto.ts. */
  @Post()
  create(@Req() req: any, @Body() body: TodoBody) {
    return this.svc.create(req.taskflowUserId, body);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: TodoBody) {
    return this.svc.update(req.taskflowUserId, id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.remove(req.taskflowUserId, id);
  }
}
