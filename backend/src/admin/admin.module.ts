import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { VisitorModule } from '../visitor/visitor.module';
import { ContactModule } from '../contact/contact.module';
import { ProjectModule } from '../project/project.module';
import { PaymentModule } from '../payment/payment.module';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { PortfolioUpdateModule } from '../portfolio-update/portfolio-update.module';
import { ReviewModule } from '../reviews/review.module';
import { ServiceOrderModule } from '../service-orders/service-order.module';
import { SurveyModule } from '../survey/survey.module';
import { BlogModule } from '../blog/blog.module';

@Module({
  imports: [
    VisitorModule,
    ContactModule,
    ProjectModule,
    PaymentModule,
    NewsletterModule,
    PortfolioUpdateModule,
    ReviewModule,
    ServiceOrderModule,
    SurveyModule,
    BlogModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
