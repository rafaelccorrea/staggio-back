import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { User } from '../users/entities/user.entity';
import {
  GenerateDescriptionDto,
  GenerateStagingDto,
  GenerateTerrainVisionDto,
  PhotoEnhanceDto,
  ChatAssistantDto,
} from './dto/ai.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('description')
  @ApiOperation({ summary: 'Gerar descrição de imóvel com IA' })
  async generateDescription(
    @CurrentUser() user: User,
    @Body() dto: GenerateDescriptionDto,
  ) {
    return this.aiService.generateDescription(user, dto);
  }

  @Post('staging')
  @ApiOperation({ summary: 'Gerar prompt de home staging virtual' })
  async generateStaging(
    @CurrentUser() user: User,
    @Body() dto: GenerateStagingDto,
  ) {
    return this.aiService.generateStagingPrompt(user, dto);
  }

  @Post('terrain-vision')
  @ApiOperation({ summary: 'Gerar visão de construção em terreno' })
  async generateTerrainVision(
    @CurrentUser() user: User,
    @Body() dto: GenerateTerrainVisionDto,
  ) {
    return this.aiService.generateTerrainVision(user, dto);
  }

  @Post('photo-enhance')
  @ApiOperation({ summary: 'Gerar prompt de melhoria de foto' })
  async enhancePhoto(
    @CurrentUser() user: User,
    @Body() dto: PhotoEnhanceDto,
  ) {
    return this.aiService.generatePhotoEnhancePrompt(user, dto);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat com assistente de IA' })
  async chatAssistant(
    @CurrentUser() user: User,
    @Body() dto: ChatAssistantDto,
  ) {
    return this.aiService.chatAssistant(user, dto);
  }
}
