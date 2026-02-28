import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Nome completo', example: 'Rafael Correa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Telefone', example: '11999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'CRECI', example: 'CRECI-SP 123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  creci?: string;

  @ApiPropertyOptional({ description: 'URL do avatar' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
