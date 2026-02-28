import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Generation, GenerationType, GenerationStatus } from '../generations/entities/generation.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(Generation)
    private generationsRepository: Repository<Generation>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  private async checkCredits(user: User): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId: user.id },
    });

    if (!subscription) {
      throw new ForbiddenException('Nenhuma assinatura encontrada');
    }

    if (subscription.aiCreditsUsed >= subscription.aiCreditsLimit) {
      throw new ForbiddenException(
        'Limite de créditos de IA atingido. Faça upgrade do seu plano para continuar.',
      );
    }

    return subscription;
  }

  private async consumeCredit(subscription: Subscription, credits: number = 1): Promise<void> {
    subscription.aiCreditsUsed += credits;
    await this.subscriptionsRepository.save(subscription);
  }

  async generateDescription(
    user: User,
    data: {
      propertyType: string;
      bedrooms?: number;
      bathrooms?: number;
      area?: number;
      neighborhood?: string;
      city?: string;
      features?: string[];
      price?: number;
      additionalInfo?: string;
    },
  ): Promise<Generation> {
    const subscription = await this.checkCredits(user);
    const startTime = Date.now();

    const generation = this.generationsRepository.create({
      type: GenerationType.DESCRIPTION,
      status: GenerationStatus.PROCESSING,
      userId: user.id,
      inputPrompt: JSON.stringify(data),
    });
    await this.generationsRepository.save(generation);

    try {
      const prompt = this.buildDescriptionPrompt(data);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em marketing imobiliário brasileiro. 
Crie descrições profissionais, persuasivas e envolventes para anúncios de imóveis.
Use linguagem que transmita sofisticação e exclusividade.
Inclua emojis estratégicos para destacar pontos importantes.
Formate para ser usado em portais imobiliários, Instagram e WhatsApp.
Retorne 3 versões: uma para portal, uma para Instagram e uma para WhatsApp.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });

      const outputText = completion.choices[0]?.message?.content || '';

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.processingTimeMs = Date.now() - startTime;
      generation.metadata = { model: 'gpt-4.1-mini', usage: completion.usage };

      await this.generationsRepository.save(generation);
      await this.consumeCredit(subscription);

      return generation;
    } catch (error) {
      generation.status = GenerationStatus.FAILED;
      generation.metadata = { error: error.message };
      await this.generationsRepository.save(generation);
      throw new BadRequestException('Erro ao gerar descrição: ' + error.message);
    }
  }

  async generateStagingPrompt(
    user: User,
    data: {
      style: string;
      roomType: string;
      additionalInstructions?: string;
    },
  ): Promise<Generation> {
    const subscription = await this.checkCredits(user);
    const startTime = Date.now();

    const generation = this.generationsRepository.create({
      type: GenerationType.STAGING,
      status: GenerationStatus.PROCESSING,
      userId: user.id,
      inputPrompt: JSON.stringify(data),
    });
    await this.generationsRepository.save(generation);

    try {
      const prompt = `Crie um prompt detalhado em inglês para gerar uma imagem de home staging virtual.
Estilo: ${data.style}
Tipo de ambiente: ${data.roomType}
${data.additionalInstructions ? `Instruções adicionais: ${data.additionalInstructions}` : ''}

O prompt deve ser otimizado para ferramentas de geração de imagem como DALL-E ou Stable Diffusion.
Inclua detalhes sobre: mobília, decoração, iluminação, cores, texturas e atmosfera.
Retorne apenas o prompt em inglês, sem explicações.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interior designer and AI image prompt engineer. Create detailed, photorealistic staging prompts.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 500,
      });

      const outputText = completion.choices[0]?.message?.content || '';

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.processingTimeMs = Date.now() - startTime;
      generation.metadata = { model: 'gpt-4.1-mini', style: data.style, roomType: data.roomType };

      await this.generationsRepository.save(generation);
      await this.consumeCredit(subscription);

      return generation;
    } catch (error) {
      generation.status = GenerationStatus.FAILED;
      generation.metadata = { error: error.message };
      await this.generationsRepository.save(generation);
      throw new BadRequestException('Erro ao gerar staging: ' + error.message);
    }
  }

  async generateTerrainVision(
    user: User,
    data: {
      buildingType: string;
      style: string;
      floors?: number;
      additionalInstructions?: string;
    },
  ): Promise<Generation> {
    const subscription = await this.checkCredits(user);
    const startTime = Date.now();

    const generation = this.generationsRepository.create({
      type: GenerationType.TERRAIN_VISION,
      status: GenerationStatus.PROCESSING,
      userId: user.id,
      inputPrompt: JSON.stringify(data),
    });
    await this.generationsRepository.save(generation);

    try {
      const prompt = `Crie um prompt detalhado em inglês para gerar uma renderização arquitetônica de um terreno vazio com uma construção.
Tipo de construção: ${data.buildingType}
Estilo arquitetônico: ${data.style}
${data.floors ? `Número de andares: ${data.floors}` : ''}
${data.additionalInstructions ? `Instruções adicionais: ${data.additionalInstructions}` : ''}

O prompt deve gerar uma imagem fotorrealista mostrando como ficaria a construção no terreno.
Inclua detalhes sobre: fachada, paisagismo, iluminação natural, materiais e entorno.
Retorne apenas o prompt em inglês.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert architect and AI image prompt engineer. Create detailed architectural visualization prompts.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 500,
      });

      const outputText = completion.choices[0]?.message?.content || '';

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.processingTimeMs = Date.now() - startTime;
      generation.metadata = { model: 'gpt-4.1-mini', buildingType: data.buildingType, style: data.style };

      await this.generationsRepository.save(generation);
      await this.consumeCredit(subscription);

      return generation;
    } catch (error) {
      generation.status = GenerationStatus.FAILED;
      generation.metadata = { error: error.message };
      await this.generationsRepository.save(generation);
      throw new BadRequestException('Erro ao gerar visão do terreno: ' + error.message);
    }
  }

  async generatePhotoEnhancePrompt(
    user: User,
    data: {
      enhancementType: string;
      additionalInstructions?: string;
    },
  ): Promise<Generation> {
    const subscription = await this.checkCredits(user);
    const startTime = Date.now();

    const generation = this.generationsRepository.create({
      type: GenerationType.PHOTO_ENHANCE,
      status: GenerationStatus.PROCESSING,
      userId: user.id,
      inputPrompt: JSON.stringify(data),
    });
    await this.generationsRepository.save(generation);

    try {
      const enhancementPrompts: Record<string, string> = {
        lighting: 'Enhance the lighting to make the room bright and welcoming with warm natural light streaming through windows',
        sky_replacement: 'Replace the sky with a beautiful blue sky with soft white clouds, golden hour lighting',
        declutter: 'Remove clutter and unnecessary objects, make the space clean and minimalist',
        color_correction: 'Apply professional color correction with vibrant but natural colors, warm tones',
        hdr: 'Apply HDR effect to bring out details in shadows and highlights, professional real estate photography style',
      };

      const basePrompt = enhancementPrompts[data.enhancementType] || data.enhancementType;
      const outputText = `${basePrompt}. ${data.additionalInstructions || ''} Professional real estate photography, high resolution, magazine quality.`;

      generation.status = GenerationStatus.COMPLETED;
      generation.outputText = outputText;
      generation.processingTimeMs = Date.now() - startTime;
      generation.metadata = { enhancementType: data.enhancementType };

      await this.generationsRepository.save(generation);
      await this.consumeCredit(subscription);

      return generation;
    } catch (error) {
      generation.status = GenerationStatus.FAILED;
      generation.metadata = { error: error.message };
      await this.generationsRepository.save(generation);
      throw new BadRequestException('Erro ao melhorar foto: ' + error.message);
    }
  }

  async chatAssistant(
    user: User,
    data: { message: string; context?: string },
  ): Promise<{ reply: string }> {
    const subscription = await this.checkCredits(user);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Você é o assistente de IA do Staggio, especializado em ajudar corretores de imóveis.
Você pode ajudar com:
- Dicas de venda e argumentação
- Cálculos de financiamento
- Sugestões de preço
- Análise de mercado
- Dicas de apresentação de imóveis
- Geração de textos para anúncios
- Respostas para clientes
Seja profissional, direto e útil. Responda em português do Brasil.
${data.context ? `Contexto adicional: ${data.context}` : ''}`,
          },
          { role: 'user', content: data.message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const reply = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

      await this.consumeCredit(subscription);

      return { reply };
    } catch (error) {
      throw new BadRequestException('Erro no assistente: ' + error.message);
    }
  }

  private buildDescriptionPrompt(data: any): string {
    const parts: string[] = [];
    
    parts.push(`Tipo de imóvel: ${data.propertyType}`);
    if (data.bedrooms) parts.push(`Quartos: ${data.bedrooms}`);
    if (data.bathrooms) parts.push(`Banheiros: ${data.bathrooms}`);
    if (data.area) parts.push(`Área: ${data.area}m²`);
    if (data.neighborhood) parts.push(`Bairro: ${data.neighborhood}`);
    if (data.city) parts.push(`Cidade: ${data.city}`);
    if (data.price) parts.push(`Preço: R$ ${data.price.toLocaleString('pt-BR')}`);
    if (data.features?.length) parts.push(`Diferenciais: ${data.features.join(', ')}`);
    if (data.additionalInfo) parts.push(`Informações adicionais: ${data.additionalInfo}`);

    return `Crie uma descrição profissional para este imóvel:\n\n${parts.join('\n')}`;
  }
}
