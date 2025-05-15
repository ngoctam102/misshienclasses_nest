import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    const token = request.cookies?.token;

    console.log('JwtAuthGuard - Token info:', {
      token: token ? 'exists' : 'not exists',
      cookie: request.cookies,
      headers: request.headers,
    });

    if (!token) {
      console.log('JwtAuthGuard - Không tìm thấy token trong cookie');
      throw new UnauthorizedException('Không tìm thấy token');
    }

    try {
      console.log('JwtAuthGuard - Bắt đầu validate token');
      const user = (await this.authService.validateToken(token as string)) as {
        sub: string;
        name: string;
        role: string;
        approved: boolean;
        email: string;
      };
      console.log('JwtAuthGuard - Kết quả validate token:', user);

      if (!user) {
        console.log('JwtAuthGuard - Token không hợp lệ, xóa cookie');
        response.clearCookie('token');
        throw new UnauthorizedException('Token không hợp lệ');
      }

      request.user = user;
      return true;
    } catch (error) {
      console.log('JwtAuthGuard - Lỗi xác thực token:', error);
      response.clearCookie('token');

      // Kiểm tra loại lỗi và trả về thông báo phù hợp
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      } else {
        throw new UnauthorizedException(
          'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
        );
      }
    }
  }
}
