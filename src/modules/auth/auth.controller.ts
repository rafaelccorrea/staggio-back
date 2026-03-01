import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registar novo utilizador' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Utilizador registado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email já registado' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Login/Registro via Google (Firebase)' })
  @ApiBody({ schema: { properties: { idToken: { type: 'string', description: 'Firebase ID Token do Google Sign-In' } }, required: ['idToken'] } })
  @ApiResponse({ status: 200, description: 'Login via Google efetuado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Token inv\u00e1lido' })
  async googleAuth(@Body() body: { idToken: string }) {
    return this.authService.googleAuth(body.idToken);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login do utilizador' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login efetuado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do utilizador autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil do utilizador' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }
}
