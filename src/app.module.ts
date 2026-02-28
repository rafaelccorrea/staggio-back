import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

// Modules
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { AiModule } from './modules/ai/ai.module';
import { GenerationsModule } from './modules/generations/generations.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthModule } from './modules/health/health.module';

// Guards
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

// Entities
import { User } from './modules/users/entities/user.entity';
import { Property } from './modules/properties/entities/property.entity';
import { Generation } from './modules/generations/entities/generation.entity';
import { Subscription } from './modules/subscriptions/entities/subscription.entity';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM com Supabase PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'postgres'),
        entities: [User, Property, Generation, Subscription],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        logging: configService.get<string>('NODE_ENV') === 'development',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    // Supabase
    SupabaseModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    PropertiesModule,
    AiModule,
    GenerationsModule,
    SubscriptionsModule,
    StripeModule,
    StorageModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
