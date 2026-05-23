import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus, ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

/** Strip stack traces & internal details from all unhandled errors in production */
@Catch()
class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx  = host.switchToHttp();
    const res  = ctx.getResponse();
    const isProd = process.env.NODE_ENV === 'production';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body   = exception.getResponse();
      return res.status(status).json(
        typeof body === 'object' ? body : { statusCode: status, message: body },
      );
    }

    console.error('[Unhandled]', exception);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: isProd ? 'Internal server error' : String(exception),
    });
  }
}

function corsOrigins(): string[] {
  const extras = process.env.ADDITIONAL_CORS_ORIGINS;
  const fromEnv = extras
    ? extras.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  if (process.env.NODE_ENV === 'production') {
    const main = process.env.FRONTEND_URL?.trim();
    if (!main) {
      console.warn('⚠ FRONTEND_URL is unset in production — browsers cannot call your API until you set it.');
    }
    return [...new Set(fromEnv.concat(main ? [main] : []))];
  }
  return [...new Set(['http://localhost:4200', process.env.FRONTEND_URL || 'http://localhost:4200', ...fromEnv])];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc:  ["'self'"],
          scriptSrc:   ["'self'", 'https://checkout.razorpay.com'],
          frameSrc:    ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
          connectSrc:  ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
          imgSrc:      ["'self'", 'data:', 'https:'],
          styleSrc:    ["'self'", "'unsafe-inline'"],
          fontSrc:     ["'self'", 'https:', 'data:'],
          objectSrc:   ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );
  app.use(compression());

  // ── Body size cap (1 MB) — prevents large-payload DoS ────────────────────
  app.use((req: any, res: any, next: any) => {
    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 1_048_576) {
      return res.status(413).json({ statusCode: 413, message: 'Payload too large.' });
    }
    next();
  });

  // ── CORS ──────────────────────────────────────────────────────────────────
  const origins = corsOrigins();
  if (process.env.NODE_ENV === 'production' && origins.length === 0) {
    throw new Error(
      'Production requires FRONTEND_URL (or ADDITIONAL_CORS_ORIGINS) so CORS can allow your SPA.',
    );
  }
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Global pipes & filters ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalFilters(new SafeExceptionFilter());

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Swagger (dev only by default) ─────────────────────────────────────────
  const cfg = new DocumentBuilder()
    .setTitle('Karan Kapoor — Portfolio API')
    .setDescription('NestJS + PostgreSQL backend for portfolio & visitor analytics')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const enableSwagger =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';

  if (enableSwagger) {
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, cfg));
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 Server running  → http://localhost:${port}`);
  if (enableSwagger) {
    console.log(`📖 Swagger docs   → http://localhost:${port}/api/docs\n`);
  }
}
bootstrap();
