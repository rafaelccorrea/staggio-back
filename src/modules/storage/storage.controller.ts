import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload de ficheiro' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'general' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ficheiro enviado com sucesso' })
  async upload(
    @CurrentUser() user: User,
    @UploadedFile() file: any,
    @Body('folder') folder?: string,
  ) {
    return this.storageService.uploadFile(file, user.id, folder);
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload de múltiplos ficheiros' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        folder: { type: 'string', default: 'general' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ficheiros enviados com sucesso' })
  async uploadMultiple(
    @CurrentUser() user: User,
    @UploadedFiles() files: any[],
    @Body('folder') folder?: string,
  ) {
    return this.storageService.uploadMultiple(files, user.id, folder);
  }

  @Delete()
  @ApiOperation({ summary: 'Remover ficheiro' })
  @ApiBody({ schema: { properties: { path: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Ficheiro removido com sucesso' })
  async deleteFile(@Body('path') path: string) {
    await this.storageService.deleteFile(path);
    return { message: 'Ficheiro removido com sucesso' };
  }
}
