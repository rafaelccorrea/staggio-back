import { IsString, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType, PropertyStatus } from '../entities/property.entity';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Apartamento Luxo Jardins' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Lindo apartamento com vista panorâmica' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ example: 850000 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  parkingSpots?: number;

  @ApiPropertyOptional({ example: 'Rua Augusta, 1500' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '01310-100' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'Jardins' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: ['Piscina', 'Churrasqueira'] })
  @IsOptional()
  @IsArray()
  features?: string[];
}

export class UpdatePropertyDto extends CreatePropertyDto {
  @ApiPropertyOptional({ enum: PropertyStatus })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}
