import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppTestModule } from './app.test.module';

async function bootstrap() {
  const app = await NestFactory.create(AppTestModule);
  
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
  
  const port = process.env['PORT'] || 4001;
  await app.listen(port);
  
  console.log(`🚀 Eufy GEO Platform Test API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();