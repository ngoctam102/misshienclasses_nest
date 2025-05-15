import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
console.log('STATIC PATH:', path.resolve(__dirname, '..', 'public'));
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  // Cấu hình CORS
  const corsOptions = {
    origin: isProduction
      ? [configService.get('FRONTEND_URL')] // Chỉ cho phép domain production
      : 'http://localhost:3000', // Cho phép cả localhost:3000
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cho phép gửi cookie và header Authorization
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], // Thêm Cookie vào allowed headers
    exposedHeaders: ['Set-Cookie', 'Authorization'], // Thêm Set-Cookie vào exposed headers
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

  // Cấu hình static file TRƯỚC KHI đặt global prefix
  app.useStaticAssets(path.join(__dirname, '..', 'public'), {
    prefix: '/uploads/', // Thêm prefix cho static files
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
  // Global prefix
  app.setGlobalPrefix('api'); // Đặt prefix cho các route

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
