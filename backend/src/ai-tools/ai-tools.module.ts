import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreeUsage } from './free-usage.entity';
import { EmailVerification } from './email-verification.entity';
import { AiToolsService } from './ai-tools.service';
import { AiToolsController } from './ai-tools.controller';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([FreeUsage, EmailVerification])],
  providers: [AiToolsService, EmailService],
  controllers: [AiToolsController],
})
export class AiToolsModule {}
