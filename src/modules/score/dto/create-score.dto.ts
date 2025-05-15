import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateScoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  test_name: string;

  @IsString()
  @IsNotEmpty()
  test_type: string;

  @IsNumber()
  @IsNotEmpty()
  score: number;

  @IsNumber()
  @IsNotEmpty()
  duration: number;
}
