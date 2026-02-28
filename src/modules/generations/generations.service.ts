import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Generation, GenerationType } from './entities/generation.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GenerationsService {
  constructor(
    @InjectRepository(Generation)
    private generationsRepository: Repository<Generation>,
  ) {}

  async findAll(
    user: User,
    page = 1,
    limit = 20,
    type?: GenerationType,
  ): Promise<{ data: Generation[]; total: number }> {
    const where: any = { userId: user.id };
    if (type) where.type = type;

    const [data, total] = await this.generationsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['property'],
    });

    return { data, total };
  }

  async findOne(id: string, user: User): Promise<Generation | null> {
    return this.generationsRepository.findOne({
      where: { id, userId: user.id },
      relations: ['property'],
    });
  }

  async getStats(user: User) {
    const total = await this.generationsRepository.count({ where: { userId: user.id } });
    const byType = await this.generationsRepository
      .createQueryBuilder('generation')
      .select('generation.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('generation.userId = :userId', { userId: user.id })
      .groupBy('generation.type')
      .getRawMany();

    return { total, byType };
  }
}
