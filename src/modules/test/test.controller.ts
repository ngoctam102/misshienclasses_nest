import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post('create')
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
    return this.testService.update(id, updateTestDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.testService.remove(id);
  }
}
