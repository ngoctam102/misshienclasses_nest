import { IsBoolean } from 'class-validator';

export class UpdateStatusDto {
  @IsBoolean()
  isApproved: boolean;

  @IsBoolean()
  hasAttemptedLogin: boolean;
}
