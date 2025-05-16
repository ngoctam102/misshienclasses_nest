import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post('create')
  @UseGuards(AdminGuard)
  create(@Body() createTestDto: CreateTestDto) {
    return this.testService.create(createTestDto);
  }

  @Get('reading')
  @UseGuards(JwtAuthGuard)
  findAllReadingTest(@Query() paginationQuery: PaginationQueryDto) {
    return this.testService.findAllReadingTest(paginationQuery);
  }

  @Get('listening')
  @UseGuards(JwtAuthGuard)
  findAllListeningTest(@Query() paginationQuery: PaginationQueryDto) {
    return this.testService.findAllListeningTest(paginationQuery);
  }

  @Get('all')
  @UseGuards(AdminGuard)
  findAll() {
    return this.testService.findAll();
  }

  @Get('by-id/:id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.testService.findOne(id);
  }

  @Get('by-slug/:slug')
  @UseGuards(JwtAuthGuard)
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
