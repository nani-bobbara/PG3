# PromptGen: AI Prompt Engineering Made Simple 🚀

PromptGen is a professional prompt engineering workspace that converts simple concepts into high-fidelity AI instructions for Midjourney, DALL·E 3, and Marketing workflows.

## 📁 Repository Overview
This project is a monorepo containing the Next.js application and Supabase database configuration.

- **`/prompt-gen-nextjs`**: Next.js 14 Frontend & Server Logic.
- **`/supabase`**: Database Schema, Migrations, and Dynamic Config.

## 🛠️ Features
- **Dynamic Parameters**: Every template has its own unique slider and select controls.
- **Visual Signatures**: Curated art styles (Cyberpunk, Cinematic, etc.).
- **Tiered Access**: Free ($0), Basic ($2), and Pro ($5) subscription plans.
- **BYOK Support**: Unlimited usage via personal API key fallback.
- **Searchable History**: Automatic retention of all generated prompts.

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- Supabase CLI (optional)
- Stripe CLI (for webhook testing)

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd prompt-gen

# Install dependencies (Next.js)
cd prompt-gen-nextjs
npm install
```

### 3. Environment Setup
Create a `.env.local` in `/prompt-gen-nextjs`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-wh-secret
```

### 4. Database Setup
Run the master migration file in your Supabase SQL Editor:
`supabase/migrations/20260118061718_92c8de34-7ae7-48df-9784-756c395f50aa.sql`

### 5. Running
```bash
npm run dev
```

## 📖 Documentation
- [Developer Architecture Guide](ARCHITECTURE.md)
- [User Guide](USER_GUIDE.md)

## ⚖️ License
MIT
