import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post('create')
  create(@Body() createTestDto: CreateTestDto) {
    return this.testService.create(createTestDto);
  }

  @Get('reading')
  findAllReadingTest() {
    return this.testService.findAllReadingTest();
  }

  @Get('listening')
  findAllListeningTest() {
    return this.testService.findAllListeningTest();
  }

  @Get(':slug')
  getTestBySlug(@Param('slug') slug: string) {
    return this.testService.getTestBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
    // @Body giúp chuyển đổi dữ liệu từ JSON sang dạng object, updateTestDto là một js object
    return this.testService.update(id, updateTestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testService.remove(id);
  }
}
