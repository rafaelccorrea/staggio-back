import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserPlan, UserRole } from '../users/entities/user.entity';
import { Generation, GenerationType, GenerationStatus } from '../generations/entities/generation.entity';
import { ForbiddenException } from '@nestjs/common';

// Mock OpenAI
jest.mock('openai', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    choices: [{ message: { content: 'AI generated text response' } }],
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

const mockUser: Partial<User> = {
  id: 'uuid-123',
  name: 'Test User',
  email: 'test@staggio.com',
  role: UserRole.CORRETOR,
  plan: UserPlan.STARTER,
  isActive: true,
  aiCreditsUsed: 0,
  aiCreditsLimit: 50,
};

const mockGeneration: Partial<Generation> = {
  id: 'gen-uuid-123',
  type: GenerationType.DESCRIPTION,
  status: GenerationStatus.COMPLETED,
  userId: 'uuid-123',
};

const mockUsersRepository = {
  findOne: jest.fn(),
  increment: jest.fn(),
};

const mockGenerationsRepository = {
  create: jest.fn().mockReturnValue(mockGeneration),
  save: jest.fn().mockResolvedValue(mockGeneration),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('sk-test-key'),
};

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: getRepositoryToken(Generation), useValue: mockGenerationsRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('description', () => {
    it('deve gerar descrição com sucesso', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.increment.mockResolvedValue(undefined);

      const result = await service.description('uuid-123', {
        title: 'Casa moderna',
        type: 'casa',
        bedrooms: '3',
        city: 'São Paulo',
      });

      expect(result).toHaveProperty('type', 'description');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('outputText');
      expect(mockGenerationsRepository.save).toHaveBeenCalled();
    });

    it('deve recusar se créditos insuficientes', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        aiCreditsUsed: 50,
        aiCreditsLimit: 50,
      });

      await expect(
        service.description('uuid-123', {
          title: 'Casa moderna',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('chat', () => {
    it('deve responder ao chat com sucesso', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.increment.mockResolvedValue(undefined);

      const result = await service.chat('uuid-123', {
        message: 'Como vender mais rápido?',
      });

      expect(result).toHaveProperty('type', 'chat');
      expect(result).toHaveProperty('message');
      expect(mockGenerationsRepository.save).toHaveBeenCalled();
    });
  });

  describe('staging', () => {
    it('deve processar staging com sucesso', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.increment.mockResolvedValue(undefined);

      const result = await service.staging('uuid-123', {
        imageUrl: 'https://example.com/room.jpg',
        style: 'moderno' as any,
      });

      expect(result).toHaveProperty('type', 'staging');
      expect(result).toHaveProperty('status', 'completed');
    });

    it('deve recusar staging se conta desativada', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.staging('uuid-123', {
          imageUrl: 'https://example.com/room.jpg',
          style: 'moderno' as any,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('terrainVision', () => {
    it('deve processar visão de terreno com sucesso', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.increment.mockResolvedValue(undefined);

      const result = await service.terrainVision('uuid-123', {
        imageUrl: 'https://example.com/terrain.jpg',
        buildingType: 'casa' as any,
      });

      expect(result).toHaveProperty('type', 'terrain_vision');
      expect(result).toHaveProperty('status', 'completed');
    });

    it('deve consumir 3 créditos para visão de terreno', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.increment.mockResolvedValue(undefined);

      const result = await service.terrainVision('uuid-123', {
        imageUrl: 'https://example.com/terrain.jpg',
        buildingType: 'casa' as any,
      });

      expect(result.creditsUsed).toBe(3);
      expect(mockUsersRepository.increment).toHaveBeenCalledWith(
        { id: 'uuid-123' },
        'aiCreditsUsed',
        3,
      );
    });
  });

  describe('photoEnhance', () => {
    it('deve analisar foto com sucesso', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.increment.mockResolvedValue(undefined);

      const result = await service.photoEnhance('uuid-123', {
        imageUrl: 'https://example.com/photo.jpg',
      });

      expect(result).toHaveProperty('type', 'photo_enhance');
      expect(result).toHaveProperty('status', 'completed');
    });
  });
});
