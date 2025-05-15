import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ScoreService } from './score.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '@/modules/auth/guards/admin.guard';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  create(@Body() createScoreDto: CreateScoreDto, @Request() req) {
    return this.scoreService.create(createScoreDto, req.user);
  }

  @Get('all')
  @UseGuards(AdminGuard)
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.scoreService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scoreService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScoreDto: UpdateScoreDto) {
    return this.scoreService.update(+id, updateScoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scoreService.remove(+id);
  }
}
