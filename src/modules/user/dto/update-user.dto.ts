import { PartialType } from '@nestjs/mapped-types';
import { AdminCreateUserDto } from './admin-create-user';

export class UpdateUserDto extends PartialType(AdminCreateUserDto) {}
