import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly maxSize: number,
    private readonly allowedMimeTypes: string[],
  ) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy file');
    }

    // Kiểm tra kích thước file
    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `File không được vượt quá ${this.maxSize / (1024 * 1024)}MB`,
      );
    }

    // Kiểm tra định dạng file
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${this.allowedMimeTypes.join(
          ', ',
        )}`,
      );
    }

    return file;
  }
}
