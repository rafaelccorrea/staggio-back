import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: any;
  let subscriptionsRepository: any;
  let jwtService: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    name: 'João Silva',
    email: 'joao@email.com',
    password: 'hashed_password',
    role: UserRole.CORRETOR,
    isActive: true,
    phone: '11999999999',
    creci: '12345-F',
    avatarUrl: undefined,
  };

  const mockSubscription: Partial<Subscription> = {
    id: 'sub-uuid-1',
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.ACTIVE,
    aiCreditsLimit: 5,
    aiCreditsUsed: 0,
    userId: 'user-uuid-1',
  };

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    subscriptionsRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionsRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('deve registar um novo utilizador com sucesso', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);
      subscriptionsRepository.create.mockReturnValue(mockSubscription);
      subscriptionsRepository.save.mockResolvedValue(mockSubscription);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.register({
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        phone: '11999999999',
        creci: '12345-F',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('joao@email.com');
      expect(result.user.name).toBe('João Silva');
      expect(usersRepository.save).toHaveBeenCalled();
      expect(subscriptionsRepository.save).toHaveBeenCalled();
    });

    it('deve lançar ConflictException se email já existe', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          name: 'João Silva',
          email: 'joao@email.com',
          password: 'senha123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      usersRepository.findOne.mockResolvedValue({
        ...mockUser,
        subscription: mockSubscription,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'joao@email.com',
        password: 'senha123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('joao@email.com');
    });

    it('deve lançar UnauthorizedException para email inválido', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'invalido@email.com',
          password: 'senha123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para senha inválida', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'joao@email.com',
          password: 'senha_errada',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para conta desativada', async () => {
      usersRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({
          email: 'joao@email.com',
          password: 'senha123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('deve validar utilizador ativo', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-uuid-1');
      expect(result).toEqual(mockUser);
    });

    it('deve lançar UnauthorizedException para utilizador inexistente', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser('invalid-uuid'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
