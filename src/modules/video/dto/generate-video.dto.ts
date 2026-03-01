import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum VideoStyle {
  CINEMATIC = 'cinematic',
  MODERN = 'modern',
  ELEGANT = 'elegant',
  WARM = 'warm',
}

export enum VideoTransition {
  CROSSFADE = 'crossfade',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  WIPE = 'wipe',
}

export enum VideoResolution {
  HD = '720p',
  FULL_HD = '1080p',
}

export enum VideoAspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  SQUARE = '1:1',
}

export class GenerateVideoDto {
  @ApiProperty({
    description: 'URLs das imagens do imóvel (Supabase Storage)',
    type: [String],
    example: ['https://storage.supabase.co/...image1.jpg', 'https://storage.supabase.co/...image2.jpg'],
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Mínimo de 2 imagens necessárias' })
  @ArrayMaxSize(20, { message: 'Máximo de 20 imagens permitidas' })
  @IsString({ each: true })
  imageUrls: string[];

  @ApiPropertyOptional({
    description: 'Estilo visual do vídeo',
    enum: VideoStyle,
    default: VideoStyle.CINEMATIC,
  })
  @IsOptional()
  @IsEnum(VideoStyle)
  style?: VideoStyle;

  @ApiPropertyOptional({
    description: 'Tipo de transição entre imagens',
    enum: VideoTransition,
    default: VideoTransition.CROSSFADE,
  })
  @IsOptional()
  @IsEnum(VideoTransition)
  transition?: VideoTransition;

  @ApiPropertyOptional({
    description: 'Resolução do vídeo',
    enum: VideoResolution,
    default: VideoResolution.FULL_HD,
  })
  @IsOptional()
  @IsEnum(VideoResolution)
  resolution?: VideoResolution;

  @ApiPropertyOptional({
    description: 'Aspect ratio do vídeo',
    enum: VideoAspectRatio,
    default: VideoAspectRatio.LANDSCAPE,
  })
  @IsOptional()
  @IsEnum(VideoAspectRatio)
  aspectRatio?: VideoAspectRatio;

  @ApiPropertyOptional({
    description: 'Duração de cada imagem em segundos',
    default: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(8)
  durationPerImage?: number;

  @ApiPropertyOptional({
    description: 'Duração da transição em segundos',
    default: 1.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3)
  transitionDuration?: number;

  @ApiPropertyOptional({
    description: 'Título do imóvel para overlay no vídeo',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'ID da propriedade associada',
  })
  @IsOptional()
  @IsString()
  propertyId?: string;
}
