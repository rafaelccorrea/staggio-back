import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Pipes de validacao
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtros e interceptors globais
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Staggio API')
    .setDescription(
      `## API do Staggio - SaaS de IA para Corretores de Imoveis

### Funcionalidades:
- **Home Staging Virtual** - Transforma ambientes vazios em decorados
- **Visao de Terreno** - Visualiza construcoes em terrenos
- **Descricao IA** - Gera textos profissionais para anuncios
- **Melhoria de Fotos** - Analise e sugestoes para fotos
- **Chat IA** - Assistente inteligente para corretores

### Autenticacao:
Utilize o token JWT no header Authorization: Bearer {token}

### Creditos:
Cada funcionalidade consome creditos conforme o plano de assinatura.`,
    )
    .setVersion('1.0.0')
    .setContact('Staggio', 'https://staggio.app', 'contato@staggio.app')
    .addBearerAuth()
    .addTag('health', 'Verificacao de saude da API')
    .addTag('auth', 'Autenticacao e registo')
    .addTag('users', 'Gestao de utilizadores')
    .addTag('properties', 'Gestao de imoveis')
    .addTag('ai', 'Funcionalidades de IA')
    .addTag('generations', 'Historico de geracoes de IA')
    .addTag('subscriptions', 'Planos de assinatura')
    .addTag('stripe', 'Pagamentos via Stripe')
    .addTag('storage', 'Upload de ficheiros')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Staggio API - Documentacao',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Staggio API rodando em http://localhost:${port}`);
  logger.log(`Swagger docs em http://localhost:${port}/api/docs`);
}

bootstrap();
