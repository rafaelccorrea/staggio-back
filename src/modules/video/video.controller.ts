import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VideoService } from './video.service';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('video')
@ApiBearerAuth()
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Gerar Vídeo Cinematográfico',
    description:
      'Gera um vídeo slideshow cinematográfico a partir das fotos do imóvel. ' +
      'Aplica efeito Ken Burns (zoom/pan), transições suaves e color grading profissional. ' +
      'Consome 3 créditos.',
  })
  @ApiResponse({ status: 200, description: 'Vídeo gerado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Créditos insuficientes' })
  @ApiResponse({ status: 500, description: 'Erro interno ao gerar vídeo' })
  async generateVideo(
    @CurrentUser() user: User,
    @Body() dto: GenerateVideoDto,
  ) {
    return this.videoService.generateVideo(user.id, dto);
  }

  @Get('styles')
  @ApiOperation({
    summary: 'Listar Estilos Disponíveis',
    description: 'Retorna os estilos visuais, transições e opções disponíveis para geração de vídeo.',
  })
  @ApiResponse({ status: 200, description: 'Lista de estilos' })
  async getStyles() {
    return {
      success: true,
      data: {
        styles: [
          {
            id: 'cinematic',
            name: 'Cinematográfico',
            description: 'Tons quentes, contraste suave, aspecto de filme profissional',
          },
          {
            id: 'modern',
            name: 'Moderno',
            description: 'Tons frios, alto contraste, visual clean e contemporâneo',
          },
          {
            id: 'elegant',
            name: 'Elegante',
            description: 'Cores equilibradas, suave e sofisticado',
          },
          {
            id: 'warm',
            name: 'Acolhedor',
            description: 'Tons quentes intensos, sensação de lar e conforto',
          },
        ],
        transitions: [
          {
            id: 'crossfade',
            name: 'Crossfade',
            description: 'Dissolução suave entre imagens',
          },
          {
            id: 'slide',
            name: 'Deslizar',
            description: 'Imagem desliza para revelar a próxima',
          },
          {
            id: 'zoom',
            name: 'Zoom',
            description: 'Transição com efeito de zoom suave',
          },
          {
            id: 'wipe',
            name: 'Cortina',
            description: 'Efeito de cortina lateral',
          },
        ],
        resolutions: [
          { id: '720p', name: 'HD (720p)', description: '1280x720 - Mais rápido' },
          { id: '1080p', name: 'Full HD (1080p)', description: '1920x1080 - Melhor qualidade' },
        ],
        aspectRatios: [
          { id: '16:9', name: 'Paisagem (16:9)', description: 'Ideal para YouTube e sites' },
          { id: '9:16', name: 'Retrato (9:16)', description: 'Ideal para Instagram Reels e TikTok' },
          { id: '1:1', name: 'Quadrado (1:1)', description: 'Ideal para Instagram Feed' },
        ],
        creditsRequired: 3,
        limits: {
          minImages: 2,
          maxImages: 20,
          minDurationPerImage: 2,
          maxDurationPerImage: 8,
          defaultDurationPerImage: 4,
          minTransitionDuration: 0.5,
          maxTransitionDuration: 3,
          defaultTransitionDuration: 1.5,
        },
      },
    };
  }
}
