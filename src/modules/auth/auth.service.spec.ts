import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserPlan } from '../users/entities/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUser: Partial<User> = {
  id: 'uuid-123',
  name: 'Test User',
  email: 'test@staggio.com',
  password: '$2b$12$hashedpassword',
  role: UserRole.CORRETOR,
  plan: UserPlan.FREE,
  isActive: true,
  aiCreditsUsed: 0,
  aiCreditsLimit: 5,
};

const mockUsersRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('jwt-token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('7d'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('deve registar um novo utilizador com sucesso', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue(mockUser);
      mockUsersRepository.save.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Test User',
        email: 'test@staggio.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockUsersRepository.save).toHaveBeenCalled();
    });

    it('deve lançar ConflictException se email já existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          name: 'Test',
          email: 'test@staggio.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.login({
        email: 'test@staggio.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('deve lançar UnauthorizedException se utilizador não existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'naoexiste@staggio.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se senha está errada', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        password: await bcrypt.hash('outrasenha', 12),
      });

      await expect(
        service.login({
          email: 'test@staggio.com',
          password: 'senhaerrada',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se conta está desativada', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login({
          email: 'test@staggio.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('deve renovar token com sucesso', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'uuid-123' });
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('deve lançar UnauthorizedException se token é inválido', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refreshToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
