import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.use(helmet());
  app.use(compression());

  // CORS — allow Angular dev server + production URL
  app.enableCors({
    origin: [
      'http://localhost:4200',
      process.env.FRONTEND_URL || 'http://localhost:4200',
    ],
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
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, cfg));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 Server running  → http://localhost:${port}`);
  console.log(`📖 Swagger docs   → http://localhost:${port}/api/docs\n`);
}
bootstrap();
