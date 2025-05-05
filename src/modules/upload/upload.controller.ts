import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FileValidationPipe } from './pipes/file-validation.pipe';

@Controller('upload')
@UseGuards(AdminGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('audio')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAudio(
    @UploadedFile(
      new FileValidationPipe(15 * 1024 * 1024, [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
      ]),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadAudio(file);
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile(
      new FileValidationPipe(5 * 1024 * 1024, [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ]),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadImage(file);
  }
}
