# Staggio API

Backend do **Staggio** - SaaS de IA para Corretores de Imóveis.

## Stack

- **NestJS** (TypeScript)
- **PostgreSQL** + TypeORM
- **OpenAI** GPT-4
- **Stripe** (Pagamentos/Assinaturas)
- **JWT** (Autenticação)

## Funcionalidades

- Autenticação (registro/login com JWT)
- Gestão de perfil e utilizadores
- CRUD de imóveis
- Geração de descrições com IA
- Home Staging Virtual (prompts de IA)
- Visão de Terrenos (renderização com IA)
- Melhoria de fotos (prompts de IA)
- Assistente de IA para corretores
- Sistema de assinaturas com Stripe
- Controle de créditos de IA por plano
- Upload de ficheiros
- Swagger API docs

## Instalação

```bash
npm install
cp .env.example .env
# Configurar variáveis de ambiente
npm run dev
```

## Planos

| Plano | Preço | Créditos IA |
|-------|-------|-------------|
| Free | R$ 0 | 5/mês |
| Starter | R$ 39,90 | 20/mês |
| Pro | R$ 79,90 | 80/mês |
| Imobiliária | R$ 199,90 | Ilimitado |

## API Docs

Acesse `http://localhost:3000/api/docs` após iniciar o servidor.
