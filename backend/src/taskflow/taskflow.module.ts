import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TaskflowUser, TaskflowTodo } from './taskflow.entity';
import { TaskflowService } from './taskflow.service';
import { TaskflowAuthGuard } from './taskflow-auth.guard';
import { TaskflowUserController, TaskflowTodoController } from './taskflow.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskflowUser, TaskflowTodo]),
    /* Its own JwtModule instance so demo tokens are signed with a distinct
       secret where one is configured. TASKFLOW_JWT_SECRET is optional — the
       typ claim already separates these from admin sessions — but setting it
       means a leaked demo token tells an attacker nothing about JWT_SECRET. */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('TASKFLOW_JWT_SECRET') || cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [TaskflowUserController, TaskflowTodoController],
  providers: [TaskflowService, TaskflowAuthGuard],
})
export class TaskflowModule {}
