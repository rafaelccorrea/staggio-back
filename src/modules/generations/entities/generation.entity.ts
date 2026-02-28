import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';

export enum GenerationType {
  STAGING = 'staging',
  TERRAIN_VISION = 'terrain_vision',
  DESCRIPTION = 'description',
  PHOTO_ENHANCE = 'photo_enhance',
  CHAT = 'chat',
}

export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('generations')
export class Generation {
  @ApiProperty({ description: 'ID único da geração' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Tipo de geração', enum: GenerationType })
  @Column({ type: 'enum', enum: GenerationType })
  type: GenerationType;

  @ApiProperty({ description: 'Status da geração', enum: GenerationStatus })
  @Column({ type: 'enum', enum: GenerationStatus, default: GenerationStatus.PENDING })
  status: GenerationStatus;

  @ApiProperty({ description: 'URL da imagem de entrada', required: false })
  @Column({ name: 'input_image_url', nullable: true })
  inputImageUrl: string;

  @ApiProperty({ description: 'URL da imagem de saída', required: false })
  @Column({ name: 'output_image_url', nullable: true })
  outputImageUrl: string;

  @ApiProperty({ description: 'Prompt de entrada', required: false })
  @Column({ name: 'input_prompt', type: 'text', nullable: true })
  inputPrompt: string;

  @ApiProperty({ description: 'Texto de saída', required: false })
  @Column({ name: 'output_text', type: 'text', nullable: true })
  outputText: string;

  @ApiProperty({ description: 'Dados de entrada (JSON)', required: false })
  @Column({ name: 'input_data', type: 'jsonb', nullable: true })
  inputData: Record<string, any>;

  @ApiProperty({ description: 'Dados de saída (JSON)', required: false })
  @Column({ name: 'output_data', type: 'jsonb', nullable: true })
  outputData: Record<string, any>;

  @ApiProperty({ description: 'Créditos consumidos' })
  @Column({ name: 'credits_used', default: 1 })
  creditsUsed: number;

  @ApiProperty({ description: 'Tempo de processamento em ms', required: false })
  @Column({ name: 'processing_time_ms', nullable: true })
  processingTimeMs: number;

  @ApiProperty({ description: 'Mensagem de erro', required: false })
  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.generations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'property_id', nullable: true })
  propertyId: string;

  @ManyToOne(() => Property, (property) => property.generations, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ApiProperty({ description: 'Data de criação' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
