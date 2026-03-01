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
import * as ffmpeg from 'fluent-ffmpeg';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import {
  Generation,
  GenerationType,
  GenerationStatus,
} from '../generations/entities/generation.entity';
import { SupabaseService } from '../supabase/supabase.service';
import {
  GenerateVideoDto,
  VideoStyle,
  VideoTransition,
  VideoResolution,
  VideoAspectRatio,
} from './dto/generate-video.dto';

/**
 * Configurações de resolução
 */
const RESOLUTION_MAP: Record<VideoResolution, { width: number; height: number }> = {
  [VideoResolution.HD]: { width: 1280, height: 720 },
  [VideoResolution.FULL_HD]: { width: 1920, height: 1080 },
};

/**
 * Configurações de aspect ratio
 */
const ASPECT_RATIO_MAP: Record<VideoAspectRatio, { width: number; height: number }> = {
  [VideoAspectRatio.LANDSCAPE]: { width: 1920, height: 1080 },
  [VideoAspectRatio.PORTRAIT]: { width: 1080, height: 1920 },
  [VideoAspectRatio.SQUARE]: { width: 1080, height: 1080 },
};

/**
 * Color grading presets (LUT-like adjustments via FFmpeg filters)
 */
const STYLE_FILTERS: Record<VideoStyle, string> = {
  [VideoStyle.CINEMATIC]:
    'eq=brightness=0.04:contrast=1.08:saturation=1.15,colorbalance=rs=0.03:gs=-0.01:bs=-0.04:rm=0.02:gm=0.0:bm=-0.02',
  [VideoStyle.MODERN]:
    'eq=brightness=0.06:contrast=1.12:saturation=0.95,colorbalance=rs=-0.02:gs=0.0:bs=0.03',
  [VideoStyle.ELEGANT]:
    'eq=brightness=0.02:contrast=1.05:saturation=1.05,colorbalance=rs=0.02:gs=0.01:bs=-0.02',
  [VideoStyle.WARM]:
    'eq=brightness=0.05:contrast=1.06:saturation=1.2,colorbalance=rs=0.06:gs=0.02:bs=-0.05:rh=0.04:gh=0.01:bh=-0.03',
};

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly creditsNeeded = 3;
  private readonly bucket: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Generation)
    private generationsRepository: Repository<Generation>,
    private supabaseService: SupabaseService,
  ) {
    this.bucket = this.configService.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'staggio-uploads',
    );
  }

  /**
   * Gerar vídeo slideshow cinematográfico a partir de fotos do imóvel
   */
  async generateVideo(userId: string, dto: GenerateVideoDto) {
    // 1. Validar créditos
    const user = await this.validateCredits(userId);

    // 2. Criar registro de geração
    const generation = await this.createGeneration({
      type: GenerationType.VIDEO_SLIDESHOW,
      status: GenerationStatus.PROCESSING,
      userId,
      propertyId: dto.propertyId || null,
      inputData: {
        imageCount: dto.imageUrls.length,
        style: dto.style || VideoStyle.CINEMATIC,
        transition: dto.transition || VideoTransition.CROSSFADE,
        resolution: dto.resolution || VideoResolution.FULL_HD,
        aspectRatio: dto.aspectRatio || VideoAspectRatio.LANDSCAPE,
        type: 'video_slideshow',
      },
      creditsUsed: this.creditsNeeded,
    });

    const startTime = Date.now();
    const workDir = path.join(os.tmpdir(), `staggio-video-${uuidv4()}`);

    try {
      // 3. Criar diretório de trabalho
      fs.mkdirSync(workDir, { recursive: true });

      // 4. Configurações
      const style = dto.style || VideoStyle.CINEMATIC;
      const transition = dto.transition || VideoTransition.CROSSFADE;
      const resolution = dto.resolution || VideoResolution.FULL_HD;
      const aspectRatio = dto.aspectRatio || VideoAspectRatio.LANDSCAPE;
      const durationPerImage = dto.durationPerImage || 4;
      const transitionDuration = dto.transitionDuration || 1.5;

      // Determinar dimensões finais
      const dimensions = this.getOutputDimensions(resolution, aspectRatio);

      // 5. Download e processamento das imagens
      this.logger.log(`Processando ${dto.imageUrls.length} imagens...`);
      const processedImages = await this.downloadAndProcessImages(
        dto.imageUrls,
        workDir,
        dimensions,
      );

      if (processedImages.length < 2) {
        throw new BadRequestException(
          'Não foi possível processar imagens suficientes. Mínimo de 2 imagens válidas.',
        );
      }

      // 6. Gerar segmentos de vídeo com Ken Burns para cada imagem
      this.logger.log('Gerando segmentos com efeito Ken Burns...');
      const segments = await this.generateKenBurnsSegments(
        processedImages,
        workDir,
        dimensions,
        durationPerImage,
        style,
      );

      // 7. Concatenar segmentos com transições
      this.logger.log('Concatenando segmentos com transições...');
      const outputPath = path.join(workDir, 'output.mp4');
      await this.concatenateWithTransitions(
        segments,
        outputPath,
        dimensions,
        transitionDuration,
        transition,
        style,
      );

      // 8. Upload para Supabase Storage
      this.logger.log('Fazendo upload do vídeo...');
      const videoBuffer = fs.readFileSync(outputPath);
      const videoFileName = `${uuidv4()}.mp4`;
      const videoPath = `${userId}/videos/${videoFileName}`;

      const videoUrl = await this.supabaseService.uploadFile(
        this.bucket,
        videoPath,
        videoBuffer,
        'video/mp4',
      );

      // 9. Consumir créditos
      await this.consumeCredits(userId);

      // 10. Atualizar geração
      const processingTime = Date.now() - startTime;
      await this.generationsRepository.update(generation.id, {
        status: GenerationStatus.COMPLETED,
        outputImageUrl: videoUrl,
        processingTimeMs: processingTime,
        outputData: {
          videoUrl,
          videoPath,
          durationSeconds:
            processedImages.length * durationPerImage -
            (processedImages.length - 1) * transitionDuration,
          imageCount: processedImages.length,
          resolution: `${dimensions.width}x${dimensions.height}`,
          style,
          transition,
        } as Record<string, any>,
      });

      this.logger.log(
        `Vídeo gerado com sucesso em ${processingTime}ms: ${videoUrl}`,
      );

      return {
        success: true,
        data: {
          videoUrl,
          generationId: generation.id,
          durationSeconds:
            processedImages.length * durationPerImage -
            (processedImages.length - 1) * transitionDuration,
          imageCount: processedImages.length,
          processingTimeMs: processingTime,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar vídeo: ${error.message}`, error.stack);

      await this.generationsRepository.update(generation.id, {
        status: GenerationStatus.FAILED,
        errorMessage: error.message,
        processingTimeMs: Date.now() - startTime,
      });

      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro ao gerar vídeo. Tente novamente.',
      );
    } finally {
      // Limpar diretório temporário
      this.cleanupWorkDir(workDir);
    }
  }

  /**
   * Determinar dimensões de saída baseado na resolução e aspect ratio
   */
  private getOutputDimensions(
    resolution: VideoResolution,
    aspectRatio: VideoAspectRatio,
  ): { width: number; height: number } {
    const arDimensions = ASPECT_RATIO_MAP[aspectRatio];
    const resDimensions = RESOLUTION_MAP[resolution];

    // Se é HD, escalar proporcionalmente
    if (resolution === VideoResolution.HD) {
      const scale = resDimensions.width / 1920;
      return {
        width: Math.round(arDimensions.width * scale),
        height: Math.round(arDimensions.height * scale),
      };
    }

    return arDimensions;
  }

  /**
   * Download e processamento das imagens com Sharp
   */
  private async downloadAndProcessImages(
    imageUrls: string[],
    workDir: string,
    dimensions: { width: number; height: number },
  ): Promise<string[]> {
    const processedPaths: string[] = [];

    // Ken Burns precisa de imagens maiores para zoom/pan
    const kenBurnsScale = 1.25;
    const scaledWidth = Math.round(dimensions.width * kenBurnsScale);
    const scaledHeight = Math.round(dimensions.height * kenBurnsScale);

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const url = imageUrls[i];
        const response = await fetch(url);

        if (!response.ok) {
          this.logger.warn(`Falha ao baixar imagem ${i}: ${response.status}`);
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const outputPath = path.join(workDir, `img_${String(i).padStart(3, '0')}.png`);

        // Processar com Sharp: resize + cover + qualidade
        await sharp(buffer)
          .resize(scaledWidth, scaledHeight, {
            fit: 'cover',
            position: 'centre',
          })
          .png({ quality: 95 })
          .toFile(outputPath);

        processedPaths.push(outputPath);
        this.logger.debug(`Imagem ${i} processada: ${outputPath}`);
      } catch (error) {
        this.logger.warn(`Erro ao processar imagem ${i}: ${error.message}`);
      }
    }

    return processedPaths;
  }

  /**
   * Gerar segmentos de vídeo com efeito Ken Burns (zoom + pan)
   */
  private async generateKenBurnsSegments(
    imagePaths: string[],
    workDir: string,
    dimensions: { width: number; height: number },
    durationPerImage: number,
    style: VideoStyle,
  ): Promise<string[]> {
    const segments: string[] = [];
    const fps = 30;
    const totalFrames = durationPerImage * fps;

    for (let i = 0; i < imagePaths.length; i++) {
      const segmentPath = path.join(workDir, `segment_${String(i).padStart(3, '0')}.mp4`);

      // Alternar entre diferentes efeitos Ken Burns
      const effect = this.getKenBurnsEffect(i, imagePaths.length);

      await new Promise<void>((resolve, reject) => {
        const filterComplex = this.buildKenBurnsFilter(
          effect,
          dimensions,
          totalFrames,
          fps,
        );

        ffmpeg()
          .input(imagePaths[i])
          .loop(durationPerImage)
          .inputFPS(fps)
          .complexFilter(filterComplex)
          .outputOptions([
            '-map', '[out]',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-t', String(durationPerImage),
            '-r', String(fps),
          ])
          .output(segmentPath)
          .on('end', () => {
            this.logger.debug(`Segmento ${i} gerado: ${segmentPath}`);
            resolve();
          })
          .on('error', (err) => {
            this.logger.error(`Erro no segmento ${i}: ${err.message}`);
            reject(err);
          })
          .run();
      });

      segments.push(segmentPath);
    }

    return segments;
  }

  /**
   * Determinar qual efeito Ken Burns usar para cada imagem
   */
  private getKenBurnsEffect(
    index: number,
    total: number,
  ): 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'pan_up' {
    const effects: Array<'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'pan_up'> = [
      'zoom_in',
      'pan_right',
      'zoom_out',
      'pan_left',
      'zoom_in',
      'pan_up',
    ];
    return effects[index % effects.length];
  }

  /**
   * Construir filtro FFmpeg para efeito Ken Burns
   */
  private buildKenBurnsFilter(
    effect: string,
    dimensions: { width: number; height: number },
    totalFrames: number,
    fps: number,
  ): string {
    const w = dimensions.width;
    const h = dimensions.height;
    // A imagem fonte é 1.25x maior
    const srcW = Math.round(w * 1.25);
    const srcH = Math.round(h * 1.25);
    const extraW = srcW - w;
    const extraH = srcH - h;

    let cropFilter: string;

    switch (effect) {
      case 'zoom_in':
        // Começa com a imagem inteira e vai fechando no centro
        cropFilter =
          `crop=w=${srcW}-${extraW}*t/${totalFrames / fps}:` +
          `h=${srcH}-${extraH}*t/${totalFrames / fps}:` +
          `x=${extraW / 2}*t/${totalFrames / fps}:` +
          `y=${extraH / 2}*t/${totalFrames / fps},` +
          `scale=${w}:${h}`;
        break;

      case 'zoom_out':
        // Começa fechado no centro e vai abrindo
        cropFilter =
          `crop=w=${w}+${extraW}*t/${totalFrames / fps}:` +
          `h=${h}+${extraH}*t/${totalFrames / fps}:` +
          `x=${extraW / 2}-${extraW / 2}*t/${totalFrames / fps}:` +
          `y=${extraH / 2}-${extraH / 2}*t/${totalFrames / fps},` +
          `scale=${w}:${h}`;
        break;

      case 'pan_right':
        // Pan da esquerda para a direita
        cropFilter =
          `crop=w=${w}:h=${h}:` +
          `x=${extraW}*t/${totalFrames / fps}:` +
          `y=${Math.round(extraH / 2)}`;
        break;

      case 'pan_left':
        // Pan da direita para a esquerda
        cropFilter =
          `crop=w=${w}:h=${h}:` +
          `x=${extraW}-${extraW}*t/${totalFrames / fps}:` +
          `y=${Math.round(extraH / 2)}`;
        break;

      case 'pan_up':
        // Pan de baixo para cima
        cropFilter =
          `crop=w=${w}:h=${h}:` +
          `x=${Math.round(extraW / 2)}:` +
          `y=${extraH}-${extraH}*t/${totalFrames / fps}`;
        break;

      default:
        cropFilter = `crop=w=${w}:h=${h}:x=${Math.round(extraW / 2)}:y=${Math.round(extraH / 2)}`;
    }

    return `[0:v]${cropFilter}[out]`;
  }

  /**
   * Concatenar segmentos com transições crossfade
   */
  private async concatenateWithTransitions(
    segments: string[],
    outputPath: string,
    dimensions: { width: number; height: number },
    transitionDuration: number,
    transition: VideoTransition,
    style: VideoStyle,
  ): Promise<void> {
    if (segments.length === 1) {
      // Apenas um segmento, aplicar color grading e copiar
      await this.applyColorGrading(segments[0], outputPath, style);
      return;
    }

    // Construir filtro complexo para xfade entre todos os segmentos
    const inputs: string[] = [];
    const filterParts: string[] = [];
    let lastLabel = '[0:v]';

    for (let i = 0; i < segments.length; i++) {
      inputs.push(segments[i]);
    }

    // Construir cadeia de xfade
    for (let i = 1; i < segments.length; i++) {
      const offset = this.calculateXfadeOffset(i, transitionDuration, segments);
      const xfadeTransition = this.getXfadeTransition(transition);
      const outputLabel = i < segments.length - 1 ? `[v${i}]` : '[vout]';

      filterParts.push(
        `${lastLabel}[${i}:v]xfade=transition=${xfadeTransition}:duration=${transitionDuration}:offset=${offset}${outputLabel}`,
      );

      lastLabel = outputLabel;
    }

    // Adicionar color grading ao final
    const styleFilter = STYLE_FILTERS[style];
    filterParts.push(`[vout]${styleFilter}[out]`);

    const filterComplex = filterParts.join(';');

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg();

      // Adicionar todos os inputs
      for (const segment of inputs) {
        command.input(segment);
      }

      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[out]',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '18',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
        ])
        .output(outputPath)
        .on('end', () => {
          this.logger.log('Vídeo concatenado com sucesso');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`Erro ao concatenar: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Calcular offset para xfade baseado na posição do segmento
   */
  private calculateXfadeOffset(
    segmentIndex: number,
    transitionDuration: number,
    segments: string[],
  ): number {
    // Cada segmento tem a mesma duração, offset é calculado considerando
    // as transições anteriores que encurtam o vídeo
    // Para o primeiro xfade: offset = duração do primeiro segmento - transição
    // Para o segundo: offset = (dur1 + dur2 - trans1) - trans2
    // Simplificação: assumimos duração uniforme
    const segmentDuration = 4; // default, será passado como parâmetro em versão futura
    return segmentDuration * segmentIndex - transitionDuration * segmentIndex;
  }

  /**
   * Mapear tipo de transição para xfade FFmpeg
   */
  private getXfadeTransition(transition: VideoTransition): string {
    switch (transition) {
      case VideoTransition.CROSSFADE:
        return 'fade';
      case VideoTransition.SLIDE:
        return 'slideleft';
      case VideoTransition.ZOOM:
        return 'smoothup';
      case VideoTransition.WIPE:
        return 'wiperight';
      default:
        return 'fade';
    }
  }

  /**
   * Aplicar color grading a um único segmento
   */
  private async applyColorGrading(
    inputPath: string,
    outputPath: string,
    style: VideoStyle,
  ): Promise<void> {
    const styleFilter = STYLE_FILTERS[style];

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .videoFilter(styleFilter)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '18',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }

  /**
   * Validar créditos do utilizador
   */
  private async validateCredits(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Utilizador não encontrado');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Conta desativada');
    }

    const totalCredits = user.aiCreditsLimit + (user.bonusCredits || 0);
    if (user.aiCreditsUsed + this.creditsNeeded > totalCredits) {
      throw new ForbiddenException(
        `Créditos insuficientes. Você tem ${totalCredits - user.aiCreditsUsed} créditos restantes. ` +
          `A geração de vídeo requer ${this.creditsNeeded} crédito(s). Faça upgrade do seu plano para continuar.`,
      );
    }
    return user;
  }

  /**
   * Consumir créditos
   */
  private async consumeCredits(userId: string): Promise<void> {
    await this.usersRepository.increment(
      { id: userId },
      'aiCreditsUsed',
      this.creditsNeeded,
    );
  }

  /**
   * Criar registro de geração
   */
  private async createGeneration(
    data: Partial<Generation>,
  ): Promise<Generation> {
    const generation = this.generationsRepository.create(data);
    return this.generationsRepository.save(generation);
  }

  /**
   * Limpar diretório temporário
   */
  private cleanupWorkDir(workDir: string): void {
    try {
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
        this.logger.debug(`Diretório temporário limpo: ${workDir}`);
      }
    } catch (error) {
      this.logger.warn(`Erro ao limpar diretório: ${error.message}`);
    }
  }
}
