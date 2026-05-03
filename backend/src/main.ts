import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

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

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

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

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger docs at /api/docs
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
