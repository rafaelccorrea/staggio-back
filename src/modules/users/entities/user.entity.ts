import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Property } from '../../properties/entities/property.entity';
import { Generation } from '../../generations/entities/generation.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

export enum UserRole {
  CORRETOR = 'corretor',
  IMOBILIARIA = 'imobiliaria',
  ADMIN = 'admin',
}

export enum UserPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  AGENCY = 'agency',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID único do utilizador' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nome completo' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Email' })
  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ description: 'Telefone', required: false })
  @Column({ nullable: true, length: 20 })
  phone: string;

  @ApiProperty({ description: 'CRECI do corretor', required: false })
  @Column({ nullable: true, length: 50 })
  creci: string;

  @ApiProperty({ description: 'URL do avatar', required: false })
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @ApiProperty({ description: 'Papel do utilizador', enum: UserRole })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.CORRETOR })
  role: UserRole;

  @ApiProperty({ description: 'Plano atual', enum: UserPlan })
  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @ApiProperty({ description: 'Créditos de IA utilizados no mês' })
  @Column({ name: 'ai_credits_used', default: 0 })
  aiCreditsUsed: number;

  @ApiProperty({ description: 'Limite de créditos de IA' })
  @Column({ name: 'ai_credits_limit', default: 5 })
  aiCreditsLimit: number;

  @ApiProperty({ description: 'Créditos bônus comprados avulsos (não resetam mensalmente)' })
  @Column({ name: 'bonus_credits', default: 0 })
  bonusCredits: number;

  @ApiProperty({ description: 'ID do cliente no Stripe', required: false })
  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string;

  @ApiProperty({ description: 'Conta ativa' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Property, (property) => property.user)
  properties: Property[];

  @OneToMany(() => Generation, (generation) => generation.user)
  generations: Generation[];

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription;
}
