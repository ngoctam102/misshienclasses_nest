import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { S3 } from 'aws-sdk';

@Injectable()
export class UploadService {
  private s3: S3;
  private storageType: string;

  constructor(private configService: ConfigService) {
    this.storageType = this.configService.get('STORAGE_TYPE') || 'local';

    if (this.storageType === 's3') {
      this.s3 = new S3({
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        region: this.configService.get('AWS_REGION'),
      });
    }

    // Tạo thư mục uploads nếu chưa tồn tại
    if (this.storageType === 'local') {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }
  }

  async uploadAudio(file: Express.Multer.File): Promise<{
    success: boolean;
    message: string;
    url: string;
  }> {
    if (this.storageType === 'local') {
      return this.uploadToLocal(file, 'audio');
    } else {
      return this.uploadToS3(file, 'audio');
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<{
    success: boolean;
    message: string;
    url: string;
  }> {
    if (this.storageType === 'local') {
      return this.uploadToLocal(file, 'images');
    } else {
      return this.uploadToS3(file, 'images');
    }
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{
    success: boolean;
    message: string;
    url: string;
  }> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginalName = file.originalname.replace(/\s+/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedOriginalName}`;
    const filePath = path.join(uploadDir, filename);

    if (!file.buffer) {
      throw new Error('File buffer is missing');
    }

    await fs.promises.writeFile(filePath, Buffer.from(file.buffer));
    return {
      success: true,
      message: 'Upload file thành công',
      url: `/uploads/${folder}/${filename}`,
    };
  }

  private async uploadToS3(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{
    success: boolean;
    message: string;
    url: string;
  }> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginalName = file.originalname.replace(/\s+/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedOriginalName}`;
    const key = `${folder}/${filename}`;

    if (!file.buffer) {
      throw new Error('File buffer is missing');
    }

    const params = {
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: key,
      Body: Buffer.from(file.buffer),
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    await this.s3.upload(params).promise();

    return {
      success: true,
      message: 'Upload file thành công',
      url: `https://${this.configService.get('AWS_BUCKET_NAME')}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`,
    };
  }
}
