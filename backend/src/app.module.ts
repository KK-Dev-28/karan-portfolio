import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';

import { Visitor }        from './visitor/visitor.entity';
import { ContactMessage } from './contact/contact.entity';
import { Project }        from './project/project.entity';
import { Payment }        from './payment/payment.entity';
import { InsightsAccess } from './payment/insights-access.entity';
import { NewsletterSubscriber } from './newsletter/newsletter.entity';
import { PortfolioUpdate } from './portfolio-update/portfolio-update.entity';
import { SiteContent }   from './site-content/site-content.entity';
import { Review }        from './reviews/review.entity';
import { ServiceOrder }  from './service-orders/service-order.entity';
import { Survey }        from './survey/survey.entity';
import { SurveyResponse } from './survey/survey-response.entity';
import { Demo }          from './demos/demo.entity';
import { Booking }       from './booking/booking.entity';
import { BlogPost }      from './blog/blog-post.entity';
import { BlogAccess }    from './blog/blog-access.entity';
import { BlogUser }      from './blog/blog-user.entity';
import { FreeUsage }          from './ai-tools/free-usage.entity';
import { EmailVerification }  from './ai-tools/email-verification.entity';
import { Reaction }           from './reactions/reaction.entity';

import { VisitorModule } from './visitor/visitor.module';
import { ContactModule } from './contact/contact.module';
import { AuthModule }    from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { AdminModule }   from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { PortfolioUpdateModule } from './portfolio-update/portfolio-update.module';
import { HealthModule } from './health/health.module';
import { ResumeModule } from './resume/resume.module';
import { ChatModule } from './chat/chat.module';
import { SiteContentModule } from './site-content/site-content.module';
import { ReviewModule }  from './reviews/review.module';
import { ServiceOrderModule } from './service-orders/service-order.module';
import { SurveyModule }  from './survey/survey.module';
import { DemoModule }   from './demos/demo.module';
import { BookingModule } from './booking/booking.module';
import { BlogModule }   from './blog/blog.module';
import { AiToolsModule } from './ai-tools/ai-tools.module';
import { ReactionModule } from './reactions/reaction.module';
import { parseDatabaseUrl } from './database/parse-database-url';

@Module({
  imports: [
    CqrsModule.forRoot(),
    // Load .env from backend folder whether you start Nest from repo root or backend/
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '.env'),
        join(process.cwd(), 'backend', '.env'),
        join(process.cwd(), '.env'),
      ],
    }),

    // PostgreSQL connection via TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isProd = cfg.get('NODE_ENV', 'development') === 'production';
        const fromUrl = parseDatabaseUrl(cfg.get<string>('DATABASE_URL') || '');
        const host = fromUrl?.host ?? cfg.get('DB_HOST', 'localhost');
        const sslExplicit = cfg.get('DB_SSL');
        const useSsl =
          sslExplicit === 'true' ||
          sslExplicit === '1' ||
          (sslExplicit !== 'false' &&
            sslExplicit !== '0' &&
            isProd &&
            host !== 'localhost' &&
            host !== '127.0.0.1');

        const syncBootstrap = cfg.get('DATABASE_SYNC') === 'true';
        const synchronize = syncBootstrap || !isProd;
        if (syncBootstrap && isProd) {
          console.warn(
            '⚠ DATABASE_SYNC=true → TypeORM synchronize is ON in production. Create tables once, redeploy without this var, then rely on migrations for future schema changes.',
          );
        }

        return {
        type:        'postgres',
        host,
        port:        fromUrl?.port ?? cfg.get<number>('DB_PORT', 5432),
        username:    fromUrl?.username ?? cfg.get('DB_USER', 'postgres'),
        password:    fromUrl?.password ?? cfg.get('DB_PASS', 'password'),
        database:    fromUrl?.database ?? cfg.get('DB_NAME', 'portfolio_db'),
        ...(useSsl ? { ssl: { rejectUnauthorized: cfg.get('DB_SSL_REJECT_UNAUTHORIZED') !== 'false' } } : {}),
        entities:    [
          Visitor,
          ContactMessage,
          Project,
          Payment,
          InsightsAccess,
          NewsletterSubscriber,
          PortfolioUpdate,
          SiteContent,
          Review,
          ServiceOrder,
          Survey,
          SurveyResponse,
          Demo,
          Booking,
          BlogPost,
          BlogAccess,
          BlogUser,
          FreeUsage,
          EmailVerification,
          Reaction,
        ],
        synchronize,
        logging:     false,
        };
      },
    }),

    /* Global backstop only. The home page mounts ~25 sections, so a single
       visit can legitimately issue a dozen or more requests; a tight global
       number would throttle real people before it ever troubled a script.
       Endpoints that actually need a low ceiling — chat, auth, checkout —
       carry their own @Throttle, and those numbers win over this one. */
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),

    // Feature modules
    VisitorModule,
    ContactModule,
    AuthModule,
    ProjectModule,
    PaymentModule,
    NewsletterModule,
    PortfolioUpdateModule,
    HealthModule,
    ResumeModule,
    SiteContentModule,
    ChatModule,
    ReviewModule,
    ServiceOrderModule,
    SurveyModule,
    DemoModule,
    BookingModule,
    BlogModule,
    AiToolsModule,
    ReactionModule,
    AdminModule,
  ],
  providers: [
    /* Without this, ThrottlerGuard only runs where a controller declares it in
       @UseGuards — which was true of just auth and ai-tools. Every other
       @Throttle in the codebase (24 of them, across chat, payments, bookings,
       reviews, newsletter and more) was metadata no guard ever read, so those
       endpoints were unlimited despite being annotated as limited. The Razorpay
       webhook already carries @SkipThrottle(), which only makes sense against a
       global guard, so the registration was the missing piece rather than the
       decorators being wrong. */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
