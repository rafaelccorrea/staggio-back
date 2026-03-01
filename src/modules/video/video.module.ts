import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { User } from '../users/entities/user.entity';
import { Generation } from '../generations/entities/generation.entity';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Generation]),
    SupabaseModule,
  ],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
