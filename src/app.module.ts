import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AiModule } from './modules/ai/ai.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { GenerationsModule } from './modules/generations/generations.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'staggio'),
        password: configService.get('DB_PASSWORD', 'staggio123'),
        database: configService.get('DB_DATABASE', 'staggio'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' 
          ? { rejectUnauthorized: false } 
          : false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    AiModule,
    PropertiesModule,
    GenerationsModule,
    StripeModule,
    StorageModule,
    HealthModule,
  ],
})
export class AppModule {}
