import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Property, PropertyType, PropertyStatus } from './entities/property.entity';
import { NotFoundException } from '@nestjs/common';

const mockProperty: Partial<Property> = {
  id: 'prop-uuid-123',
  title: 'Casa moderna',
  type: PropertyType.HOUSE,
  status: PropertyStatus.AVAILABLE,
  price: 850000,
  area: 250,
  bedrooms: 3,
  bathrooms: 2,
  city: 'São Paulo',
  userId: 'uuid-123',
};

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[mockProperty], 1]),
};

const mockPropertiesRepository = {
  create: jest.fn().mockReturnValue(mockProperty),
  save: jest.fn().mockResolvedValue(mockProperty),
  findOne: jest.fn(),
  remove: jest.fn().mockResolvedValue(undefined),
  count: jest.fn().mockResolvedValue(5),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: getRepositoryToken(Property), useValue: mockPropertiesRepository },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um imóvel com sucesso', async () => {
      const result = await service.create('uuid-123', {
        title: 'Casa moderna',
        type: PropertyType.HOUSE,
        price: 850000,
      });

      expect(result).toHaveProperty('id');
      expect(mockPropertiesRepository.create).toHaveBeenCalled();
      expect(mockPropertiesRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve listar imóveis com paginação', async () => {
      const result = await service.findAll('uuid-123', { page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
      expect(mockPropertiesRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('deve filtrar por tipo', async () => {
      await service.findAll('uuid-123', { type: PropertyType.HOUSE });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve encontrar um imóvel por ID', async () => {
      mockPropertiesRepository.findOne.mockResolvedValue(mockProperty);

      const result = await service.findOne('uuid-123', 'prop-uuid-123');

      expect(result).toHaveProperty('id', 'prop-uuid-123');
    });

    it('deve lançar NotFoundException se imóvel não existe', async () => {
      mockPropertiesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('uuid-123', 'nao-existe'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um imóvel', async () => {
      mockPropertiesRepository.findOne.mockResolvedValue(mockProperty);

      const result = await service.update('uuid-123', 'prop-uuid-123', {
        title: 'Casa atualizada',
      });

      expect(mockPropertiesRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover um imóvel', async () => {
      mockPropertiesRepository.findOne.mockResolvedValue(mockProperty);

      await service.remove('uuid-123', 'prop-uuid-123');

      expect(mockPropertiesRepository.remove).toHaveBeenCalled();
    });
  });

  describe('countByUser', () => {
    it('deve contar imóveis do utilizador', async () => {
      const result = await service.countByUser('uuid-123');

      expect(result).toBe(5);
    });
  });
});
