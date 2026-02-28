import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Generation } from './entities/generation.entity';
import { GenerationQueryDto } from './dto/generation-query.dto';

@Injectable()
export class GenerationsService {
  constructor(
    @InjectRepository(Generation)
    private generationsRepository: Repository<Generation>,
  ) {}

  async findAll(userId: string, query: GenerationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.generationsRepository
      .createQueryBuilder('generation')
      .where('generation.user_id = :userId', { userId });

    if (query.type) {
      qb.andWhere('generation.type = :type', { type: query.type });
    }

    if (query.status) {
      qb.andWhere('generation.status = :status', { status: query.status });
    }

    qb.orderBy('generation.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<Generation> {
    const generation = await this.generationsRepository.findOne({
      where: { id, userId },
    });

    if (!generation) {
      throw new NotFoundException('Geração não encontrada');
    }

    return generation;
  }

  async getStats(userId: string) {
    const totalGenerations = await this.generationsRepository.count({
      where: { userId },
    });

    const byType = await this.generationsRepository
      .createQueryBuilder('generation')
      .select('generation.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(generation.credits_used)', 'totalCredits')
      .where('generation.user_id = :userId', { userId })
      .groupBy('generation.type')
      .getRawMany();

    return {
      totalGenerations,
      byType,
    };
  }
}
