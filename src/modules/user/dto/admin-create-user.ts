import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class AdminCreateUserDto extends CreateUserDto {
  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsBoolean()
  isApproved: boolean;

  @IsNotEmpty()
  @IsBoolean()
  hasAttemptedLogin: boolean;
}
