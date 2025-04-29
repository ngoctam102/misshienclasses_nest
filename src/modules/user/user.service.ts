import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UpdateStatusDto } from './dto/update-status.dto';
@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async create(createUserDto: CreateUserDto): Promise<{
    success: boolean;
    message: string;
    data: User;
  }> {
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

  findAll() {
    return this.userModel.find();
  }

  findOne(id: string) {
    return this.userModel.findById(id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const updateUser = this.userModel.findByIdAndUpdate(
      id,
      { ...updateUserDto },
      { new: true },
    );
    return {
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: updateUser,
    };
  }

  remove(id: string) {
    const deleteUser = this.userModel.findByIdAndDelete(id);
    return {
      success: true,
      message: 'Xóa tài khoản thành công',
      data: deleteUser,
    };
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
}
