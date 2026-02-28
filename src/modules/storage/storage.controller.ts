import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload de ficheiro' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    const url = await this.storageService.uploadFile(file);
    return { url };
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload de múltiplos ficheiros' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: any[]) {
    const urls = await Promise.all(
      files.map((file) => this.storageService.uploadFile(file)),
    );
    return { urls };
  }
}
