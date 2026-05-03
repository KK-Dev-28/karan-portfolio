import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VisitorService } from '../visitor/visitor.service';
import { ContactService } from '../contact/contact.service';
import { ProjectService } from '../project/project.service';
import { PaymentService } from '../payment/payment.service';
import { NewsletterService } from '../newsletter/newsletter.service';
import { PortfolioUpdateService } from '../portfolio-update/portfolio-update.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private visitors: VisitorService,
    private contacts: ContactService,
    private projects: ProjectService,
    private payments: PaymentService,
    private newsletter: NewsletterService,
    private portfolioUpdates: PortfolioUpdateService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Full dashboard data in one call (admin)' })
  async dashboard() {
    const [
      analytics,
      messages,
      projects,
      unread,
      payments,
      paymentStats,
      subscribers,
      subscriberCount,
      journalEntries,
    ] = await Promise.all([
      this.visitors.analytics(),
      this.contacts.findAll(),
      this.projects.findAll(),
      this.contacts.unreadCount(),
      this.payments.findAllForAdmin(),
      this.payments.paymentStats(),
      this.newsletter.findRecentForDashboard(120),
      this.newsletter.count(),
      this.portfolioUpdates.findAllForAdmin(),
    ]);
    return {
      analytics,
      messages,
      projects,
      unread,
      payments,
      paymentStats,
      subscribers,
      subscriberCount,
      journalEntries,
    };
  }
}
