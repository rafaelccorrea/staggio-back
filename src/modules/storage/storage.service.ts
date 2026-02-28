import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Multer } from 'multer';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private bucket: string;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET', 'staggio-uploads');
  }

  /**
   * Upload de ficheiro para o Supabase Storage
   */
  async uploadFile(
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    userId: string,
    folder: string = 'general',
  ): Promise<{ url: string; path: string }> {
    if (!file) {
      throw new BadRequestException('Ficheiro não fornecido');
    }

    // Validar tipo de ficheiro
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de ficheiro não suportado. Use: JPEG, PNG, WebP ou GIF.',
      );
    }

    // Validar tamanho (máx 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Ficheiro muito grande. Máximo: 10MB.');
    }

    const extension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = `${userId}/${folder}/${fileName}`;

    try {
      const url = await this.supabaseService.uploadFile(
        this.bucket,
        filePath,
        file.buffer,
        file.mimetype,
      );

      return { url, path: filePath };
    } catch (error) {
      this.logger.error(`Upload error: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao fazer upload do ficheiro');
    }
  }

  /**
   * Upload de múltiplos ficheiros
   */
  async uploadMultiple(
    files: Array<{ buffer: Buffer; mimetype: string; originalname: string; size: number }>,
    userId: string,
    folder: string = 'general',
  ): Promise<Array<{ url: string; path: string }>> {
    const results = await Promise.all(
      files.map((file) => this.uploadFile(file, userId, folder)),
    );
    return results;
  }

  /**
   * Remover ficheiro
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.supabaseService.deleteFile(this.bucket, filePath);
    } catch (error) {
      this.logger.error(`Delete error: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao remover ficheiro');
    }
  }
}
