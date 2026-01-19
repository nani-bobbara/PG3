-- =================================================================================
-- 1. ENUMS & BASE TYPES
-- =================================================================================

-- Safely create enums
DO $$ BEGIN
    CREATE TYPE public.subscription_plan AS ENUM ('free', 'creator', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =================================================================================
-- 2. TABLES
-- =================================================================================

-- 2.1 Tiers (Monetization)
CREATE TABLE IF NOT EXISTS public.tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL, -- in cents
  quota integer NOT NULL, -- monthly prompt limit
  stripe_price_id text,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Profiles (Base)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.3 Subscriptions (Base + Monetization + Rate Limiting)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status TEXT DEFAULT 'active',
  
  -- Stripe & Tier Logic
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_tier text REFERENCES public.tiers(id) DEFAULT 'free',
  quota_used INTEGER DEFAULT 0,
  quota_reset_at TIMESTAMP WITH TIME ZONE,

  -- Daily Rate Limiting (Application Level)
  daily_requests_count INTEGER DEFAULT 0,
  daily_requests_limit INTEGER DEFAULT 50,
  daily_prompts_used INTEGER NOT NULL DEFAULT 0, -- legacy column
  daily_prompts_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.4 Prompts (History)
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  template_type TEXT NOT NULL,
  input_prompt TEXT NOT NULL,
  output_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.5 User API Keys (BYOK Security)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'openai', 'anthropic'
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- 2.6 Supported AI Models (Dynamic Config)
CREATE TABLE IF NOT EXISTS public.supported_ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    description TEXT,
    endpoint TEXT NOT NULL,
    env_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2.7 Supported Templates (Dynamic Config + Gating)
CREATE TABLE IF NOT EXISTS public.supported_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    structure TEXT NOT NULL,
    default_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    param_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    help_text TEXT,
    min_tier text REFERENCES public.tiers(id) DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =================================================================================
-- 3. RLS & POLICIES
-- =================================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prompts
CREATE POLICY "Users can view their own prompts" ON public.prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own prompts" ON public.prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompts" ON public.prompts FOR DELETE USING (auth.uid() = user_id);

-- API Keys
CREATE POLICY "Users manage own keys" ON public.user_api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Config & Tiers (Public Read)
CREATE POLICY "Public read models" ON public.supported_ai_models FOR SELECT USING (true);
CREATE POLICY "Public read templates" ON public.supported_templates FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tiers" ON public.tiers FOR SELECT USING (true);

-- =================================================================================
-- 4. FUNCTIONS & TRIGGERS
-- =================================================================================

-- Timestamp Update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON public.user_api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New User Handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Default to Free Tier
  INSERT INTO public.subscriptions (user_id, plan, status, current_tier, quota_used)
  VALUES (NEW.id, 'free', 'active', 'free', 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Quota Reset Utility
CREATE OR REPLACE FUNCTION public.reset_monthly_quotas()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.subscriptions
  SET quota_used = 0,
      quota_reset_at = now() + interval '1 month';
END;
$$;

-- Prompt Index
CREATE INDEX idx_prompts_user_id_created_at ON public.prompts(user_id, created_at DESC);

-- =================================================================================
-- 5. SEED DATA
-- =================================================================================

-- Seed Tiers
INSERT INTO public.tiers (id, name, price, quota, description, features) VALUES 
  ('free', 'Free', 0, 50, 'Perfect for hobbyists and experimentation.', '["50 prompts/month", "Access to basic templates", "Standard support"]'::jsonb),
  ('basic', 'Basic', 200, 200, 'For creators who need consistent quality.', '["200 prompts/month", "Access to intermediate templates", "Priority support"]'::jsonb),
  ('pro', 'Pro', 500, 600, 'For power users and professionals.', '["600 prompts/month", "Access to all templates", "BYOK Fallback", "Early access features"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, quota = EXCLUDED.quota, features = EXCLUDED.features;

-- Seed Models
INSERT INTO public.supported_ai_models (model_id, name, provider, description, endpoint, env_key) VALUES
('gemini-pro', 'Gemini Pro', 'google', 'Google''s capable reasoning model. Good balance of speed and simple visual prompting.', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', 'GEMINI_API_KEY'),
('gpt-4o', 'GPT-4o', 'openai', 'OpenAI''s flagship model. Best for complex instruction following and nuanced creative tasks.', 'https://api.openai.com/v1/chat/completions', 'OPENAI_API_KEY'),
('gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', 'Fast and cost-effective. Best for high-volume simple tasks.', 'https://api.openai.com/v1/chat/completions', 'OPENAI_API_KEY')
ON CONFLICT (model_id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Templates (Midjourney, DALL-E, Marketing, Code)
INSERT INTO public.supported_templates (category, name, description, structure, default_params, param_schema, help_text, min_tier) VALUES 
(
    'Image',
    'Midjourney v6 Photoreal',
    'Create hyper-realistic photography with precise control over style, chaos, and stylization.',
    'Subject: {{details}}\n\nCore Parameters:\n- Era: {{era}}\n- Atmosphere: {{atmosphere}}\n- Camera: {{camera}}\n\n--v 6.0 --ar {{aspect_ratio}} --stylize {{stylize}} --weird {{weird}} --chaos {{chaos}}',
    '{"era": "Modern", "atmosphere": "Cinematic", "camera": "Sony A7R IV", "aspect_ratio": "16:9", "stylize": "100", "weird": "0", "chaos": "0"}',
    '[
        {"key": "era", "type": "select", "label": "Era / Time Period", "options": [{"label": "Modern (2020s)", "value": "Modern"}, {"label": "Cyberpunk (2077)", "value": "Cyberpunk 2077"}, {"label": "1980s Retro", "value": "1980s"}, {"label": "Victorian", "value": "Victorian Era"}]},
        {"key": "atmosphere", "type": "select", "label": "Atmosphere", "options": [{"label": "Cinematic Lighting", "value": "Cinematic"}, {"label": "Dark & Moody", "value": "Dark Moody"}, {"label": "Ethereal / Dreamy", "value": "Ethereal"}, {"label": "Neon / Vibrant", "value": "Neon Vibrant"}]},
        {"key": "aspect_ratio", "type": "select", "label": "Aspect Ratio", "options": [{"label": "16:9 (Landscape)", "value": "16:9"}, {"label": "9:16 (Portrait)", "value": "9:16"}, {"label": "1:1 (Square)", "value": "1:1"}, {"label": "21:9 (Cinematic)", "value": "21:9"}]},
        {"key": "stylize", "type": "slider", "label": "Stylize (0-1000)", "min": 0, "max": 1000, "step": 50, "description": "How strictly MJ follows your prompt vs its own artistic flair."},
        {"key": "weird", "type": "slider", "label": "Weirdness (0-3000)", "min": 0, "max": 3000, "step": 100, "description": "Introduces unusual and unexpected elements."}
    ]',
    E'# Midjourney v6 Best Practices\n\n### 1. Stylize (`--s`)\n- **Low (0-100)**: Follows your prompt very strictly. Good for specific logo designs or precise layouts.\n- **Med (250)**: The default balance.\n- **High (750-1000)**: Very artistic, but might ignore some specific details of your prompt.\n\n### 2. Weird (`--w`)\n- Adds "unusual" qualities to the image.\n- Start small (0-250) to just make things unique.\n- Go high (1000+) for completely surreal and bizarre outputs.\n\n### 3. Chaos (`--c`)\n- Controls how different the 4 initial grid images are from each other.\n- **High Chaos**: You get 4 totally different concepts.\n- **Low Chaos**: You get 4 variations of the same concept.\n\n**Pro Tip**: Combine a high `--weird` with a moderate `--stylize` for unique art styles that still look coherent.',
    'pro'
),
(
    'Image',
    'DALL·E 3 Descriptive',
    'Natural language prompts optimized for DALL·E 3''s semantic understanding.',
    'Create an image of {{subject}}.\n\nContext: The scene is set in {{era}}, depicting a {{atmosphere}} vibe.\n\nStyle: {{style}}.\n\nLighting: {{lighting}} lighting coming from {{lighting_source}}.\n\nQuality: {{quality}}.',
    '{"era": "a futuristic city", "atmosphere": "bustling and vibrant", "style": "Vivid", "lighting": "Cinematic", "lighting_source": "the neon signs", "quality": "hd", "subject": "a robot serving coffee"}',
    '[{"key": "style", "type": "select", "label": "Style Mode", "options": [{"label": "Vivid (Hyper-real)", "value": "Vivid"}, {"label": "Natural (Realistic)", "value": "Natural"}]}, {"key": "quality", "type": "select", "label": "Quality", "options": [{"label": "Standard", "value": "standard"}, {"label": "HD (High Def)", "value": "hd"}]}]',
    E'# DALL·E 3 Best Practices\n\n### 1. Be Descriptive, Not Keyword-Heavy\nUnlike Midjourney, DALL·E 3 understands full sentences. Instead of "dog, blue, 4k", say "A blue dog sitting faithfully on a porch".\n\n### 2. Style: Vivid vs Natural\n- **Vivid**: Pushes contrast and saturation. Great for fantasy, sci-fi, and illustrative styles.\n- **Natural**: More grounded, realistic lighting. Better for photo-journalism or portraits.\n\n### 3. Text Handling\nDALL·E 3 is excellent at rendering text. If you want text in the image, explicitly state: "The text ''Hello World'' is written on a sign".',
    'free'
),
(
    'Utility',
    'Marketing Copy Gen',
    'Generate high-converting copy using proven frameworks (AIDA, PAS).',
    'Role: You are a world-class copywriter.\nTask: Write a {{format}} for {{platform}}.\n\nFramework: {{framework}}\n\nTopic: {{topic}}\nTarget Audience: {{audience}}\nTone: {{tone}}\n\nConstraints:\n- Use emojis: {{use_emojis}}\n- Max Length: {{length}}',
    '{"format": "Ad Caption", "platform": "LinkedIn", "framework": "AIDA (Attention, Interest, Desire, Action)", "tone": "Professional", "audience": "CTOs and Tech Leads", "use_emojis": "Sparingly", "length": "Short (under 280 chars)", "topic": "Our new AI security tool"}',
    '[{"key": "platform", "type": "select", "label": "Platform", "options": [{"label": "LinkedIn", "value": "LinkedIn"}, {"label": "Twitter / X", "value": "Twitter"}, {"label": "Instagram", "value": "Instagram"}, {"label": "Email Newsletter", "value": "Email"}]}, {"key": "framework", "type": "select", "label": "Copy Framework", "options": [{"label": "AIDA (Attention, Interest, Desire, Action)", "value": "AIDA"}, {"label": "PAS (Problem, Agitation, Solution)", "value": "PAS"}, {"label": "BAB (Before, After, Bridge)", "value": "BAB"}]}, {"key": "tone", "type": "select", "label": "Tone of Voice", "options": [{"label": "Professional & Authoritative", "value": "Professional"}, {"label": "Witty & Casual", "value": "Witty"}, {"label": "Urgent / Sales-heavy", "value": "Urgent"}]}]',
    E'# Marketing Copy Best Practices\n\n### 1. Framework Selection\n- **AIDA**: Best for general ads where you need to take someone from "unknown" to "click".\n- **PAS**: Best for solving pain points. "Does your back hurt? It''s annoying right? Here is our chair."\n- **BAB**: Best for transformations. "Life is hard. Life could be easy. Use our app."\n\n### 2. Platform Specifics\n- **LinkedIn**: Likes line breaks, professional but personal tone.\n- **Twitter**: Needs to be punchy, thread-style often works better.\n- **Instagram**: Needs to be visual-first, text is secondary context.',
    'basic'
);