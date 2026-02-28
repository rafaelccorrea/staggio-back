import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { Property, PropertyType, PropertyStatus } from './entities/property.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let repository: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    name: 'João Silva',
    email: 'joao@email.com',
    role: UserRole.CORRETOR,
  };

  const mockProperty: Partial<Property> = {
    id: 'prop-uuid-1',
    title: 'Apartamento Jardins',
    type: PropertyType.APARTMENT,
    status: PropertyStatus.AVAILABLE,
    price: 850000,
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    userId: 'user-uuid-1',
    images: [],
    features: ['Piscina', 'Churrasqueira'],
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn().mockReturnValue(mockProperty),
      save: jest.fn().mockResolvedValue(mockProperty),
      findOne: jest.fn().mockResolvedValue(mockProperty),
      findAndCount: jest.fn().mockResolvedValue([[mockProperty], 1]),
      remove: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(5),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: getRepositoryToken(Property), useValue: repository },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  describe('create', () => {
    it('deve criar um imóvel com sucesso', async () => {
      const result = await service.create(mockUser as User, {
        title: 'Apartamento Jardins',
        type: PropertyType.APARTMENT,
        price: 850000,
      });

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.title).toBe('Apartamento Jardins');
    });
  });

  describe('findAll', () => {
    it('deve listar imóveis do utilizador', async () => {
      const result = await service.findAll(mockUser as User);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('deve suportar paginação', async () => {
      await service.findAll(mockUser as User, 2, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar um imóvel', async () => {
      const result = await service.findOne('prop-uuid-1', mockUser as User);
      expect(result.id).toBe('prop-uuid-1');
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('invalid-uuid', mockUser as User),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException se não for dono', async () => {
      repository.findOne.mockResolvedValue({
        ...mockProperty,
        userId: 'outro-user',
      });

      await expect(
        service.findOne('prop-uuid-1', mockUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('deve atualizar um imóvel', async () => {
      const result = await service.update('prop-uuid-1', mockUser as User, {
        title: 'Novo Título',
      });

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover um imóvel', async () => {
      await service.remove('prop-uuid-1', mockUser as User);
      expect(repository.remove).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas', async () => {
      const result = await service.getStats(mockUser as User);
      expect(result.total).toBe(5);
    });
  });
});
