import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum StagingStyle {
  MODERN = 'moderno',
  CLASSIC = 'classico',
  MINIMALIST = 'minimalista',
  INDUSTRIAL = 'industrial',
  RUSTIC = 'rustico',
  LUXURY = 'luxo',
}

export enum BuildingType {
  HOUSE = 'casa',
  APARTMENT_BUILDING = 'predio',
  COMMERCIAL = 'comercial',
  TOWNHOUSE = 'sobrado',
}

export class StagingDto {
  @ApiProperty({ description: 'URL da imagem do ambiente', example: 'https://storage.supabase.co/...' })
  @IsNotEmpty({ message: 'URL da imagem é obrigatória' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ description: 'Estilo de decoração', enum: StagingStyle })
  @IsNotEmpty()
  @IsEnum(StagingStyle)
  style: StagingStyle;

  @ApiPropertyOptional({ description: 'Tipo de ambiente', example: 'sala de estar' })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ description: 'ID do imóvel associado' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}

export class TerrainVisionDto {
  @ApiProperty({ description: 'URL da imagem do terreno' })
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @ApiProperty({ description: 'Tipo de construção', enum: BuildingType })
  @IsNotEmpty()
  @IsEnum(BuildingType)
  buildingType: BuildingType;

  @ApiPropertyOptional({ description: 'Estilo arquitetônico', example: 'contemporâneo' })
  @IsOptional()
  @IsString()
  architectureStyle?: string;

  @ApiPropertyOptional({ description: 'ID do imóvel associado' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}

export class DescriptionDto {
  @ApiProperty({ description: 'Título do imóvel', example: 'Casa moderna com piscina' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Tipo do imóvel', example: 'casa' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Área em m²', example: '250' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Quartos', example: '3' })
  @IsOptional()
  @IsString()
  bedrooms?: string;

  @ApiPropertyOptional({ description: 'Banheiros', example: '2' })
  @IsOptional()
  @IsString()
  bathrooms?: string;

  @ApiPropertyOptional({ description: 'Vagas', example: '2' })
  @IsOptional()
  @IsString()
  parkingSpots?: string;

  @ApiPropertyOptional({ description: 'Bairro', example: 'Jardins' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Cidade', example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Características extras', example: 'piscina, churrasqueira' })
  @IsOptional()
  @IsString()
  features?: string;

  @ApiPropertyOptional({ description: 'Tom do texto', example: 'profissional' })
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional({ description: 'ID do imóvel associado' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}

export class PhotoEnhanceDto {
  @ApiProperty({ description: 'URL da imagem original' })
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Tipo de melhoria', example: 'iluminação' })
  @IsOptional()
  @IsString()
  enhanceType?: string;

  @ApiPropertyOptional({ description: 'ID do imóvel associado' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}

export class ChatDto {
  @ApiProperty({ description: 'Mensagem do utilizador', example: 'Como posso vender mais rápido?' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Histórico de mensagens anteriores', type: [Object] })
  @IsOptional()
  history?: Array<{ role: string; content: string }>;
}
