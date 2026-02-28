import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { User } from '../users/entities/user.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Listar planos disponíveis' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter assinatura atual' })
  async getCurrentSubscription(@CurrentUser() user: User) {
    return this.subscriptionsService.getCurrentSubscription(user);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas de uso' })
  async getUsage(@CurrentUser() user: User) {
    return this.subscriptionsService.getUsageStats(user.id);
  }
}
