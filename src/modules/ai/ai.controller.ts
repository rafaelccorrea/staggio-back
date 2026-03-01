import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  StagingDto,
  TerrainVisionDto,
  DescriptionDto,
  PhotoEnhanceDto,
  ChatDto,
} from './dto/ai.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('staging')
  @ApiOperation({
    summary: 'Home Staging Virtual',
    description: 'Transforma ambientes vazios em decorados com IA. Consome 2 créditos.',
  })
  @ApiResponse({ status: 200, description: 'Staging gerado com sucesso' })
  @ApiResponse({ status: 403, description: 'Créditos insuficientes' })
  async staging(@CurrentUser() user: User, @Body() dto: StagingDto) {
    return this.aiService.staging(user.id, dto);
  }

  @Post('terrain-vision')
  @ApiOperation({
    summary: 'Visão de Terreno',
    description: 'Visualiza construções em terrenos vazios com IA. Consome 3 créditos.',
  })
  @ApiResponse({ status: 200, description: 'Visão de terreno gerada com sucesso' })
  @ApiResponse({ status: 403, description: 'Créditos insuficientes' })
  async terrainVision(@CurrentUser() user: User, @Body() dto: TerrainVisionDto) {
    return this.aiService.terrainVision(user.id, dto);
  }

  @Post('description')
  @ApiOperation({
    summary: 'Descrição IA',
    description: 'Gera descrições profissionais para anúncios de imóveis. Consome 1 crédito.',
  })
  @ApiResponse({ status: 200, description: 'Descrição gerada com sucesso' })
  @ApiResponse({ status: 403, description: 'Créditos insuficientes' })
  async description(@CurrentUser() user: User, @Body() dto: DescriptionDto) {
    return this.aiService.description(user.id, dto);
  }

  @Post('photo-enhance')
  @ApiOperation({
    summary: 'Melhoria de Fotos',
    description: 'Analisa e sugere melhorias para fotos de imóveis. Consome 1 crédito.',
  })
  @ApiResponse({ status: 200, description: 'Análise de foto gerada com sucesso' })
  @ApiResponse({ status: 403, description: 'Créditos insuficientes' })
  async photoEnhance(@CurrentUser() user: User, @Body() dto: PhotoEnhanceDto) {
    return this.aiService.photoEnhance(user.id, dto);
  }

  @Post('chat')
  @ApiOperation({
    summary: 'Chat IA',
    description: 'Assistente inteligente para corretores de imóveis. Consome 1 crédito.',
  })
  @ApiResponse({ status: 200, description: 'Resposta do assistente' })
  @ApiResponse({ status: 403, description: 'Créditos insuficientes' })
  async chat(@CurrentUser() user: User, @Body() dto: ChatDto) {
    return this.aiService.chat(user.id, dto);
  }

  @Post('validate-property-image')
  @ApiOperation({
    summary: 'Validar Imagem de Propriedade',
    description: 'Verifica se a imagem eh realmente de um imovel. Nao consome creditos.',
  })
  @ApiResponse({ status: 200, description: 'Resultado da validacao' })
  async validatePropertyImage(
    @CurrentUser() user: User,
    @Body() body: { imageUrl: string },
  ) {
    const isValid = await this.aiService.validatePropertyImage(user.id, body.imageUrl);
    return { success: true, isValid };
  }

  @Post('generate-video-script')
  @ApiOperation({
    summary: 'Gerar Script para Video',
    description: 'Cria narracao para video de propriedade. Consome 1 credito.',
  })
  @ApiResponse({ status: 200, description: 'Script gerado' })
  @ApiResponse({ status: 403, description: 'Creditos insuficientes' })
  async generateVideoScript(
    @CurrentUser() user: User,
    @Body() body: { imageUrl: string },
  ) {
    const script = await this.aiService.generateVideoScript(user.id, body.imageUrl);
    return { success: true, script };
  }
}
