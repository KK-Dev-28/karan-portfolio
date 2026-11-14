import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioAudit, PortfolioClient, PortfolioFeatureRequest, PortfolioRequest } from './portfolio-request.entity';
import { ClientAuthService } from './client-auth.service';
import { BuilderService } from './builder.service';
import { FeatureService } from './feature.service';
import { BuilderController } from './builder.controller';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { PaymentModule } from '../payment/payment.module';
import { EmailService } from '../ai-tools/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PortfolioRequest, PortfolioClient, PortfolioFeatureRequest, PortfolioAudit]),
    NewsletterModule, PaymentModule,
  ],
  controllers: [BuilderController],
  providers: [BuilderService, ClientAuthService, FeatureService, EmailService],
  exports: [BuilderService],
})
export class BuilderModule {}
