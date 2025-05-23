import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Req,
  UnauthorizedException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { AdminGuard } from './guards/admin.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, role } = await this.authService.login(loginDto);

    console.log('Login result:', {
      role: role,
      tokenExpiration: role === 'admin' ? '365d' : '30s',
    });

    // Xóa cookie cũ nếu có
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : undefined,
    });

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : undefined,
    });

    return {
      success: true,
      message: 'Đăng nhập thành công, chờ duyệt tài khoản',
      accessToken: accessToken,
      role: role,
    };
  }

  @Get('pending')
  findPendingUser(@Req() req: Request) {
    const token: string = req.cookies?.token;
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy token');
    }
    return this.authService.findPendingUser(token);
  }

  @Patch('approve/:id')
  @UseGuards(AdminGuard)
  async approveUser(@Param('id') id: string) {
    return this.authService.approveUser(id);
  }

  @Patch('reject/:id')
  @UseGuards(AdminGuard)
  rejectUser(@Param('id') id: string) {
    return this.authService.rejectUser(id);
  }

  @Get('check-approval')
  checkApprovedStatus(@Req() req: Request) {
    const token: string = req.cookies?.token;
    if (!token) {
      throw new UnauthorizedException('Không có token');
    }
    return this.authService.checkApprovedStatus(token);
  }

  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token: string = req.cookies?.token;
    console.log('Received cookies:', req.cookies);
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy token');
    }

    console.log('Old token from cookie:', token);
    const { accessToken, role } = await this.authService.refreshToken(token);
    console.log('New token from service:', accessToken);

    // Xóa cookie cũ với đầy đủ options
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : undefined,
    });

    // Set cookie mới với đầy đủ options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : undefined,
    };
    console.log('Setting cookie with options:', cookieOptions);

    res.cookie('token', accessToken, cookieOptions);

    return {
      success: true,
      message: 'Làm mới token thành công',
      accessToken: accessToken,
      role: role,
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    console.log('hàm logout được gọi..');
    const token: string = req.cookies?.token;
    console.log('Đây là token hàm logout lấy được từ cookie: >>', token);

    // Xóa cookie với cấu hình đầy đủ
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : undefined,
    });
    console.log('Xoá cookie thành công');
    try {
      if (token) {
        try {
          await this.authService.logout(token);
        } catch (error) {
          console.error('Lỗi khi logout:', error);
        }
      }
      return {
        success: true,
        message: 'Đăng xuất thành công',
      };
    } catch (error) {
      console.error('LogoutController - Lỗi khi xử lí logout:', error);
      return {
        success: true,
        message: 'Đăng xuất thành công',
      };
    }
  }
}
