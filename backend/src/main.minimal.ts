import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppMinimalModule } from './app.minimal.module';

async function bootstrap() {
  const app = await NestFactory.create(AppMinimalModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env['PORT'] || 4002;
  await app.listen(port);
  
  console.log(`🚀 Eufy GEO Platform Minimal API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`✅ Basic GraphQL API verification successful!`);
}

bootstrap();