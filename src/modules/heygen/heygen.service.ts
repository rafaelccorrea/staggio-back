import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface VideoGenerationRequest {
  title: string;
  caption: string;
  dimension: {
    width: number;
    height: number;
  };
  duration?: number;
  webhook_url?: string;
}

@Injectable()
export class HeyGenService {
  private readonly logger = new Logger(HeyGenService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.heygen.com/v1';
  private readonly heygenClient = axios.create({
    baseURL: this.apiUrl,
  });

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('HEYGEN_API_KEY');

    if (!this.apiKey) {
      this.logger.warn('HEYGEN_API_KEY not configured');
    }

    // Add auth header to all requests
    this.heygenClient.interceptors.request.use((config) => {
      config.headers['X-Api-Key'] = this.apiKey;
      return config;
    });
  }

  /**
   * Generate a video using HeyGen API
   * @param request Video generation request
   * @param webhookUrl URL to receive webhook notifications
   * @returns Video generation response with video_id
   */
  async generateVideo(
    request: VideoGenerationRequest,
    webhookUrl?: string,
  ): Promise<any> {
    try {
      const payload = {
        ...request,
        webhook_url: webhookUrl || `${process.env.APP_URL}/heygen/webhook`,
      };

      this.logger.log(`Generating video: ${request.title}`);

      const response = await this.heygenClient.post('/video_generation', payload);

      this.logger.log(`Video generation started: ${response.data.video_id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Video generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get video generation status
   * @param videoId HeyGen video ID
   * @returns Video status and details
   */
  async getVideoStatus(videoId: string): Promise<any> {
    try {
      const response = await this.heygenClient.get(`/video_generation/${videoId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get video status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle webhook when video generation completes
   * @param data Webhook payload data
   */
  async handleVideoCompleted(data: any): Promise<void> {
    const { video_id, video_url, title } = data;

    this.logger.log(`Video completed: ${video_id}`);
    this.logger.log(`Video URL: ${video_url}`);

    // TODO: Update database with completed video
    // TODO: Send notification to user
    // TODO: Store video_url for showcase display

    // Example: Save to database
    // await this.videosRepository.update(
    //   { heygen_id: video_id },
    //   { status: 'completed', url: video_url, completed_at: new Date() }
    // );
  }

  /**
   * Handle webhook when video generation fails
   * @param data Webhook payload data
   */
  async handleVideoFailed(data: any): Promise<void> {
    const { video_id, error_message } = data;

    this.logger.error(`Video generation failed: ${video_id} - ${error_message}`);

    // TODO: Update database with failed status
    // TODO: Send error notification to user

    // Example: Save to database
    // await this.videosRepository.update(
    //   { heygen_id: video_id },
    //   { status: 'failed', error: error_message }
    // );
  }

  /**
   * Handle webhook when video is processing
   * @param data Webhook payload data
   */
  async handleVideoProcessing(data: any): Promise<void> {
    const { video_id, progress } = data;

    this.logger.log(`Video processing: ${video_id} - ${progress}%`);

    // TODO: Update database with progress
    // TODO: Send progress notification to user (optional)
  }

  /**
   * Generate 3 example showcase videos
   * These will be displayed on the home screen to attract users
   */
  async generateShowcaseVideos(): Promise<any[]> {
    const showcaseVideos = [
      {
        title: 'Home Staging Exemplo',
        caption:
          'Veja como o Home Staging transforma uma sala comum em um espaço atrativo para compradores',
        dimension: { width: 1080, height: 1920 },
        duration: 30,
      },
      {
        title: 'Visão de Terreno Exemplo',
        caption:
          'Análise completa do terreno com medidas, zoneamento e potencial de desenvolvimento',
        dimension: { width: 1080, height: 1920 },
        duration: 30,
      },
      {
        title: 'Descrição Automática Exemplo',
        caption:
          'Descrição profissional gerada automaticamente em segundos para seu anúncio',
        dimension: { width: 1080, height: 1920 },
        duration: 30,
      },
    ];

    const results = [];

    for (const video of showcaseVideos) {
      try {
        const result = await this.generateVideo(video);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to generate showcase video: ${video.title}`);
      }
    }

    return results;
  }

  /**
   * Verify webhook signature (optional security measure)
   * @param payload Webhook payload
   * @param signature Signature header
   */
  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    // TODO: Implement signature verification using HMAC
    // This requires storing HeyGen webhook secret in environment variables
    return true;
  }
}
