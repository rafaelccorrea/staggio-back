import { IsString, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateDescriptionDto {
  @ApiProperty({ example: 'Apartamento' })
  @IsString()
  propertyType: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({ example: 'Jardins' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: ['Piscina', 'Churrasqueira', 'Varanda Gourmet'] })
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiPropertyOptional({ example: 850000 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

export class GenerateStagingDto {
  @ApiProperty({ example: 'modern', description: 'Estilo: modern, classic, minimalist, industrial, scandinavian' })
  @IsString()
  style: string;

  @ApiProperty({ example: 'living_room', description: 'Tipo: living_room, bedroom, kitchen, bathroom, office' })
  @IsString()
  roomType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalInstructions?: string;
}

export class GenerateTerrainVisionDto {
  @ApiProperty({ example: 'residential_house', description: 'Tipo: residential_house, apartment_building, commercial' })
  @IsString()
  buildingType: string;

  @ApiProperty({ example: 'modern', description: 'Estilo: modern, colonial, contemporary, minimalist' })
  @IsString()
  style: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  floors?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalInstructions?: string;
}

export class PhotoEnhanceDto {
  @ApiProperty({ example: 'lighting', description: 'Tipo: lighting, sky_replacement, declutter, color_correction, hdr' })
  @IsString()
  enhancementType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalInstructions?: string;
}

export class ChatAssistantDto {
  @ApiProperty({ example: 'Como posso melhorar a apresentação deste imóvel?' })
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;
}
