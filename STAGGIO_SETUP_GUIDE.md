# Staggio - Guia Completo de Configuração

Este documento contém todas as configurações necessárias para colocar o Staggio em produção. Siga cada seção com atenção.

---

## 📋 Índice

1. [Firebase - Google Sign-In](#firebase---google-sign-in)
2. [Stripe - Pagamentos](#stripe---pagamentos)
3. [HeyGen - Geração de Vídeos](#heygen---geração-de-vídeos)
4. [Database - Migrações](#database---migrações)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Verificação Final](#verificação-final)

---

## 🔥 Firebase - Google Sign-In

### O que é?
Firebase permite que usuários façam login com suas contas Google. O app já tem a integração pronta, falta apenas configurar o projeto no Firebase Console.

### Passo 1: Criar Projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Criar Projeto"**
3. Nome do projeto: `Staggio` (ou seu nome preferido)
4. Desabilite Google Analytics (opcional)
5. Clique em **"Criar"**

### Passo 2: Ativar Google Sign-In

1. No Firebase Console, vá para **Authentication**
2. Clique em **"Começar"**
3. Selecione **"Google"**
4. Ative o toggle
5. Defina um email de suporte
6. Clique em **"Salvar"**

### Passo 3: Baixar Credenciais

#### Para Android:

1. No Firebase Console, vá para **Project Settings** (ícone de engrenagem)
2. Clique na aba **"Suas apps"**
3. Clique em **"Android"**
4. Preencha:
   - Package name: `com.staggio.app`
   - SHA-1 certificate fingerprint: (veja como gerar abaixo)
5. Clique em **"Registrar app"**
6. Baixe `google-services.json`
7. Coloque o arquivo em: `android/app/google-services.json`

**Como gerar SHA-1:**
```bash
cd /home/ubuntu/staggio-app/android
./gradlew signingReport
```
Procure pela linha `SHA1:` e copie o valor.

#### Para iOS:

1. No Firebase Console, vá para **Project Settings**
2. Clique em **"iOS"**
3. Preencha:
   - Bundle ID: `com.staggio.app`
4. Clique em **"Registrar app"**
5. Baixe `GoogleService-Info.plist`
6. Coloque o arquivo em: `ios/Runner/GoogleService-Info.plist`

### Passo 4: Obter Credenciais do Backend

1. No Firebase Console, vá para **Project Settings**
2. Clique em **"Service Accounts"**
3. Clique em **"Generate New Private Key"**
4. Um arquivo JSON será baixado
5. Abra o arquivo e copie:
   - `project_id`
   - `client_email`
   - `private_key` (copie tudo, incluindo `\n`)

### Passo 5: Atualizar `.env` do Backend

```env
FIREBASE_PROJECT_ID=seu_project_id_aqui
FIREBASE_CLIENT_EMAIL=seu_client_email_aqui
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Importante:** A `FIREBASE_PRIVATE_KEY` deve estar entre aspas duplas com `\n` para quebras de linha.

---

## 💳 Stripe - Pagamentos

### O que é?
Stripe processa pagamentos de assinaturas e compra de créditos. O app já tem a integração pronta.

### Passo 1: Criar Conta Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crie uma conta ou faça login
3. Vá para **Developers > API Keys**
4. Copie:
   - **Secret Key** (começa com `sk_test_` ou `sk_live_`)
   - **Publishable Key** (começa com `pk_test_` ou `pk_live_`)

### Passo 2: Criar Produtos e Preços

#### Plano Starter (R$ 39,90 / mês - 30 gerações)

1. Vá para **Products**
2. Clique em **"Add product"**
3. Nome: `Starter`
4. Descrição: `30 gerações de IA por mês`
5. Clique em **"Add pricing"**
6. Tipo: `Recurring`
7. Preço: `39.90`
8. Moeda: `BRL`
9. Período: `Monthly`
10. Clique em **"Save product"**
11. Copie o **Price ID** (começa com `price_`)

#### Plano Pro (R$ 99,90 / mês - 100 gerações)

Repita o processo acima com:
- Nome: `Pro`
- Descrição: `100 gerações de IA por mês + Visão de Terreno + Melhorar Fotos + Chat IA`
- Preço: `99.90`

#### Plano Agency (R$ 299,90 / mês - Ilimitado)

Repita o processo acima com:
- Nome: `Agency`
- Descrição: `Gerações ilimitadas + Vídeos + Dashboard + API + Marca própria`
- Preço: `299.90`

### Passo 3: Criar Produtos de Créditos

#### Pacote 10 Créditos (R$ 14,90)

1. Vá para **Products**
2. Clique em **"Add product"**
3. Nome: `Créditos - 10`
4. Descrição: `10 créditos para usar quando quiser`
5. Clique em **"Add pricing"**
6. Tipo: `One-time`
7. Preço: `14.90`
8. Moeda: `BRL`
9. Clique em **"Save product"**
10. Copie o **Price ID**

#### Pacote 30 Créditos (R$ 34,90 - 22% off)

Repita com:
- Nome: `Créditos - 30`
- Preço: `34.90`

#### Pacote 80 Créditos (R$ 69,90 - 41% off)

Repita com:
- Nome: `Créditos - 80`
- Preço: `69.90`

#### Pacote 200 Créditos (R$ 149,90 - 50% off)

Repita com:
- Nome: `Créditos - 200`
- Preço: `149.90`

#### Pacote 500 Créditos (R$ 299,90 - 60% off)

Repita com:
- Nome: `Créditos - 500`
- Preço: `299.90`

### Passo 4: Configurar Webhook

1. Vá para **Developers > Webhooks**
2. Clique em **"Add endpoint"**
3. URL: `https://seu-backend.com/webhook/stripe`
4. Eventos: Selecione `checkout.session.completed`
5. Clique em **"Add endpoint"**
6. Copie o **Signing Secret** (começa com `whsec_`)

### Passo 5: Atualizar `.env` do Backend

```env
STRIPE_SECRET_KEY=sk_test_seu_secret_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
STRIPE_STARTER_PRICE_ID=price_starter_aqui
STRIPE_PRO_PRICE_ID=price_pro_aqui
STRIPE_AGENCY_PRICE_ID=price_agency_aqui
```

---

## 🎬 HeyGen - Geração de Vídeos

### O que é?
HeyGen gera vídeos de apresentação de imóveis usando IA. O app já tem a integração pronta.

### Passo 1: Criar Conta HeyGen

1. Acesse [HeyGen](https://www.heygen.com/)
2. Crie uma conta
3. Vá para **Settings > API**
4. Copie a **API Key**

### Passo 2: Atualizar `.env` do Backend

```env
HEYGEN_API_KEY=seu_api_key_aqui
```

### Passo 3: Gerar Vídeos de Exemplo

Quando a API key estiver configurada, execute:

```bash
cd /home/ubuntu/staggio-app
python3 /home/ubuntu/generate_heygen_videos.py
```

Isso gerará 3 vídeos de exemplo que aparecerão no showcase da home.

---

## 🗄️ Database - Migrações

### O que é?
As migrações adicionam novas colunas ao banco de dados. Uma migração para `bonus_credits` já foi criada.

### Passo 1: Rodar Migração

```bash
cd /home/ubuntu/staggio-back
npm run migration:run
```

Isso adicionará a coluna `bonus_credits` na tabela `users`.

### Verificar se funcionou:

```bash
npm run migration:show
```

Você deve ver a migração `AddBonusCreditsToUsers` com status `Success`.

---

## 🔐 Variáveis de Ambiente

### Backend `.env` Completo

```env
# ===== SERVER =====
PORT=3000
NODE_ENV=production

# ===== DATABASE =====
DB_HOST=db.myuxrheibbdeqzngcsye.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=nextinnotech2023
DB_DATABASE=postgres
DB_SSL=true

# ===== JWT =====
JWT_SECRET=sT4gg10_Jw7S3cR3t_K3y_2026_xQ9mPvL8nR2dF5hB7wYz
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# ===== OPENAI =====
OPENAI_API_KEY=sk-proj-seu_api_key_aqui

# ===== STRIPE =====
STRIPE_SECRET_KEY=sk_test_seu_secret_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
STRIPE_STARTER_PRICE_ID=price_starter_aqui
STRIPE_PRO_PRICE_ID=price_pro_aqui
STRIPE_AGENCY_PRICE_ID=price_agency_aqui

# ===== FIREBASE =====
FIREBASE_PROJECT_ID=seu_project_id_aqui
FIREBASE_CLIENT_EMAIL=seu_client_email_aqui
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ===== HEYGEN =====
HEYGEN_API_KEY=seu_api_key_aqui

# ===== SUPABASE =====
SUPABASE_URL=https://myuxrheibbdeqzngcsye.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_STORAGE_BUCKET=staggio-uploads

# ===== APP =====
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080
```

### Flutter `.env` (se necessário)

O Flutter app não precisa de `.env` pois usa as variáveis do backend.

---

## ✅ Verificação Final

### Checklist de Configuração

- [ ] Firebase Console criado e Google Sign-In ativado
- [ ] `google-services.json` colocado em `android/app/`
- [ ] `GoogleService-Info.plist` colocado em `ios/Runner/`
- [ ] Firebase credenciais adicionadas ao `.env` do backend
- [ ] Stripe conta criada e produtos configurados
- [ ] Stripe Price IDs adicionados ao `.env` do backend
- [ ] Stripe Webhook configurado
- [ ] HeyGen API key adicionada ao `.env` do backend
- [ ] Migration `bonus_credits` rodada com sucesso
- [ ] Backend testado com `npm run start`
- [ ] Flutter app testado com `flutter run`

### Testes Recomendados

#### 1. Testar Login com Google

1. Abra o app
2. Clique em "Entrar com Google"
3. Selecione uma conta Google
4. Verifique se o login funciona

#### 2. Testar Compra de Créditos

1. Faça login
2. Vá para "Comprar Créditos"
3. Selecione um pacote
4. Clique em "Comprar"
5. Verifique se o Stripe checkout abre

#### 3. Testar Geração de Vídeo

1. Faça login com plano Pro ou Agency
2. Vá para "Home"
3. Clique em um vídeo de exemplo
4. Verifique se o vídeo toca em loop

#### 4. Testar Dark Mode

1. Vá para "Configurações"
2. Ative "Modo Escuro"
3. Verifique se todas as telas ficam escuras

---

## 🆘 Troubleshooting

### Firebase Login não funciona

**Problema:** Erro ao fazer login com Google

**Solução:**
1. Verifique se `google-services.json` está em `android/app/`
2. Verifique se `GoogleService-Info.plist` está em `ios/Runner/`
3. Verifique se Firebase credenciais estão corretas no `.env`
4. Limpe o cache: `flutter clean && flutter pub get`

### Stripe Webhook não recebe eventos

**Problema:** Pagamentos não são processados

**Solução:**
1. Verifique se o webhook URL está correto
2. Verifique se `STRIPE_WEBHOOK_SECRET` está correto
3. Verifique os logs do Stripe Dashboard > Developers > Webhooks

### HeyGen não gera vídeos

**Problema:** Erro ao gerar vídeos

**Solução:**
1. Verifique se `HEYGEN_API_KEY` está correto
2. Verifique se a conta HeyGen tem créditos
3. Verifique os logs: `python3 /home/ubuntu/generate_heygen_videos.py`

### Dark Mode não funciona

**Problema:** Telas ficam pretas ao ativar dark mode

**Solução:**
1. Limpe o cache: `flutter clean`
2. Reconstrua: `flutter pub get && flutter run`
3. Verifique se todas as cores usam `Theme.of(context)`

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do backend: `npm run start`
2. Verifique os logs do app: `flutter run -v`
3. Consulte a documentação oficial:
   - [Firebase](https://firebase.google.com/docs)
   - [Stripe](https://stripe.com/docs)
   - [HeyGen](https://docs.heygen.com/)

---

## 📝 Notas Importantes

- **Nunca** commite o `.env` com credenciais reais
- Use `sk_test_` para testes e `sk_live_` para produção no Stripe
- Mantenha as API keys seguras
- Teste tudo em staging antes de ir para produção
- Monitore os logs regularmente

---

**Última atualização:** 01/03/2026

**Status:** Pronto para Produção ✅
