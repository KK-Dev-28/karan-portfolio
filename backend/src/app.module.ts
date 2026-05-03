import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { Visitor }        from './visitor/visitor.entity';
import { ContactMessage } from './contact/contact.entity';
import { Project }        from './project/project.entity';
import { Payment }        from './payment/payment.entity';
import { InsightsAccess } from './payment/insights-access.entity';
import { NewsletterSubscriber } from './newsletter/newsletter.entity';
import { PortfolioUpdate } from './portfolio-update/portfolio-update.entity';

import { VisitorModule } from './visitor/visitor.module';
import { ContactModule } from './contact/contact.module';
import { AuthModule }    from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { AdminModule }   from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { PortfolioUpdateModule } from './portfolio-update/portfolio-update.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Load .env everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // PostgreSQL connection via TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:        'postgres',
        host:        cfg.get('DB_HOST',   'localhost'),
        port:        cfg.get<number>('DB_PORT', 5432),
        username:    cfg.get('DB_USER',   'postgres'),
        password:    cfg.get('DB_PASS',   'password'),
        database:    cfg.get('DB_NAME',   'portfolio_db'),
        entities:    [
          Visitor,
          ContactMessage,
          Project,
          Payment,
          InsightsAccess,
          NewsletterSubscriber,
          PortfolioUpdate,
        ],
        synchronize: cfg.get('NODE_ENV', 'development') !== 'production',
        logging:     false,
      }),
    }),

    // Rate-limit: 60 requests / minute per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    // Feature modules
    VisitorModule,
    ContactModule,
    AuthModule,
    ProjectModule,
    PaymentModule,
    NewsletterModule,
    PortfolioUpdateModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
