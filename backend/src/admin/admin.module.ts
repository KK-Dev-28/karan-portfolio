// admin.module.ts
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { VisitorModule } from '../visitor/visitor.module';
import { ContactModule } from '../contact/contact.module';
import { ProjectModule } from '../project/project.module';
import { PaymentModule } from '../payment/payment.module';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { PortfolioUpdateModule } from '../portfolio-update/portfolio-update.module';

@Module({
  imports: [
    VisitorModule,
    ContactModule,
    ProjectModule,
    PaymentModule,
    NewsletterModule,
    PortfolioUpdateModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
