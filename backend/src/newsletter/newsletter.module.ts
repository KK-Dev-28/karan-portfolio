import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterSubscriber } from './newsletter.entity';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { CrewService } from './crew.service';
import { CrewController } from './crew.controller';
import { EmailService } from '../ai-tools/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSubscriber])],
  controllers: [NewsletterController, CrewController],
  providers: [NewsletterService, CrewService, EmailService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
