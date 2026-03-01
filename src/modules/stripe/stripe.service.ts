import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { UserPlan } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      { apiVersion: '2023-10-16' as any },
    );
  }

  /**
   * Criar sessão de checkout para assinatura
   */
  async createCheckoutSession(userId: string, plan: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('Utilizador não encontrado');
    }

    // Criar ou obter customer no Stripe
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await this.usersRepository.update(userId, { stripeCustomerId: customerId });
    }

    // Mapear plano para price ID
    const priceMap: Record<string, string> = {
      starter: this.configService.get<string>('STRIPE_STARTER_PRICE_ID'),
      pro: this.configService.get<string>('STRIPE_PRO_PRICE_ID'),
      agency: this.configService.get<string>('STRIPE_AGENCY_PRICE_ID'),
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      throw new Error('Plano inválido');
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.configService.get('APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('APP_URL')}/subscription/cancel`,
      metadata: { userId, plan },
    });

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Pacotes de créditos avulsos (exponenciais)
   */
  private creditPacks: Record<string, { credits: number; priceInCents: number; name: string }> = {
    pack_10: { credits: 10, priceInCents: 1490, name: '10 Créditos' },
    pack_30: { credits: 30, priceInCents: 3490, name: '30 Créditos' },
    pack_80: { credits: 80, priceInCents: 6990, name: '80 Créditos' },
    pack_200: { credits: 200, priceInCents: 14990, name: '200 Créditos' },
    pack_500: { credits: 500, priceInCents: 29990, name: '500 Créditos' },
  };

  /**
   * Criar sessão de checkout para compra de créditos avulsos
   */
  async createCreditsPurchaseSession(userId: string, pack: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('Utilizador não encontrado');
    }

    const packData = this.creditPacks[pack];
    if (!packData) {
      throw new Error('Pacote inválido');
    }

    // Criar ou obter customer no Stripe
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await this.usersRepository.update(userId, { stripeCustomerId: customerId });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Staggio - ${packData.name}`,
              description: `${packData.credits} créditos de IA para usar quando quiser`,
            },
            unit_amount: packData.priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get('APP_URL')}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('APP_URL')}/credits/cancel`,
      metadata: { userId, pack, type: 'credit_purchase', credits: packData.credits.toString() },
    });

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Criar portal de gestão de assinatura
   */
  async createPortalSession(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user?.stripeCustomerId) {
      throw new Error('Utilizador sem assinatura ativa');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.configService.get('APP_URL')}/profile`,
    });

    return { url: session.url };
  }

  /**
   * Processar webhook do Stripe
   */
  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new Error('Webhook signature verification failed');
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      // Handled above in the new checkout.session.completed case
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === 'credit_purchase') {
          await this.handleCreditsPurchase(session);
        } else {
          await this.handleCheckoutCompleted(session);
        }
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as UserPlan;

    if (!userId || !plan) return;

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    await this.subscriptionsService.createOrUpdate(
      userId,
      subscription.id,
      subscription.items.data[0].price.id,
      plan,
      SubscriptionStatus.ACTIVE,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
    );
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customer = await this.stripe.customers.retrieve(
      subscription.customer as string,
    );

    if ('deleted' in customer && customer.deleted) return;

    const userId = (customer as Stripe.Customer).metadata?.userId;
    if (!userId) return;

    const priceId = subscription.items.data[0].price.id;
    const plan = this.getPlanFromPriceId(priceId);

    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      trialing: SubscriptionStatus.TRIALING,
      incomplete: SubscriptionStatus.INCOMPLETE,
    };

    await this.subscriptionsService.createOrUpdate(
      userId,
      subscription.id,
      priceId,
      plan,
      statusMap[subscription.status] || SubscriptionStatus.ACTIVE,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
    );
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customer = await this.stripe.customers.retrieve(
      subscription.customer as string,
    );

    if ('deleted' in customer && customer.deleted) return;

    const userId = (customer as Stripe.Customer).metadata?.userId;
    if (!userId) return;

    await this.subscriptionsService.createOrUpdate(
      userId,
      subscription.id,
      subscription.items.data[0].price.id,
      UserPlan.FREE,
      SubscriptionStatus.CANCELED,
    );
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.warn(`Payment failed for invoice: ${invoice.id}`);
  }

  /**
   * Processar compra de créditos avulsos
   */
  private async handleCreditsPurchase(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (!userId || credits <= 0) {
      this.logger.error('Dados inválidos na compra de créditos');
      return;
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.error(`Usuário não encontrado: ${userId}`);
      return;
    }

    // Adicionar créditos bônus (não resetam mensalmente)
    await this.usersRepository.update(userId, {
      bonusCredits: (user.bonusCredits || 0) + credits,
    });

    this.logger.log(`${credits} créditos bônus adicionados para usuário ${userId}`);
  }

  private getPlanFromPriceId(priceId: string): UserPlan {
    const starterPriceId = this.configService.get<string>('STRIPE_STARTER_PRICE_ID');
    const proPriceId = this.configService.get<string>('STRIPE_PRO_PRICE_ID');
    const agencyPriceId = this.configService.get<string>('STRIPE_AGENCY_PRICE_ID');

    if (priceId === starterPriceId) return UserPlan.STARTER;
    if (priceId === proPriceId) return UserPlan.PRO;
    if (priceId === agencyPriceId) return UserPlan.AGENCY;
    return UserPlan.FREE;
  }
}
