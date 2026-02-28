import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { RegisterDto, LoginDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    // Create free subscription
    const subscription = this.subscriptionsRepository.create({
      userId: savedUser.id,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      aiCreditsLimit: 5,
      aiCreditsUsed: 0,
    });
    await this.subscriptionsRepository.save(subscription);

    const token = this.generateToken(savedUser);

    return {
      accessToken: token,
      user: this.formatUser(savedUser, subscription),
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

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: this.formatUser(user, user.subscription),
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['subscription'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilizador não encontrado ou inativo');
    }

    return user;
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private formatUser(user: User, subscription?: Subscription) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      creci: user.creci,
      avatarUrl: user.avatarUrl,
      plan: subscription?.plan || 'free',
      aiCreditsUsed: subscription?.aiCreditsUsed || 0,
      aiCreditsLimit: subscription?.aiCreditsLimit || 5,
    };
  }
}
