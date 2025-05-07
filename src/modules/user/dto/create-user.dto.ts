import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// DTO cho người dùng thông thường đăng ký
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  recaptchaToken: string;
}
