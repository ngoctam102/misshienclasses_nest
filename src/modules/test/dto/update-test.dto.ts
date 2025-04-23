import { PartialType } from '@nestjs/mapped-types'; // kế thừa tất cả từ create-test.dto
import { CreateTestDto } from './create-test.dto';

export class UpdateTestDto extends PartialType(CreateTestDto) {}
