import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionPlan {
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
  INACTIVE = 'inactive',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.INACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  stripePriceId: string;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ default: 5 })
  aiCreditsLimit: number;

  @Column({ default: 0 })
  aiCreditsUsed: number;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.subscription)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || 
           this.status === SubscriptionStatus.TRIALING;
  }

  get hasCredits(): boolean {
    return this.aiCreditsUsed < this.aiCreditsLimit;
  }
}
