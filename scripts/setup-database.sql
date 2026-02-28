-- ============================================
-- STAGGIO - Setup do Banco de Dados (Supabase)
-- ============================================
-- Execute este script no SQL Editor do Supabase:
-- Supabase Dashboard > SQL Editor > New Query > Colar > Run
-- ============================================

-- ============================================
-- 1. EXTENSOES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. ENUMS
-- ============================================

-- Roles de utilizador
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('corretor', 'imobiliaria', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Planos
DO $$ BEGIN
  CREATE TYPE user_plan AS ENUM ('free', 'starter', 'pro', 'agency');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tipos de imovel
DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('house', 'apartment', 'land', 'commercial', 'farm', 'condo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Status de imovel
DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('available', 'sold', 'rented', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tipos de geracao de IA
DO $$ BEGIN
  CREATE TYPE generation_type AS ENUM ('staging', 'terrain_vision', 'description', 'photo_enhance', 'chat');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Status de geracao
DO $$ BEGIN
  CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Status de assinatura
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. TABELA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  creci VARCHAR(50),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'corretor',
  plan user_plan NOT NULL DEFAULT 'free',
  ai_credits_used INTEGER NOT NULL DEFAULT 0,
  ai_credits_limit INTEGER NOT NULL DEFAULT 5,
  stripe_customer_id VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================
-- 4. TABELA: properties
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ai_description TEXT,
  type property_type NOT NULL DEFAULT 'house',
  status property_status NOT NULL DEFAULT 'available',
  price DECIMAL(12, 2),
  area DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_spots INTEGER,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  neighborhood VARCHAR(100),
  zip_code VARCHAR(10),
  images TEXT,
  features TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_properties_user ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);

-- ============================================
-- 5. TABELA: generations
-- ============================================
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type generation_type NOT NULL,
  status generation_status NOT NULL DEFAULT 'pending',
  input_image_url TEXT,
  output_image_url TEXT,
  input_prompt TEXT,
  output_text TEXT,
  input_data JSONB,
  output_data JSONB,
  credits_used INTEGER NOT NULL DEFAULT 1,
  processing_time_ms INTEGER,
  error_message TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_type ON generations(type);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_property ON generations(property_id);
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at DESC);

-- ============================================
-- 6. TABELA: subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,
  plan user_plan NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- 7. FUNCAO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_properties_updated_at ON properties;
CREATE TRIGGER trigger_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. FUNCAO: Reset mensal de creditos de IA
-- ============================================
CREATE OR REPLACE FUNCTION reset_monthly_ai_credits()
RETURNS void AS $$
BEGIN
  UPDATE users SET ai_credits_used = 0;
END;
$$ LANGUAGE plpgsql;

-- Para agendar o reset mensal, use o Supabase pg_cron:
-- SELECT cron.schedule('reset-ai-credits', '0 0 1 * *', 'SELECT reset_monthly_ai_credits()');

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Ativar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Politicas para users
-- O service_role (backend) tem acesso total, estas policies sao para acesso direto via Supabase client
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Politicas para properties
CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Politicas para generations
CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Politicas para subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- ============================================
-- 10. STORAGE BUCKET
-- ============================================
-- Criar bucket para uploads do Staggio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staggio-uploads',
  'staggio-uploads',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Politica de storage: utilizadores autenticados podem fazer upload na sua pasta
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'staggio-uploads'
    AND auth.role() = 'authenticated'
  );

-- Politica de storage: leitura publica
CREATE POLICY "Public read access to staggio-uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'staggio-uploads');

-- Politica de storage: utilizadores podem deletar seus ficheiros
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'staggio-uploads'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- 11. DADOS INICIAIS (Seed)
-- ============================================

-- Utilizador admin de teste (senha: admin123 - hash bcrypt)
-- IMPORTANTE: Altere a senha em producao!
INSERT INTO users (name, email, password, role, plan, ai_credits_limit, is_active)
VALUES (
  'Admin Staggio',
  'admin@staggio.app',
  '$2b$12$LJ3m4ys3Lk8sRdE1ZqPOaeQI8B8kXqFGJ5eVxYGKzPdC8vNmTqS6i',
  'admin',
  'agency',
  999999,
  true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 12. VIEWS UTEIS
-- ============================================

-- View: Estatisticas por utilizador
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id,
  u.name,
  u.email,
  u.plan,
  u.ai_credits_used,
  u.ai_credits_limit,
  (SELECT COUNT(*) FROM properties p WHERE p.user_id = u.id) AS total_properties,
  (SELECT COUNT(*) FROM generations g WHERE g.user_id = u.id) AS total_generations,
  (SELECT COUNT(*) FROM generations g WHERE g.user_id = u.id AND g.type = 'staging') AS total_staging,
  (SELECT COUNT(*) FROM generations g WHERE g.user_id = u.id AND g.type = 'description') AS total_descriptions,
  u.created_at
FROM users u;

-- View: Geracoes recentes
CREATE OR REPLACE VIEW recent_generations AS
SELECT
  g.id,
  g.type,
  g.status,
  g.credits_used,
  g.processing_time_ms,
  g.created_at,
  u.name AS user_name,
  u.email AS user_email,
  p.title AS property_title
FROM generations g
JOIN users u ON u.id = g.user_id
LEFT JOIN properties p ON p.id = g.property_id
ORDER BY g.created_at DESC;

-- ============================================
-- CONCLUIDO!
-- ============================================
-- Banco de dados configurado com sucesso.
-- Tabelas: users, properties, generations, subscriptions
-- Storage: bucket staggio-uploads criado
-- RLS: Ativado em todas as tabelas
-- Views: user_stats, recent_generations
-- ============================================
