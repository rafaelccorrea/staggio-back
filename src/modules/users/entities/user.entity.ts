import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Property } from '../../properties/entities/property.entity';
import { Generation } from '../../generations/entities/generation.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

export enum UserRole {
  CORRETOR = 'corretor',
  IMOBILIARIA = 'imobiliaria',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  creci: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CORRETOR,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ default: 0 })
  aiCreditsUsed: number;

  @Column({ default: 20 })
  aiCreditsLimit: number;

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription;

  @OneToMany(() => Property, (property) => property.user)
  properties: Property[];

  @OneToMany(() => Generation, (generation) => generation.user)
  generations: Generation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
