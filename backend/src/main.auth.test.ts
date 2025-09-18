import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppAuthTestModule } from './app.auth.test.module';

async function bootstrap() {
  const app = await NestFactory.create(AppAuthTestModule);
  
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
  
  const port = process.env['PORT'] || 4003;
  await app.listen(port);
  
  console.log(`🚀 Eufy GEO Auth Test API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`🔐 Authentication module with mock database ready!`);
  console.log(`\nTest credentials:\n  Email: admin@eufy.com\n  Password: test123`);
}

bootstrap();