import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 5,
  [SubscriptionPlan.STARTER]: 20,
  [SubscriptionPlan.PRO]: 80,
  [SubscriptionPlan.AGENCY]: 999,
};

const PLAN_PRICES: Record<string, { name: string; price: number; features: string[] }> = {
  free: {
    name: 'Gratuito',
    price: 0,
    features: [
      '5 gerações de IA/mês',
      'Descrições automáticas',
      'Até 5 imóveis',
    ],
  },
  starter: {
    name: 'Starter',
    price: 39.90,
    features: [
      '20 gerações de IA/mês',
      'Home Staging Virtual',
      'Descrições automáticas',
      'Melhoria de fotos',
      'Até 50 imóveis',
      'Assistente IA',
    ],
  },
  pro: {
    name: 'Pro',
    price: 79.90,
    features: [
      '80 gerações de IA/mês',
      'Tudo do Starter',
      'Visão de Terrenos',
      'Tours Virtuais',
      'Imóveis ilimitados',
      'Assistente IA Premium',
      'Suporte prioritário',
    ],
  },
  agency: {
    name: 'Imobiliária',
    price: 199.90,
    features: [
      'Gerações ilimitadas',
      'Tudo do Pro',
      'Múltiplos corretores',
      'Painel de gestão',
      'Marca própria',
      'API dedicada',
      'Suporte VIP',
    ],
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async getPlans() {
    return PLAN_PRICES;
  }

  async getCurrentSubscription(user: User): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId: user.id },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    return subscription;
  }

  async updateSubscription(
    userId: string,
    plan: SubscriptionPlan,
    stripeSubscriptionId?: string,
    stripePriceId?: string,
  ): Promise<Subscription> {
    let subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      subscription = this.subscriptionsRepository.create({
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        aiCreditsLimit: PLAN_LIMITS[plan],
        aiCreditsUsed: 0,
      });
    } else {
      subscription.plan = plan;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.aiCreditsLimit = PLAN_LIMITS[plan];
      subscription.aiCreditsUsed = 0;
    }

    if (stripeSubscriptionId) {
      subscription.stripeSubscriptionId = stripeSubscriptionId;
    }
    if (stripePriceId) {
      subscription.stripePriceId = stripePriceId;
    }

    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.subscriptionsRepository.save(subscription);
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceledAt = new Date();

    return this.subscriptionsRepository.save(subscription);
  }

  async resetMonthlyCredits(): Promise<void> {
    await this.subscriptionsRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ aiCreditsUsed: 0 })
      .where('status = :status', { status: SubscriptionStatus.ACTIVE })
      .execute();
  }

  async getUsageStats(userId: string) {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      return { used: 0, limit: 5, percentage: 0 };
    }

    return {
      used: subscription.aiCreditsUsed,
      limit: subscription.aiCreditsLimit,
      percentage: Math.round((subscription.aiCreditsUsed / subscription.aiCreditsLimit) * 100),
      plan: subscription.plan,
      renewsAt: subscription.currentPeriodEnd,
    };
  }
}
