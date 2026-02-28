import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { User } from '../users/entities/user.entity';
import { Generation } from '../generations/entities/generation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Generation])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
