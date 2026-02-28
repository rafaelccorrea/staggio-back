import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from './dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
  ) {}

  async create(userId: string, createPropertyDto: CreatePropertyDto): Promise<Property> {
    const property = this.propertiesRepository.create({
      ...createPropertyDto,
      userId,
    });

    return this.propertiesRepository.save(property);
  }

  async findAll(userId: string, query: PropertyQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.propertiesRepository
      .createQueryBuilder('property')
      .where('property.user_id = :userId', { userId });

    if (query.search) {
      qb.andWhere(
        '(property.title ILIKE :search OR property.address ILIKE :search OR property.city ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.type) {
      qb.andWhere('property.type = :type', { type: query.type });
    }

    if (query.status) {
      qb.andWhere('property.status = :status', { status: query.status });
    }

    if (query.minPrice) {
      qb.andWhere('property.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice) {
      qb.andWhere('property.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.city) {
      qb.andWhere('property.city ILIKE :city', { city: `%${query.city}%` });
    }

    qb.orderBy('property.created_at', 'DESC')
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

  async findOne(userId: string, id: string): Promise<Property> {
    const property = await this.propertiesRepository.findOne({
      where: { id, userId },
      relations: ['generations'],
    });

    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    return property;
  }

  async update(
    userId: string,
    id: string,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<Property> {
    const property = await this.findOne(userId, id);
    Object.assign(property, updatePropertyDto);
    return this.propertiesRepository.save(property);
  }

  async remove(userId: string, id: string): Promise<void> {
    const property = await this.findOne(userId, id);
    await this.propertiesRepository.remove(property);
  }

  async countByUser(userId: string): Promise<number> {
    return this.propertiesRepository.count({ where: { userId } });
  }
}
