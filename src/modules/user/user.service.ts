import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AdminCreateUserDto } from './dto/admin-create-user';
import { RecaptchaService } from '../auth/recaptcha.service';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<{
    success: boolean;
    message: string;
    data: User;
  }> {
    const isHuman = await this.recaptchaService.verify(
      createUserDto.recaptchaToken,
    );
    if (!isHuman) {
      throw new BadRequestException('Xác minh không hợp lệ');
    }
    const { email, password, name } = createUserDto;
    // Check if the email is exist
    const isEmailExist = await this.userModel.exists({ email: email });
    if (isEmailExist) {
      throw new BadRequestException(
        'Email đã tồn tại, vui lòng thử lại với email khác',
      );
    }
    // Hash password
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
      });
      return {
        success: true,
        message: 'Tạo tài khoản thành công',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search = '',
      } = paginationQuery;

      const skip = (page - 1) * limit;

      const sortOptions = {};
      sortOptions[sort] = order === 'desc' ? -1 : 1;

      const searchQuery = search
        ? {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        this.userModel
          .find(searchQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        this.userModel.countDocuments(searchQuery),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      };
    } catch (error) {
      console.error('Error finding users:', error);
      throw new InternalServerErrorException('Failed to get users');
    }
  }

  findOne(id: string) {
    return this.userModel.findById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      // Nếu có cập nhật mật khẩu
      if (updateUserDto.password) {
        const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
        updateUserDto.password = hashedPassword;
      }

      const updateUser = await this.userModel.findByIdAndUpdate(
        id,
        { ...updateUserDto },
        { new: true },
      );

      return {
        success: true,
        message: 'Cập nhật tài khoản thành công',
        data: updateUser,
      };
    } catch (error) {
      throw new BadRequestException(
        'Không thể cập nhật thông tin: ' + error.message,
      );
    }
  }

  async remove(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      const deleteUser = await this.userModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Xóa tài khoản thành công',
        data: deleteUser,
      };
    } catch (error) {
      throw new BadRequestException(
        'Không thể xóa người dùng: ' + error.message,
      );
    }
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      {
        isApproved: updateStatusDto.isApproved,
        hasAttemptedLogin: updateStatusDto.hasAttemptedLogin,
      },
      { new: true },
    );
    return {
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: updatedUser,
    };
  }

  async createByAdmin(adminCreateUserDto: AdminCreateUserDto): Promise<{
    success: boolean;
    message: string;
    data: User;
  }> {
    const { email, password, name, role, isApproved, hasAttemptedLogin } =
      adminCreateUserDto;
    // Check if the email is exist
    const isEmailExist = await this.userModel.exists({ email: email });
    if (isEmailExist) {
      throw new BadRequestException(
        'Email đã tồn tại, vui lòng thử lại với email khác',
      );
    }

    // Hash password
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
        role,
        isApproved,
        hasAttemptedLogin,
      });
      return {
        success: true,
        message: 'Tạo tài khoản thành công',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
