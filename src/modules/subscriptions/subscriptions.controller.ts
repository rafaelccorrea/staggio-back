import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Listar planos disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de planos de assinatura' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter assinatura do utilizador' })
  @ApiResponse({ status: 200, description: 'Dados da assinatura' })
  async getMySubscription(@CurrentUser() user: User) {
    return this.subscriptionsService.findByUserId(user.id);
  }
}
