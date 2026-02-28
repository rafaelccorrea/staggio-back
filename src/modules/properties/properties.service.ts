import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
  ) {}

  async create(user: User, data: Partial<Property>): Promise<Property> {
    const property = this.propertiesRepository.create({
      ...data,
      userId: user.id,
    });
    return this.propertiesRepository.save(property);
  }

  async findAll(user: User, page = 1, limit = 20): Promise<{ data: Property[]; total: number }> {
    const [data, total] = await this.propertiesRepository.findAndCount({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string, user: User): Promise<Property> {
    const property = await this.propertiesRepository.findOne({
      where: { id },
      relations: ['generations'],
    });

    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    if (property.userId !== user.id) {
      throw new ForbiddenException('Sem permissão para acessar este imóvel');
    }

    return property;
  }

  async update(id: string, user: User, data: Partial<Property>): Promise<Property> {
    const property = await this.findOne(id, user);
    Object.assign(property, data);
    return this.propertiesRepository.save(property);
  }

  async remove(id: string, user: User): Promise<void> {
    const property = await this.findOne(id, user);
    await this.propertiesRepository.remove(property);
  }

  async addImages(id: string, user: User, imageUrls: string[]): Promise<Property> {
    const property = await this.findOne(id, user);
    property.images = [...(property.images || []), ...imageUrls];
    return this.propertiesRepository.save(property);
  }

  async getStats(user: User) {
    const total = await this.propertiesRepository.count({ where: { userId: user.id } });
    const available = await this.propertiesRepository.count({ 
      where: { userId: user.id, status: 'available' as any } 
    });
    const sold = await this.propertiesRepository.count({ 
      where: { userId: user.id, status: 'sold' as any } 
    });
    
    return { total, available, sold, rented: total - available - sold };
  }
}
