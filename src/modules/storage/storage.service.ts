import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: any): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${filename}`;
  }

  async uploadBase64(base64Data: string, extension = 'png'): Promise<string> {
    const filename = `${uuidv4()}.${extension}`;
    const filepath = path.join(this.uploadDir, filename);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filepath, buffer);

    const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const filename = path.basename(fileUrl);
    const filepath = path.join(this.uploadDir, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}
