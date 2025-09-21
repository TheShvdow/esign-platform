// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middlewares - ✅ Import direct pour éviter les conflits de versions
  const helmet = require('helmet');
  const compression = require('compression');
    
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true
    }
  }));

  // API documentation - ✅ Simplification pour éviter les conflits de versions
  const config = new DocumentBuilder()
    .setTitle('E-Signature API')
    .setDescription('Enterprise Electronic Signature Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  // ✅ Cast explicite pour éviter les erreurs de compatibilité de versions
  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api', app as any, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
    
  console.log(`🚀 E-Signature API running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap().catch(err => {
  console.error('Error starting application:', err);
  process.exit(1);
});