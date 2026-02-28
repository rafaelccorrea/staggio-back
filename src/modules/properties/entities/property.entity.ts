import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Generation } from '../../generations/entities/generation.entity';

export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  LAND = 'land',
  COMMERCIAL = 'commercial',
  FARM = 'farm',
  CONDO = 'condo',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RENTED = 'rented',
  INACTIVE = 'inactive',
}

@Entity('properties')
export class Property {
  @ApiProperty({ description: 'ID único do imóvel' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Título do imóvel' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ description: 'Descrição', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Descrição gerada por IA', required: false })
  @Column({ name: 'ai_description', type: 'text', nullable: true })
  aiDescription: string;

  @ApiProperty({ description: 'Tipo do imóvel', enum: PropertyType })
  @Column({ type: 'varchar', length: 20, default: PropertyType.HOUSE })
  type: PropertyType;

  @ApiProperty({ description: 'Status', enum: PropertyStatus })
  @Column({ type: 'varchar', length: 20, default: PropertyStatus.AVAILABLE })
  status: PropertyStatus;

  @ApiProperty({ description: 'Preço', required: false })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price: number;

  @ApiProperty({ description: 'Área em m²', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number;

  @ApiProperty({ description: 'Quartos', required: false })
  @Column({ nullable: true })
  bedrooms: number;

  @ApiProperty({ description: 'Banheiros', required: false })
  @Column({ nullable: true })
  bathrooms: number;

  @ApiProperty({ description: 'Vagas de garagem', required: false })
  @Column({ name: 'parking_spots', nullable: true })
  parkingSpots: number;

  @ApiProperty({ description: 'Endereço', required: false })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ description: 'Cidade', required: false })
  @Column({ nullable: true, length: 100 })
  city: string;

  @ApiProperty({ description: 'Estado', required: false })
  @Column({ nullable: true, length: 2 })
  state: string;

  @ApiProperty({ description: 'Bairro', required: false })
  @Column({ nullable: true, length: 100 })
  neighborhood: string;

  @ApiProperty({ description: 'CEP', required: false })
  @Column({ name: 'zip_code', nullable: true, length: 10 })
  zipCode: string;

  @ApiProperty({ description: 'URLs das imagens' })
  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @ApiProperty({ description: 'Características do imóvel' })
  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.properties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Generation, (generation) => generation.property)
  generations: Generation[];

  @ApiProperty({ description: 'Data de criação' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
