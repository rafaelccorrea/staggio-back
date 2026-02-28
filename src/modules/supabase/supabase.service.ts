import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  /**
   * Upload de ficheiro para o Supabase Storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const { data, error } = await this.supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase Storage upload error: ${error.message}`);
    }

    const { data: urlData } = this.supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  /**
   * Remover ficheiro do Supabase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Supabase Storage delete error: ${error.message}`);
    }
  }

  /**
   * Listar ficheiros de um bucket
   */
  async listFiles(bucket: string, folder?: string) {
    const { data, error } = await this.supabaseAdmin.storage
      .from(bucket)
      .list(folder || '');

    if (error) {
      throw new Error(`Supabase Storage list error: ${error.message}`);
    }

    return data;
  }
}
