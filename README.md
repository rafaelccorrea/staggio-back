# Staggio API - Backend

API do **Staggio** - SaaS de IA para Corretores de Imoveis.

## Stack

- **NestJS** (TypeScript)
- **TypeORM** (PostgreSQL / Supabase)
- **Swagger** (Documentacao da API)
- **Supabase** (Database + Storage)
- **OpenAI** (Funcionalidades de IA)
- **Stripe** (Pagamentos e Assinaturas)
- **JWT** (Autenticacao)

## Funcionalidades de IA

| Feature | Descricao | Creditos |
|---------|-----------|----------|
| Home Staging Virtual | Transforma ambientes vazios em decorados | 2 |
| Visao de Terreno | Visualiza construcoes em terrenos | 3 |
| Descricao IA | Gera textos profissionais para anuncios | 1 |
| Melhoria de Fotos | Analise e sugestoes para fotos | 1 |
| Chat IA | Assistente inteligente para corretores | 1 |

## Planos de Assinatura

| Plano | Preco | Creditos |
|-------|-------|----------|
| Free | R$ 0 | 5/mes |
| Starter | R$ 39,90/mes | 50 |
| Pro | R$ 79,90/mes | 200 |
| Imobiliaria | R$ 199,90/mes | Ilimitados |

## Setup

### Pre-requisitos

- Node.js 18+
- PostgreSQL (ou conta Supabase)
- Conta OpenAI
- Conta Stripe

### Instalacao

```bash
git clone https://github.com/rafaelccorrea/staggio-back.git
cd staggio-back
npm install
cp .env.example .env
npm run dev
```

### Variaveis de Ambiente

Consulte `.env.example` para todas as variaveis necessarias.

## Swagger / Documentacao

Apos iniciar o servidor:

```
http://localhost:3000/api/docs
```

## Endpoints

### Auth
- `POST /api/v1/auth/register` - Registar
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Renovar token
- `GET /api/v1/auth/me` - Perfil

### Properties
- `POST /api/v1/properties` - Criar imovel
- `GET /api/v1/properties` - Listar imoveis
- `GET /api/v1/properties/:id` - Detalhes
- `PATCH /api/v1/properties/:id` - Atualizar
- `DELETE /api/v1/properties/:id` - Remover

### AI
- `POST /api/v1/ai/staging` - Home Staging Virtual
- `POST /api/v1/ai/terrain-vision` - Visao de Terreno
- `POST /api/v1/ai/description` - Descricao IA
- `POST /api/v1/ai/photo-enhance` - Melhoria de Fotos
- `POST /api/v1/ai/chat` - Chat IA

### Subscriptions
- `GET /api/v1/subscriptions/plans` - Listar planos
- `GET /api/v1/subscriptions/me` - Minha assinatura

### Stripe
- `POST /api/v1/stripe/checkout` - Criar checkout
- `POST /api/v1/stripe/portal` - Portal de gestao
- `POST /api/v1/stripe/webhook` - Webhook

### Storage
- `POST /api/v1/storage/upload` - Upload ficheiro
- `POST /api/v1/storage/upload-multiple` - Upload multiplos
- `DELETE /api/v1/storage` - Remover ficheiro

## Testes

```bash
npm test
npm run test:cov
```

## Scripts

```bash
npm run dev          # Desenvolvimento
npm run build        # Build producao
npm run start:prod   # Producao
npm test             # Testes
npm run lint         # Linting
```

## Estrutura

```
src/
  common/
    filters/         # Exception filters
    interceptors/    # Response interceptors
  config/
    data-source.ts   # TypeORM data source
  modules/
    auth/            # Autenticacao (JWT)
    users/           # Utilizadores
    properties/      # Imoveis
    ai/              # IA
    generations/     # Historico geracoes
    subscriptions/   # Assinaturas
    stripe/          # Pagamentos
    storage/         # Upload ficheiros
    supabase/        # Cliente Supabase
    health/          # Health check
  app.module.ts
  main.ts
```
