import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Nome completo', example: 'Rafael Correa' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Email', example: 'rafael@staggio.com' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ description: 'Senha (mínimo 6 caracteres)', example: 'senha123' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

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
}

export class LoginDto {
  @ApiProperty({ description: 'Email', example: 'rafael@staggio.com' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ description: 'Senha', example: 'senha123' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Access token JWT' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Dados do utilizador' })
  user: any;
}
