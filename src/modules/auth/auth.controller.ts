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
  // Thời gian hết hạn cookie
  private readonly COOKIE_EXPIRATION = {
    admin: 365 * 24 * 60 * 60 * 1000, // 1 năm
    user: 2 * 60 * 1000, // 2 giờ tính bằng milliseconds
  };

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    console.log('Login result:', {
      role: result.role,
      tokenExpiration: result.role === 'admin' ? '365d' : '30s',
      cookieExpiration:
        result.role === 'admin'
          ? this.COOKIE_EXPIRATION.admin
          : this.COOKIE_EXPIRATION.user,
    });

    // Xóa cookie cũ nếu có
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    const maxAge =
      result.role === 'admin'
        ? this.COOKIE_EXPIRATION.admin
        : this.COOKIE_EXPIRATION.user;
    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: maxAge,
    });

    return result;
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
    const result = await this.authService.refreshToken(token);
    console.log('New token from service:', result.accessToken);

    // Xóa cookie cũ với đầy đủ options
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // Set cookie mới với đầy đủ options
    const maxAge =
      result.role === 'admin'
        ? this.COOKIE_EXPIRATION.admin
        : this.COOKIE_EXPIRATION.user;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: maxAge,
    };
    console.log('Setting cookie with options:', cookieOptions);

    res.cookie('token', result.accessToken, cookieOptions);

    return result;
  }

  @Post('logout')
  logout(@Req() req: Request) {
    console.log('hàm logout được gọi..');
    const token: string = req.cookies?.token;
    console.log('Đây là token hàm logout lấy được từ cookie: >>', token);
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }
    return this.authService.logout(token);
  }
}
