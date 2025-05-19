import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../user/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RecaptchaService } from '@/modules/auth/recaptcha.service';
import { BadRequestException } from '@nestjs/common';
@Injectable()
export class AuthService {
  // Thời gian hết hạn token
  private readonly TOKEN_EXPIRATION = {
    admin: '365d',
    user: '2h',
  };

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  async validateToken(token: string): Promise<{
    sub: string;
    name: string;
    role: string;
    approved: boolean;
    email: string;
  } | null> {
    console.log(
      'AuthService - Bắt đầu validateToken với token:',
      token.substring(0, 20) + '...',
    );
    try {
      const decoded = this.jwtService.verify<{
        sub: string;
        name: string;
        role: string;
        approved: boolean;
        email: string;
      }>(token);
      console.log('AuthService - Token hợp lệ, thông tin user:', decoded);
      return decoded;
    } catch (error) {
      console.log(
        'AuthService - Lỗi xác thực token trong validateToken:',
        error,
      );
      // Khi token hết hạn, reset trạng thái user
      try {
        const decoded = this.jwtService.decode(token);
        if (decoded && typeof decoded === 'object' && 'sub' in decoded) {
          console.log(
            'AuthService - Đang reset trạng thái user với ID:',
            decoded.sub,
          );
          const result = await this.userModel.findByIdAndUpdate(
            decoded.sub,
            {
              hasAttemptedLogin: false,
              isApproved: false,
            },
            { new: true },
          );
          if (result) {
            console.log('AuthService - Đã reset trạng thái user thành công');
          } else {
            console.warn('AuthService - Không tìm thấy user để reset!!');
          }
        }
      } catch (decodeError) {
        console.error('AuthService - Lỗi khi decode token:', decodeError);
      }
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
    role: string;
  }> {
    const isHuman = await this.recaptchaService.verify(loginDto.recaptchaToken);
    if (!isHuman) {
      throw new BadRequestException('Xác minh không hợp lệ');
    }
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
    const expiresIn =
      user.role === 'admin'
        ? this.TOKEN_EXPIRATION.admin
        : this.TOKEN_EXPIRATION.user;
    const payload = {
      sub: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.isApproved,
    };
    return {
      success: true,
      message: 'Đăng nhập thành công, chờ duyệt tài khoản',
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: expiresIn,
      }),
      role: user.role,
    };
  }

  async logout(token: string) {
    try {
      // Thử decode token để lấy thông tin user
      const decoded = this.jwtService.decode(token);
      if (!decoded || !decoded.sub) {
        console.warn('AuthService - Token không hợp lệ hoặc không có sub');
        return {
          success: true,
          message: 'Đăng xuất thành công',
        };
      }

      // Reset trạng thái user
      const result = await this.userModel.findByIdAndUpdate(
        decoded.sub,
        {
          hasAttemptedLogin: false,
          isApproved: false,
        },
        { new: true },
      );

      if (!result) {
        console.warn('AuthService - Không tìm thấy user để reset trạng thái');
      } else {
        console.log(
          'AuthService - Đã reset trạng thái user thành công:',
          result._id,
        );
      }

      return {
        success: true,
        message: 'Đăng xuất thành công',
      };
    } catch (error) {
      console.error('AuthService - Lỗi khi logout:', error);
      // Vẫn trả về success để frontend có thể xóa cookie
      return {
        success: true,
        message: 'Đăng xuất thành công',
      };
    }
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

    if (!approveUser) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      message: 'Duyệt tài khoản thành công',
      data: approveUser,
    };
  }

  async rejectUser(id: string) {
    const rejectUser = await this.userModel.findByIdAndUpdate(
      id,
      {
        hasAttemptedLogin: false,
        isApproved: false,
      },
      { new: true },
    );
    if (!rejectUser) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
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

    console.log('User before refresh:', {
      id: user._id,
      isApproved: user.isApproved,
      role: user.role,
    });

    const expiresIn =
      user.role === 'admin'
        ? this.TOKEN_EXPIRATION.admin
        : this.TOKEN_EXPIRATION.user;
    const newAccessToken = this.jwtService.sign(
      {
        sub: payload.sub,
        approved: user.isApproved,
        name: payload.name,
        role: payload.role,
        email: payload.email,
      },
      { secret: process.env.JWT_SECRET, expiresIn: expiresIn },
    );

    // Verify token mới để kiểm tra
    const decodedNewToken = this.jwtService.verify(newAccessToken, {
      secret: process.env.JWT_SECRET,
    });
    console.log('New token payload:', decodedNewToken);

    return {
      success: true,
      message: 'Làm mới token thành công',
      accessToken: newAccessToken,
      role: payload.role,
    };
  }

  async resetUserStatus(userId: string) {
    console.log('AuthService - Bắt đầu reset trạng thái user:', userId);
    try {
      const result = await this.userModel.findByIdAndUpdate(
        userId,
        {
          hasAttemptedLogin: false,
          isApproved: false,
        },
        { new: true },
      );
      console.log('AuthService - Kết quả reset trạng thái:', result);
      if (!result) {
        console.warn(
          'AuthService - Không tìm thấy user để reset với ID:',
          userId,
        );
      }
      return result;
    } catch (error) {
      console.error('AuthService - Lỗi khi reset trạng thái user:', error);
      throw error;
    }
  }

  decodeToken(token: string): { sub: string } | null {
    try {
      const decoded = this.jwtService.decode(token);
      if (decoded && typeof decoded === 'object' && 'sub' in decoded) {
        return { sub: decoded.sub };
      }
      return null;
    } catch {
      return null;
    }
  }
}
