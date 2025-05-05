import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../user/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  validateToken(
    token: string,
  ): { sub: string; name: string; role: string; approved: boolean } | null {
    try {
      const decoded = this.jwtService.verify<{
        sub: string;
        name: string;
        role: string;
        approved: boolean;
      }>(token);
      return decoded;
    } catch {
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
  }> {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }
    await this.userModel.findByIdAndUpdate(
      user._id,
      {
        hasAttemptedLogin: true,
      },
      { new: true },
    );
    const payload = {
      sub: user._id,
      name: user.name,
      role: user.role,
      approved: user.isApproved,
    };
    return {
      success: true,
      message: 'Đăng nhập thành công, chờ duyệt tài khoản',
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async logout(token: string) {
    const decoded = await this.jwtService.verify(token);
    await this.userModel.findByIdAndUpdate(
      decoded.sub,
      {
        hasAttemptedLogin: false,
        isApproved: false,
      },
      { new: true },
    );
    return {
      success: true,
      message: 'Đăng xuất thành công',
    };
  }

  async findPendingUser(token: string) {
    try {
      const decoded = await this.jwtService.verify(token);
      if (decoded.role !== 'admin') {
        throw new UnauthorizedException('Bạn không có quyền truy cập');
      }
      const pendingUser = await this.userModel
        .find({
          role: { $ne: 'admin' },
          isApproved: false,
          hasAttemptedLogin: true,
        })
        .select('name email _id');
      return {
        success: true,
        message: 'Danh sách tài khoản chờ duyệt',
        data: pendingUser,
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  async approveUser(id: string) {
    const approveUser = await this.userModel.findByIdAndUpdate(
      id,
      {
        isApproved: true,
      },
      { new: true },
    );
    return {
      success: true,
      message: 'Duyệt tài khoản thành công',
      data: approveUser,
    };
  }

  async rejectUser(id: string) {
    const rejectUser = await this.userModel.findByIdAndUpdate(
      id,
      { hasAttemptedLogin: false },
      { new: true },
    );
    return {
      success: true,
      message: 'Từ chối tài khoản thành công',
      data: rejectUser,
    };
  }

  async checkApprovedStatus(token: string) {
    const decoded = this.jwtService.verify(token);
    const user = await this.userModel.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    if (user.isApproved && user.hasAttemptedLogin) {
      return {
        success: true,
        message: 'Tài khoản đã được duyệt',
      };
    } else if (!user.isApproved && !user.hasAttemptedLogin) {
      return {
        success: false,
        reason: 'rejected',
        message: 'Tài khoản không được duyệt',
      };
    } else {
      return {
        success: false,
        reason: 'pending',
        message: 'Tài khoản đang chờ duyệt',
      };
    }
  }

  async refreshToken(token: string) {
    const payload = await this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    const newAccessToken = this.jwtService.sign(
      {
        sub: payload.sub,
        approved: user.isApproved,
        name: payload.name,
        role: payload.role,
      },
      { secret: process.env.JWT_SECRET, expiresIn: '2h' },
    );
    return {
      accessToken: newAccessToken,
    };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
