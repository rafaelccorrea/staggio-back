import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

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
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateCredits(id: string, creditsToAdd: number): Promise<User> {
    const user = await this.findById(id);
    user.aiCreditsUsed += creditsToAdd;
    return this.usersRepository.save(user);
  }

  async resetMonthlyCredits(): Promise<void> {
    await this.usersRepository.update({}, { aiCreditsUsed: 0 });
  }

  async getDashboardStats(userId: string) {
    const user = await this.findById(userId);
    const plan = user.subscription?.plan || 'free';

    return {
      plan,
      creditsUsed: user.aiCreditsUsed,
      creditsLimit: user.aiCreditsLimit,
      creditsRemaining: user.aiCreditsLimit - user.aiCreditsUsed,
      creditsPercentage:
        user.aiCreditsLimit > 0
          ? Math.round((user.aiCreditsUsed / user.aiCreditsLimit) * 100)
          : 0,
    };
  }
}
