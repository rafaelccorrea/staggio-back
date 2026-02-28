import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';

export enum GenerationType {
  STAGING = 'staging',
  TERRAIN_VISION = 'terrain_vision',
  DESCRIPTION = 'description',
  PHOTO_ENHANCE = 'photo_enhance',
  VIRTUAL_TOUR = 'virtual_tour',
}

export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('generations')
export class Generation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GenerationType,
  })
  type: GenerationType;

  @Column({
    type: 'enum',
    enum: GenerationStatus,
    default: GenerationStatus.PENDING,
  })
  status: GenerationStatus;

  @Column({ nullable: true })
  inputImageUrl: string;

  @Column({ nullable: true })
  outputImageUrl: string;

  @Column({ type: 'text', nullable: true })
  inputPrompt: string;

  @Column({ type: 'text', nullable: true })
  outputText: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  processingTimeMs: number;

  @Column({ default: 1 })
  creditsUsed: number;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.generations)
  user: User;

  @Column({ nullable: true })
  propertyId: string;

  @ManyToOne(() => Property, (property) => property.generations, { nullable: true })
  property: Property;

  @CreateDateColumn()
  createdAt: Date;
}
