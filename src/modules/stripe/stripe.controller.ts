import {
  Controller, Post, Body, Headers, Req,
  UseGuards, RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { StripeService } from './stripe.service';
import { User } from '../users/entities/user.entity';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar sessão de checkout' })
  async createCheckout(
    @CurrentUser() user: User,
    @Body('plan') plan: 'starter' | 'pro' | 'agency',
  ) {
    return this.stripeService.createCheckoutSession(user, plan);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar sessão do portal de faturação' })
  async createPortal(@CurrentUser() user: User) {
    return this.stripeService.createPortalSession(user);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Webhook do Stripe' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.stripeService.handleWebhook(rawBody, signature);
  }
}
