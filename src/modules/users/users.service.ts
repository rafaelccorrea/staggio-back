import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['subscription'],
    });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['subscription'],
    });
  }

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    await this.usersRepository.update(id, { avatarUrl });
    return this.findById(id);
  }

  async updateStripeCustomerId(id: string, stripeCustomerId: string): Promise<void> {
    await this.usersRepository.update(id, { stripeCustomerId });
  }

  async getDashboardStats(userId: string) {
    const user = await this.findById(userId);
    
    return {
      plan: user.subscription?.plan || 'free',
      aiCreditsUsed: user.subscription?.aiCreditsUsed || 0,
      aiCreditsLimit: user.subscription?.aiCreditsLimit || 5,
      propertiesCount: 0,
      generationsCount: 0,
    };
  }
}
