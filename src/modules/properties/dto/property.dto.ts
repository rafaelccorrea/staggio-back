import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { PropertyType, PropertyStatus } from '../entities/property.entity';

export class CreatePropertyDto {
  @ApiProperty({ description: 'Título do imóvel', example: 'Casa moderna com piscina' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Descrição do imóvel' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tipo do imóvel', enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ description: 'Preço', example: 850000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Área em m²', example: 250 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @ApiPropertyOptional({ description: 'Quartos', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Banheiros', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Vagas de garagem', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  parkingSpots?: number;

  @ApiPropertyOptional({ description: 'Endereço', example: 'Rua das Flores, 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade', example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Estado', example: 'SP' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ description: 'Bairro', example: 'Jardins' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'CEP', example: '01234-567' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @ApiPropertyOptional({ description: 'URLs das imagens', type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ description: 'Características', type: [String] })
  @IsOptional()
  @IsArray()
  features?: string[];
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @ApiPropertyOptional({ description: 'Status do imóvel', enum: PropertyStatus })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}

export class PropertyQueryDto {
  @ApiPropertyOptional({ description: 'Busca por título ou endereço' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo', enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ description: 'Filtrar por status', enum: PropertyStatus })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ description: 'Preço mínimo' })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Preço máximo' })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

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
