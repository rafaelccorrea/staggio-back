import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';

class CreateCheckoutDto {
  plan: string;
}

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar sessão de checkout' })
  @ApiBody({ schema: { properties: { plan: { type: 'string', enum: ['starter', 'pro', 'agency'] } } } })
  @ApiResponse({ status: 200, description: 'URL de checkout gerada' })
  async createCheckout(
    @CurrentUser() user: User,
    @Body() body: CreateCheckoutDto,
  ) {
    return this.stripeService.createCheckoutSession(user.id, body.plan);
  }

  @Post('portal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar sessão do portal de gestão' })
  @ApiResponse({ status: 200, description: 'URL do portal gerada' })
  async createPortal(@CurrentUser() user: User) {
    return this.stripeService.createPortalSession(user.id);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook do Stripe' })
  @ApiResponse({ status: 200, description: 'Webhook processado' })
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.rawBody;
    return this.stripeService.handleWebhook(signature, payload);
  }
}
