import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationsService } from './generations.service';
import { GenerationsController } from './generations.controller';
import { Generation } from './entities/generation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Generation])],
  controllers: [GenerationsController],
  providers: [GenerationsService],
  exports: [GenerationsService],
})
export class GenerationsModule {}
