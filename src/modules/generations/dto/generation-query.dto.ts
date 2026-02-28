import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { GenerationType, GenerationStatus } from '../entities/generation.entity';

export class GenerationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por tipo', enum: GenerationType })
  @IsOptional()
  @IsEnum(GenerationType)
  type?: GenerationType;

  @ApiPropertyOptional({ description: 'Filtrar por status', enum: GenerationStatus })
  @IsOptional()
  @IsEnum(GenerationStatus)
  status?: GenerationStatus;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
