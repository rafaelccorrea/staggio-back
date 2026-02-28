import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { AiService } from './ai.service';
import { Generation } from '../generations/entities/generation.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { User, UserRole } from '../users/entities/user.entity';

jest.mock('openai', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    choices: [{ message: { content: 'Descrição gerada pela IA' } }],
    usage: { prompt_tokens: 100, completion_tokens: 200 },
  });
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe('AiService', () => {
  let service: AiService;
  let generationsRepository: any;
  let subscriptionsRepository: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    name: 'João Silva',
    email: 'joao@email.com',
    role: UserRole.CORRETOR,
  };

  const mockSubscription: Partial<Subscription> = {
    id: 'sub-uuid-1',
    plan: SubscriptionPlan.STARTER,
    status: SubscriptionStatus.ACTIVE,
    aiCreditsLimit: 20,
    aiCreditsUsed: 5,
    userId: 'user-uuid-1',
  };

  const mockGeneration: Partial<Generation> = {
    id: 'gen-uuid-1',
    userId: 'user-uuid-1',
  };

  beforeEach(async () => {
    generationsRepository = {
      create: jest.fn().mockReturnValue(mockGeneration),
      save: jest.fn().mockResolvedValue(mockGeneration),
    };

    subscriptionsRepository = {
      findOne: jest.fn().mockResolvedValue(mockSubscription),
      save: jest.fn().mockResolvedValue(mockSubscription),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: getRepositoryToken(Generation), useValue: generationsRepository },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionsRepository },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('checkCredits', () => {
    it('deve lançar ForbiddenException quando sem créditos', async () => {
      subscriptionsRepository.findOne.mockResolvedValue({
        ...mockSubscription,
        aiCreditsUsed: 20,
        aiCreditsLimit: 20,
      });

      await expect(
        service.generateDescription(mockUser as User, {
          propertyType: 'Apartamento',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar ForbiddenException quando sem assinatura', async () => {
      subscriptionsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.generateDescription(mockUser as User, {
          propertyType: 'Apartamento',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('generateDescription', () => {
    it('deve criar uma geração com sucesso', async () => {
      const result = await service.generateDescription(mockUser as User, {
        propertyType: 'Apartamento',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        neighborhood: 'Jardins',
        city: 'São Paulo',
      });

      expect(generationsRepository.create).toHaveBeenCalled();
      expect(generationsRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('generateStagingPrompt', () => {
    it('deve gerar prompt de staging com sucesso', async () => {
      const result = await service.generateStagingPrompt(mockUser as User, {
        style: 'modern',
        roomType: 'living_room',
      });

      expect(generationsRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('generateTerrainVision', () => {
    it('deve gerar visão de terreno com sucesso', async () => {
      const result = await service.generateTerrainVision(mockUser as User, {
        buildingType: 'residential_house',
        style: 'modern',
        floors: 2,
      });

      expect(generationsRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('generatePhotoEnhancePrompt', () => {
    it('deve gerar prompt de melhoria de foto', async () => {
      const result = await service.generatePhotoEnhancePrompt(mockUser as User, {
        enhancementType: 'lighting',
      });

      expect(generationsRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
