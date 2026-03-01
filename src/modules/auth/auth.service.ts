import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto, LoginDto } from './dto/register.dto';
import * as admin from 'firebase-admin';

const PLAN_CREDITS_MAP: Record<string, number> = {
  free: 5,
  starter: 50,
  pro: 200,
  agency: 500,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Inicializar Firebase Admin SDK (apenas uma vez)
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.logger.log('Firebase Admin SDK inicializado com sucesso');
      } else {
        this.logger.warn('Firebase Admin SDK n\u00e3o configurado - vari\u00e1veis de ambiente ausentes');
      }
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Este email já está registado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    const tokens = await this.generateTokens(savedUser);

    const { password, ...userWithoutPassword } = savedUser;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: ['subscription'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user);
    const { password, ...userWithoutPassword } = user;

    const plan = user.subscription?.plan || 'free';
    return {
      ...tokens,
      user: {
        ...userWithoutPassword,
        plan,
        aiCreditsLimit: PLAN_CREDITS_MAP[plan] || 5,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub, isActive: true },
        relations: ['subscription'],
      });

      if (!user) {
        throw new UnauthorizedException('Utilizador não encontrado');
      }

      const tokens = await this.generateTokens(user);
      const { password, ...userWithoutPassword } = user;

      const plan = user.subscription?.plan || 'free';
      return {
        ...tokens,
        user: {
          ...userWithoutPassword,
          plan,
          aiCreditsLimit: PLAN_CREDITS_MAP[plan] || 5,
        },
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['subscription'],
    });

    if (!user) {
      throw new BadRequestException('Utilizador não encontrado');
    }

    const { password, ...userWithoutPassword } = user;
    // Include plan from subscription for frontend compatibility
    const plan = user.subscription?.plan || 'free';
    return {
      ...userWithoutPassword,
      plan,
      aiCreditsLimit: PLAN_CREDITS_MAP[plan] || 5,
    };
  }

  /**
   * Login/Registro via Google (Firebase Auth)
   */
  async googleAuth(idToken: string) {
    if (!admin.apps.length) {
      throw new BadRequestException('Firebase n\u00e3o est\u00e1 configurado no servidor');
    }

    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      this.logger.error(`Erro ao verificar idToken do Google: ${error.message}`);
      throw new UnauthorizedException('Token do Google inv\u00e1lido ou expirado');
    }

    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      throw new BadRequestException('Email n\u00e3o encontrado no token do Google');
    }

    // Verificar se o usu\u00e1rio j\u00e1 existe
    let user = await this.usersRepository.findOne({ where: { email } });

    if (user) {
      // Usu\u00e1rio existente - atualizar avatar se necess\u00e1rio
      if (picture && !user.avatarUrl) {
        await this.usersRepository.update(user.id, { avatarUrl: picture });
        user.avatarUrl = picture;
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Conta desativada');
      }
    } else {
      // Novo usu\u00e1rio - criar conta
      const randomPassword = require('crypto').randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = this.usersRepository.create({
        name: name || email.split('@')[0],
        email,
        password: hashedPassword,
        avatarUrl: picture || null,
      });

      user = await this.usersRepository.save(user);
      this.logger.log(`Novo usu\u00e1rio criado via Google: ${email}`);
    }

    // Reload user with subscription relation
    const fullUser = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: ['subscription'],
    });

    const tokens = await this.generateTokens(fullUser || user);
    const { password: pwd, ...userWithoutPassword } = fullUser || user;

    const plan = fullUser?.subscription?.plan || 'free';
    return {
      ...tokens,
      user: {
        ...userWithoutPassword,
        plan,
        aiCreditsLimit: PLAN_CREDITS_MAP[plan] || 5,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '7d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d'),
    });

    return { accessToken, refreshToken };
  }
}
