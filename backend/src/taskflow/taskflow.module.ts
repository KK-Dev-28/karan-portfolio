import { Module } from '@nestjs/common';
import { createHmac } from 'crypto';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TaskflowUser, TaskflowTodo } from './taskflow.entity';
import { TaskflowService } from './taskflow.service';
import { TaskflowUserController, TaskflowTodoController } from './taskflow.controller';
import { TaskflowAuthGuard } from './taskflow-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskflowUser, TaskflowTodo]),
    /* Its own secret, separate from the admin JWT. Registration here is open to
       anyone, so these tokens must never be verifiable as admin ones. */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        /* Prefer an explicitly configured secret. Where none is set, derive one
           from the admin secret rather than refusing to boot: a missing
           optional variable must not take the whole API down on deploy. The
           derivation is one-way and domain-separated, so the signing key still
           differs from the admin key and a token from either side fails
           verification on the other. */
        const explicit = cfg.get<string>('TASKFLOW_JWT_SECRET');
        const admin = cfg.get<string>('JWT_SECRET');
        if (!explicit && !admin) throw new Error('JWT_SECRET env variable is not set');

        const secret = explicit ?? createHmac('sha256', admin!).update('taskflow-demo-v1').digest('hex');
        return { secret, signOptions: { expiresIn: '7d' } };
      },
    }),
  ],
  providers: [TaskflowService, TaskflowAuthGuard],
  controllers: [TaskflowUserController, TaskflowTodoController],
})
export class TaskflowModule {}
