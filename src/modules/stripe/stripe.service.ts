import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';
import { SubscriptionPlan } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
    private usersService: UsersService,
  ) {
    this.stripe = new Stripe(
      this.configService.get('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
      { apiVersion: '2023-10-16' as any },
    );
  }

  async createCustomer(user: User): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });

    await this.usersService.updateStripeCustomerId(user.id, customer.id);
    return customer.id;
  }

  async createCheckoutSession(
    user: User,
    plan: 'starter' | 'pro' | 'agency',
  ): Promise<{ url: string }> {
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      customerId = await this.createCustomer(user);
    }

    const priceIdMap: Record<string, string> = {
      starter: this.configService.get('STRIPE_STARTER_PRICE_ID', 'price_starter'),
      pro: this.configService.get('STRIPE_PRO_PRICE_ID', 'price_pro'),
      agency: this.configService.get('STRIPE_AGENCY_PRICE_ID', 'price_agency'),
    };

    const priceId = priceIdMap[plan];
    if (!priceId) {
      throw new BadRequestException('Plano inválido');
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${this.configService.get('FRONTEND_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/subscription/cancel`,
      metadata: { userId: user.id, plan },
    });

    return { url: session.url! };
  }

  async createPortalSession(user: User): Promise<{ url: string }> {
    if (!user.stripeCustomerId) {
      throw new BadRequestException('Nenhuma assinatura ativa');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/profile`,
    });

    return { url: session.url! };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as SubscriptionPlan;
        
        if (userId && plan) {
          await this.subscriptionsService.updateSubscription(
            userId,
            plan,
            session.subscription as string,
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription updates
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await this.stripe.customers.retrieve(
          subscription.customer as string,
        );
        
        if (customer && !customer.deleted) {
          const userId = (customer as Stripe.Customer).metadata?.userId;
          if (userId) {
            await this.subscriptionsService.cancelSubscription(userId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Handle failed payment
        break;
      }
    }
  }
}
