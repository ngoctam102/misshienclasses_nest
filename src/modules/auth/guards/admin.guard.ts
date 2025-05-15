import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.token as string;

    if (!token) {
      throw new UnauthorizedException('Không tìm thấy token');
    }

    // Bước 1: Verify token và lấy thông tin user
    const decodedToken = (await this.authService.validateToken(token)) as {
      sub: string;
      name: string;
      role: string;
      approved: boolean;
      email: string;
    };
    if (!decodedToken) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Bước 2: Kiểm tra user có thực sự tồn tại và là admin trong database
    const user = await this.userService.findById(decodedToken.sub);
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện chức năng này',
      );
    }

    // Lưu thông tin user vào request để sử dụng ở các bước tiếp theo
    request.user = user;
    return true;
  }
}
