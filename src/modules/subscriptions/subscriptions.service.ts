import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { User, UserPlan } from '../users/entities/user.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: { userId },
    });
  }

  async getPlans() {
    return [
      {
        id: 'starter',
        name: 'Starter',
        price: 39.90,
        currency: 'BRL',
        interval: 'month',
        credits: 50,
        features: [
          'Home Staging Virtual',
          'Descrições com IA',
          'Melhoria de Fotos',
          '50 créditos/mês',
          'Suporte por email',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 79.90,
        currency: 'BRL',
        interval: 'month',
        credits: 200,
        popular: true,
        features: [
          'Tudo do Starter',
          'Visão de Terreno',
          'Chat IA Assistente',
          '200 créditos/mês',
          'Suporte prioritário',
          'Exportação em alta qualidade',
        ],
      },
      {
        id: 'agency',
        name: 'Imobiliária',
        price: 199.90,
        currency: 'BRL',
        interval: 'month',
        credits: -1,
        features: [
          'Tudo do Pro',
          'Créditos ilimitados',
          'Multi-utilizadores',
          'API de integração',
          'Suporte dedicado',
          'Relatórios avançados',
          'White-label',
        ],
      },
    ];
  }

  async createOrUpdate(
    userId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    plan: UserPlan,
    status: SubscriptionStatus,
    currentPeriodStart?: Date,
    currentPeriodEnd?: Date,
  ): Promise<Subscription> {
    let subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    const creditsMap: Record<string, number> = {
      [UserPlan.STARTER]: 50,
      [UserPlan.PRO]: 200,
      [UserPlan.AGENCY]: 999999,
      [UserPlan.FREE]: 5,
    };

    if (subscription) {
      subscription.stripeSubscriptionId = stripeSubscriptionId;
      subscription.stripePriceId = stripePriceId;
      subscription.plan = plan;
      subscription.status = status;
      if (currentPeriodStart) subscription.currentPeriodStart = currentPeriodStart;
      if (currentPeriodEnd) subscription.currentPeriodEnd = currentPeriodEnd;
    } else {
      subscription = this.subscriptionsRepository.create({
        userId,
        stripeSubscriptionId,
        stripePriceId,
        plan,
        status,
        currentPeriodStart,
        currentPeriodEnd,
      });
    }

    const savedSubscription = await this.subscriptionsRepository.save(subscription);

    // Atualizar plano e créditos do utilizador
    await this.usersRepository.update(userId, {
      plan,
      aiCreditsLimit: creditsMap[plan] || 5,
      aiCreditsUsed: 0,
    });

    return savedSubscription;
  }

  async cancel(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    subscription.cancelAtPeriodEnd = true;
    return this.subscriptionsRepository.save(subscription);
  }
}
