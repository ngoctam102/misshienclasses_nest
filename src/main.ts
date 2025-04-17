import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  // Cấu hình CORS
  const corsOptions = {
    origin: isProduction
      ? [configService.get('FRONTEND_URL')] // Chỉ cho phép domain production
      : ['http://localhost:3000'], // Cho phép localhost trong development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cho phép gửi cookie và header Authorization
    allowedHeaders: ['Content-Type', 'Authorization'], // Cho phép header Authorization
    exposedHeaders: ['Authorization'], // Cho phép client đọc token
    maxAge: 86400, // 24 hours
  };
  app.enableCors(corsOptions); // Cấu hình CORS

  // Sử dụng cookie-parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các thuộc tính không được định nghĩa trong DTO
      forbidNonWhitelisted: true, // Từ chối các thuộc tính không được định nghĩa trong DTO
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api'); // Đặt prefix cho các route

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
