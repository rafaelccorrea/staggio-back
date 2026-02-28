import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Generation } from '../../generations/entities/generation.entity';

export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  LAND = 'land',
  COMMERCIAL = 'commercial',
  FARM = 'farm',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RENTED = 'rented',
  INACTIVE = 'inactive',
}

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
    default: PropertyType.HOUSE,
  })
  type: PropertyType;

  @Column({
    type: 'enum',
    enum: PropertyStatus,
    default: PropertyStatus.AVAILABLE,
  })
  status: PropertyStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number;

  @Column({ nullable: true })
  bedrooms: number;

  @Column({ nullable: true })
  bathrooms: number;

  @Column({ nullable: true })
  parkingSpots: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  neighborhood: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('simple-array', { nullable: true })
  features: string[];

  @Column({ type: 'text', nullable: true })
  aiDescription: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.properties)
  user: User;

  @OneToMany(() => Generation, (generation) => generation.property)
  generations: Generation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
