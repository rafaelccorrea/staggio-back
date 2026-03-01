import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  AGENCY = 'agency',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
}

@Entity('subscriptions')
export class Subscription {
  @ApiProperty({ description: 'ID único da assinatura' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID da assinatura no Stripe' })
  @Column({ name: 'stripe_subscription_id', unique: true })
  stripeSubscriptionId: string;

  @ApiProperty({ description: 'ID do preço no Stripe' })
  @Column({ name: 'stripe_price_id' })
  stripePriceId: string;

  @ApiProperty({ description: 'Plano', enum: PlanType })
  @Column({ type: 'enum', enum: PlanType, default: PlanType.FREE })
  plan: PlanType;

  @ApiProperty({ description: 'Status', enum: SubscriptionStatus })
  @Column({ type: 'varchar', length: 30, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Data de início do período atual' })
  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Data de fim do período atual' })
  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Cancelamento agendado' })
  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
