import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { User } from '../users/entities/user.entity';
import { Generation, GenerationType, GenerationStatus } from '../generations/entities/generation.entity';
import {
  StagingDto,
  TerrainVisionDto,
  DescriptionDto,
  PhotoEnhanceDto,
  ChatDto,
} from './dto/ai.dto';
import { REAL_ESTATE_ASSISTANT_PROMPT } from './prompts/real-estate-assistant';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Generation)
    private generationsRepository: Repository<Generation>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Valida se o utilizador tem créditos disponíveis
   */
  private async validateCredits(userId: string, creditsNeeded: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Utilizador não encontrado');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Conta desativada');
    }

    if (user.aiCreditsUsed + creditsNeeded > user.aiCreditsLimit) {
      throw new ForbiddenException(
        `Créditos insuficientes. Você tem ${user.aiCreditsLimit - user.aiCreditsUsed} créditos restantes. ` +
        `Esta operação requer ${creditsNeeded} crédito(s). Faça upgrade do seu plano para continuar.`,
      );
    }

    return user;
  }

  /**
   * Consome créditos do utilizador
   */
  private async consumeCredits(userId: string, credits: number): Promise<void> {
    await this.usersRepository.increment({ id: userId }, 'aiCreditsUsed', credits);
  }

  /**
   * Cria registo de geração
   */
  private async createGeneration(
    data: Partial<Generation>,
  ): Promise<Generation> {
    const generation = this.generationsRepository.create(data);
    return this.generationsRepository.save(generation);
  }

  /**
   * Home Staging Virtual - Transforma ambientes vazios em decorados
   */
  async staging(userId: string, dto: StagingDto) {
    const creditsNeeded = 2;
    await this.validateCredits(userId, creditsNeeded);

    const generation = await this.createGeneration({
      type: GenerationType.STAGING,
      status: GenerationStatus.PROCESSING,
      userId,
      propertyId: dto.propertyId || null,
      inputImageUrl: dto.imageUrl,
      inputData: { style: dto.style, roomType: dto.roomType },
    });

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em home staging virtual e design de interiores. 
            Analise a imagem do ambiente e descreva detalhadamente como ficaria decorado no estilo "${dto.style}".
            Inclua: móveis, cores, texturas, iluminação e dicas de posicionamento.
            Responda em português brasileiro de forma profissional.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Faça o home staging virtual deste ambiente no estilo ${dto.style}.${dto.roomType ? ` O ambiente é: ${dto.roomType}.` : ''}`,
              },
              {
                type: 'image_url',
                image_url: { url: dto.imageUrl },
              },
            ],
          },
        ],
        max_tokens: 1500,
      });

      const outputText = response.choices[0]?.message?.content || '';
      const processingTimeMs = Date.now() - startTime;

      await this.consumeCredits(userId, creditsNeeded);

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.creditsUsed = creditsNeeded;
      generation.processingTimeMs = processingTimeMs;
      await this.generationsRepository.save(generation);

      return {
        id: generation.id,
        type: 'staging',
        status: 'completed',
        outputText,
        creditsUsed: creditsNeeded,
        processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`Staging error: ${error.message}`, error.stack);
      generation.status = GenerationStatus.FAILED;
      generation.errorMessage = error.message;
      await this.generationsRepository.save(generation);

      throw new InternalServerErrorException(
        'Erro ao processar home staging. Tente novamente.',
      );
    }
  }

  /**
   * Visão de Terreno - Renderiza construções em terrenos vazios
   */
  async terrainVision(userId: string, dto: TerrainVisionDto) {
    const creditsNeeded = 3;
    await this.validateCredits(userId, creditsNeeded);

    const generation = await this.createGeneration({
      type: GenerationType.TERRAIN_VISION,
      status: GenerationStatus.PROCESSING,
      userId,
      propertyId: dto.propertyId || null,
      inputImageUrl: dto.imageUrl,
      inputData: { buildingType: dto.buildingType, architectureStyle: dto.architectureStyle },
    });

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um arquiteto especialista em visualização de projetos.
            Analise a imagem do terreno e descreva detalhadamente como ficaria uma construção do tipo "${dto.buildingType}" neste local.
            Inclua: fachada, paisagismo, materiais, distribuição dos espaços e potencial do terreno.
            Responda em português brasileiro de forma profissional e persuasiva para venda.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Visualize uma construção do tipo ${dto.buildingType} neste terreno.${dto.architectureStyle ? ` Estilo arquitetônico: ${dto.architectureStyle}.` : ''}`,
              },
              {
                type: 'image_url',
                image_url: { url: dto.imageUrl },
              },
            ],
          },
        ],
        max_tokens: 1500,
      });

      const outputText = response.choices[0]?.message?.content || '';
      const processingTimeMs = Date.now() - startTime;

      await this.consumeCredits(userId, creditsNeeded);

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.creditsUsed = creditsNeeded;
      generation.processingTimeMs = processingTimeMs;
      await this.generationsRepository.save(generation);

      return {
        id: generation.id,
        type: 'terrain_vision',
        status: 'completed',
        outputText,
        creditsUsed: creditsNeeded,
        processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`Terrain vision error: ${error.message}`, error.stack);
      generation.status = GenerationStatus.FAILED;
      generation.errorMessage = error.message;
      await this.generationsRepository.save(generation);

      throw new InternalServerErrorException(
        'Erro ao processar visão de terreno. Tente novamente.',
      );
    }
  }

  /**
   * Descrição IA - Gera textos profissionais para anúncios
   */
  async description(userId: string, dto: DescriptionDto) {
    const creditsNeeded = 1;
    await this.validateCredits(userId, creditsNeeded);

    const generation = await this.createGeneration({
      type: GenerationType.DESCRIPTION,
      status: GenerationStatus.PROCESSING,
      userId,
      propertyId: dto.propertyId || null,
      inputData: { ...dto },
    });

    const startTime = Date.now();

    try {
      const propertyDetails = [
        dto.type && `Tipo: ${dto.type}`,
        dto.area && `Área: ${dto.area}m²`,
        dto.bedrooms && `Quartos: ${dto.bedrooms}`,
        dto.bathrooms && `Banheiros: ${dto.bathrooms}`,
        dto.parkingSpots && `Vagas: ${dto.parkingSpots}`,
        dto.neighborhood && `Bairro: ${dto.neighborhood}`,
        dto.city && `Cidade: ${dto.city}`,
        dto.features && `Diferenciais: ${dto.features}`,
      ]
        .filter(Boolean)
        .join('\n');

      const tone = dto.tone || 'profissional e persuasivo';

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um copywriter especialista em imóveis. Crie descrições que vendem.
            Tom: ${tone}.
            Formato: Título chamativo + descrição principal + destaques + chamada para ação.
            Responda em português brasileiro. Não use markdown.`,
          },
          {
            role: 'user',
            content: `Crie uma descrição profissional para este imóvel:\n\nTítulo: ${dto.title}\n${propertyDetails}`,
          },
        ],
        max_tokens: 1000,
      });

      const outputText = response.choices[0]?.message?.content || '';
      const processingTimeMs = Date.now() - startTime;

      await this.consumeCredits(userId, creditsNeeded);

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.creditsUsed = creditsNeeded;
      generation.processingTimeMs = processingTimeMs;
      await this.generationsRepository.save(generation);

      return {
        id: generation.id,
        type: 'description',
        status: 'completed',
        outputText,
        creditsUsed: creditsNeeded,
        processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`Description error: ${error.message}`, error.stack);
      generation.status = GenerationStatus.FAILED;
      generation.errorMessage = error.message;
      await this.generationsRepository.save(generation);

      throw new InternalServerErrorException(
        'Erro ao gerar descrição. Tente novamente.',
      );
    }
  }

  /**
   * Melhoria de Fotos - Análise e sugestões de melhoria
   */
  async photoEnhance(userId: string, dto: PhotoEnhanceDto) {
    const creditsNeeded = 1;
    await this.validateCredits(userId, creditsNeeded);

    const generation = await this.createGeneration({
      type: GenerationType.PHOTO_ENHANCE,
      status: GenerationStatus.PROCESSING,
      userId,
      propertyId: dto.propertyId || null,
      inputImageUrl: dto.imageUrl,
      inputData: { enhanceType: dto.enhanceType },
    });

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um fotógrafo profissional de imóveis.
            Analise a foto e forneça:
            1. Avaliação da qualidade atual (iluminação, ângulo, composição)
            2. Sugestões específicas de melhoria
            3. Dicas para refotografar se necessário
            4. Pontuação de 1 a 10
            Responda em português brasileiro.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise esta foto de imóvel e sugira melhorias.${dto.enhanceType ? ` Foco em: ${dto.enhanceType}.` : ''}`,
              },
              {
                type: 'image_url',
                image_url: { url: dto.imageUrl },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const outputText = response.choices[0]?.message?.content || '';
      const processingTimeMs = Date.now() - startTime;

      await this.consumeCredits(userId, creditsNeeded);

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.creditsUsed = creditsNeeded;
      generation.processingTimeMs = processingTimeMs;
      await this.generationsRepository.save(generation);

      return {
        id: generation.id,
        type: 'photo_enhance',
        status: 'completed',
        outputText,
        creditsUsed: creditsNeeded,
        processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`Photo enhance error: ${error.message}`, error.stack);
      generation.status = GenerationStatus.FAILED;
      generation.errorMessage = error.message;
      await this.generationsRepository.save(generation);

      throw new InternalServerErrorException(
        'Erro ao analisar foto. Tente novamente.',
      );
    }
  }

  /**
   * Validar Imagem de Propriedade - Verifica se eh realmente um imovel
   */
  async validatePropertyImage(userId: string, imageUrl: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Utilizador nao encontrado');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise esta imagem e responda APENAS com SIM ou NAO.
A imagem mostra um imovel, terreno, planta de casa, fachada de propriedade, ou interior de residencia?
Responda apenas com uma palavra: SIM ou NAO`,
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 10,
      });

      const content = response.choices[0]?.message?.content?.toUpperCase().trim() || '';
      return content.includes('SIM');
    } catch (error) {
      this.logger.error(`Image validation error: ${error.message}`);
      throw new InternalServerErrorException('Erro ao validar imagem');
    }
  }

  /**
   * Gerar Script para Video - Cria narracao para video de propriedade
   */
  async generateVideoScript(userId: string, imageUrl: string): Promise<string> {
    const creditsNeeded = 1;
    await this.validateCredits(userId, creditsNeeded);

    const generation = await this.createGeneration({
      type: GenerationType.DESCRIPTION,
      status: GenerationStatus.PROCESSING,
      userId,
      inputImageUrl: imageUrl,
      inputData: { type: 'video_script' },
    });

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise esta foto de imovel e crie um script de narracao para um video de 30 segundos que destaque os melhores aspectos da propriedade.
O script deve:
- Ser envolvente e profissional
- Durar aproximadamente 30 segundos (cerca de 75-85 palavras)
- Destacar caracteristicas positivas
- Usar linguagem que atrai compradores
- Ser em portugues brasileiro
Retorne APENAS o script, sem explicacoes adicionais.`,
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 200,
      });

      const outputText = response.choices[0]?.message?.content || '';
      const processingTimeMs = Date.now() - startTime;

      await this.consumeCredits(userId, creditsNeeded);

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.creditsUsed = creditsNeeded;
      generation.processingTimeMs = processingTimeMs;
      await this.generationsRepository.save(generation);

      return outputText;
    } catch (error) {
      this.logger.error(`Video script generation error: ${error.message}`);
      generation.status = GenerationStatus.FAILED;
      generation.errorMessage = error.message;
      await this.generationsRepository.save(generation);

      throw new InternalServerErrorException('Erro ao gerar script de video');
    }
  }

  /**
   * Chat IA - Assistente inteligente para corretores
   */
  async chat(userId: string, dto: ChatDto) {
    const creditsNeeded = 1;
    await this.validateCredits(userId, creditsNeeded);

    const startTime = Date.now();

    try {
      const messages: any[] = [
        {
          role: 'system',
          content: REAL_ESTATE_ASSISTANT_PROMPT,
        },
      ];

      if (dto.history && dto.history.length > 0) {
        messages.push(...dto.history);
      }

      messages.push({ role: 'user', content: dto.message });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages,
        max_tokens: 1000,
      });

      const outputText = response.choices[0]?.message?.content || '';
      const processingTimeMs = Date.now() - startTime;

      await this.consumeCredits(userId, creditsNeeded);

      // Registar geração de chat
      await this.createGeneration({
        type: GenerationType.CHAT,
        status: GenerationStatus.COMPLETED,
        userId,
        inputPrompt: dto.message,
        outputText,
        creditsUsed: creditsNeeded,
        processingTimeMs,
      });

      return {
        type: 'chat',
        reply: outputText,
        message: outputText,
        response: outputText,
        creditsUsed: creditsNeeded,
        processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`Chat error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Erro ao processar mensagem. Tente novamente.',
      );
    }
  }
}
