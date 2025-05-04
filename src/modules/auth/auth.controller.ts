import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
  approveUser(@Param('id') id: string) {
    return this.authService.approveUser(id);
  }

  @Patch('reject/:id')
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
  refreshToken(@Req() req: Request) {
    const token: string = req.cookies?.token;
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }
    return this.authService.refreshToken(token);
  }

  @Post('logout')
  logout(@Req() req: Request) {
    const token: string = req.cookies?.token;
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }
    return this.authService.logout(token);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
