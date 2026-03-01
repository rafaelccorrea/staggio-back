import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { HeyGenService } from './heygen.service';

@Controller('heygen')
export class HeyGenController {
  private readonly logger = new Logger(HeyGenController.name);

  constructor(private readonly heyGenService: HeyGenService) {}

  /**
   * Webhook endpoint for HeyGen video generation events
   * Called by HeyGen when video generation completes or fails
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-heygen-signature') signature: string,
  ) {
    this.logger.log(`HeyGen webhook received: ${payload.event_type}`);

    try {
      // Verify webhook signature (optional but recommended)
      // await this.heyGenService.verifyWebhookSignature(payload, signature);

      const { event_type, data } = payload;

      switch (event_type) {
        case 'video_generation.completed':
          await this.heyGenService.handleVideoCompleted(data);
          break;

        case 'video_generation.failed':
          await this.heyGenService.handleVideoFailed(data);
          break;

        case 'video_generation.processing':
          await this.heyGenService.handleVideoProcessing(data);
          break;

        default:
          this.logger.warn(`Unknown event type: ${event_type}`);
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }
}
