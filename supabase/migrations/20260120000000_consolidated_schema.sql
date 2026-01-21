-- =================================================================================
-- 1. CLEANUP (MIGRATION CONSOLIDATION)
-- =================================================================================

-- Drop old tables if they exist to force clean slate for renamed schema
-- WARNING: This is a consolidation migration intended to reshape the schema.
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.tiers CASCADE;
-- We are keeping prompts, user_api_keys, supported_ai_models but need to ensure they match new schema or are recreated if strictly needed.
-- For `prompts`, `user_api_keys`, etc, if they exist from previous migrations, we might need to alter them or drop/recreate to ensure FKs point to new `user_profiles`.
-- Given the significant schema rename, it is safer to drop/recreate to ensure integrity with new `user_profiles` keys.
DROP TABLE IF EXISTS public.user_api_keys CASCADE;
DROP TABLE IF EXISTS public.prompts CASCADE;
DROP TABLE IF EXISTS public.user_prompts CASCADE;
-- Config tables can be dropped and re-seeded
DROP TABLE IF EXISTS public.supported_templates CASCADE;
DROP TABLE IF EXISTS public.supported_ai_models CASCADE;

-- Drop new tables if they happen to exist (idempotency)
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_tiers CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- =================================================================================
-- 2. EXTENSIONS & SETUP
-- =================================================================================

-- Enable PGCrypto for secure encryption of user API keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_cron for automated maintenance (retention policies)
CREATE EXTENSION IF NOT EXISTS "pg_cron";

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =================================================================================
-- 3. TABLES (RENAMED & NORMALIZED)
-- =================================================================================

-- 3.1 User Profiles (Base Identity)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3.2 Subscription Tiers
CREATE TABLE public.subscription_tiers (
  id TEXT PRIMARY KEY, 
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_in_cents INTEGER,
  yearly_price_in_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  monthly_quota INTEGER NOT NULL, 
  features JSONB DEFAULT '[]'::jsonb,
  stripe_product_id TEXT,
  stripe_monthly_price_id TEXT,
  stripe_yearly_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3.3 User Subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier_id TEXT REFERENCES public.subscription_tiers(id) NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  monthly_usage_count INTEGER DEFAULT 0,
  monthly_quota_limit INTEGER DEFAULT 50,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3.4 User Prompts (Renamed from prompts)
CREATE TABLE public.user_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  template_type TEXT NOT NULL,
  input_prompt TEXT NOT NULL,
  context_data JSONB DEFAULT '{}'::jsonb, -- Multimodal inputs (images, files, etc)
  output_text TEXT NOT NULL,
  output_structured JSONB DEFAULT '{}'::jsonb, -- JSON-LD or structured response
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3.5 User API Keys
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, 
  encrypted_key TEXT NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- 3.6 Supported AI Models
CREATE TABLE public.supported_ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    description TEXT,
    endpoint TEXT NOT NULL,
    env_key TEXT NOT NULL, 
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3.7 Supported Templates
CREATE TABLE public.supported_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    structure TEXT NOT NULL,
    default_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    param_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    help_text TEXT,
    min_tier_id TEXT REFERENCES public.subscription_tiers(id) DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =================================================================================
-- 4. RLS & SECURITY Policies
-- =================================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users view own prompts" ON public.user_prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own prompts" ON public.user_prompts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own keys" ON public.user_api_keys FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read models" ON public.supported_ai_models FOR SELECT USING (is_active = true);
CREATE POLICY "Public read templates" ON public.supported_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Public read tiers" ON public.subscription_tiers FOR SELECT USING (is_active = true);

-- =================================================================================
-- 5. FUNCTIONS & AUTOMATION
-- =================================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_subs_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tiers_updated_at BEFORE UPDATE ON public.subscription_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_tier public.subscription_tiers%ROWTYPE;
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  SELECT * INTO default_tier FROM public.subscription_tiers WHERE is_default = true LIMIT 1;
  IF NOT FOUND THEN
    SELECT * INTO default_tier FROM public.subscription_tiers WHERE id = 'free' LIMIT 1;
  END IF;

  INSERT INTO public.user_subscriptions (user_id, tier_id, monthly_quota_limit)
  VALUES (NEW.id, default_tier.id, default_tier.monthly_quota);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop valid trigger if exists to avoid error on recreation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================================
-- 6. SEED DATA
-- =================================================================================

INSERT INTO public.subscription_tiers (id, name, description, monthly_price_in_cents, yearly_price_in_cents, monthly_quota, retention_days, is_default, features, stripe_product_id, stripe_monthly_price_id, stripe_yearly_price_id) VALUES
('free', 'Free', 'Perfect for hobbyists.', 0, 0, 50, 30, true, '["50 prompts/month", "30-day history"]'::jsonb, NULL, NULL, NULL),
('basic', 'Basic', 'For consistent creators.', 2000, 0, 200, 60, false, '["200 prompts/month", "60-day history"]'::jsonb, 'prod_TpECeLNea3s1D3', 'price_1SrZkZDf8eZbtpDlrhlgqfDx', NULL),
('pro', 'Pro', 'For power users.', 5000, 0, 600, 90, false, '["600 prompts/month", "90-day history"]'::jsonb, 'prod_TpEGwSM4LTIWIc', 'price_1SrZniDf8eZbtpDlHBvamE79', NULL)
ON CONFLICT (id) DO UPDATE SET
    stripe_product_id = EXCLUDED.stripe_product_id,
    stripe_monthly_price_id = EXCLUDED.stripe_monthly_price_id;

INSERT INTO public.supported_ai_models (model_id, name, provider, description, endpoint, env_key, is_default) VALUES
(
    'gemini-3-flash-preview', 
    'Gemini 3 Flash (Preview)', 
    'gemini', 
    'Google''s latest flagship fast model.', 
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent', 
    'GEMINI_API_KEY',
    true
),
(
    'gpt-4o', 
    'GPT-4o', 
    'openai', 
    'OpenAI Flagship.', 
    'https://api.openai.com/v1/chat/completions', 
    'OPENAI_API_KEY',
    false
)
ON CONFLICT (model_id) DO UPDATE SET 
    endpoint = EXCLUDED.endpoint,
    is_default = EXCLUDED.is_default;

INSERT INTO public.supported_templates (category, name, description, structure, min_tier_id) VALUES
('Image', 'Midjourney v6', 'Photorealistic creation', 'Subject: {{details}} --v 6.0', 'free')
ON CONFLICT DO NOTHING;

-- =================================================================================
-- 7. REALTIME & CRON OPTIMIZATION (MERGED)
-- =================================================================================

CREATE OR REPLACE FUNCTION public.purge_expired_prompts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.user_prompts p
  USING public.user_subscriptions s, public.subscription_tiers t
  WHERE p.user_id = s.user_id
    AND s.tier_id = t.id
    AND p.created_at < (now() - (t.retention_days || ' days')::interval);
END;
$$;

-- Schedule the cleanup job (Every day at 3:00 AM)
SELECT cron.schedule(
  'purge-expired-prompts', -- name of the cron job
  '0 3 * * *',             -- every day at 3 am
  'SELECT public.purge_expired_prompts()'
);

-- Enable Realtime for specific tables (allows frontend to subscribe to changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_prompts;
