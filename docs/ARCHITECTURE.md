# PromptGen Architecture & Implementation Guide

## 1. Overview
PromptGen is a high-performance AI Prompt Engineering SaaS platform. It enables users to architect optimized prompts using dynamic blueprints (templates) and visual style signatures, with support for major AI providers (Google Gemini, OpenAI).

### Key Features
- **Dynamic Blueprints**: Database-driven prompt templates with custom parameters.
- **Visual Signatures**: Curated aesthetic styles applied to generations.
- **Monetization**: Tiered subscription model ($0, $2, $5) via Stripe.
- **BYOK (Bring Your Own Key)**: Fallback logic allowing users to use their own API keys once system quotas are reached.

---

## 2. Technical Architecture

PromptGen follows a modern Serverless architecture using **Next.js 14 (App Router)** and **Supabase**.

### 2.1 Technology Stack
- **Frontend**: React 18, Tailwind CSS, shadcn/ui.
- **Backend/API**: Next.js Server Actions, Edge Functions (Supabase).
- **Database**: PostgreSQL (Supabase) with Row Level Security (RLS).
- **Authentication**: Supabase Auth (Email/Password).
- **Payments**: Stripe Billing + Webhooks.
- **AI Integration**: Google Generative AI (Gemini), OpenAI.

### 2.2 Repository Structure
```text
prompt-gen/
├── prompt-gen-nextjs/      # Next.js Application
│   ├── src/
│   │   ├── app/            # App Router & Server Actions
│   │   ├── components/     # UI Components (Dashboard, Landing, Settings)
│   │   ├── hooks/          # React Query hooks for dynamic config
│   │   ├── lib/            # Shared utilities (Stripe, Supabase clients)
│   │   └── types/          # TypeScript definitions
└── supabase/
    └── migrations/         # Consolidated SQL Master Schema
```

---

## 3. Database Layer (Supabase)

The core logic is stored in a **single consolidated migration file** (`20260118061718_92c8de34-7ae7-48df-9784-756c395f50aa.sql`).

### Core Tables
| Table | Description |
|-------|-------------|
| `profiles` | User profile data. |
| `subscriptions` | Tracks plan tier, usage quotas, and Stripe IDs. |
| `tiers` | Definition of plans: Free ($0), Basic ($2), Pro ($5). |
| `supported_templates`| Dynamic prompt structures and parameter schemas. |
| `supported_ai_models`| Registered models (Gemini Pro, GPT-4o, etc). |
| `user_api_keys` | Encrypted user keys for BYOK fallback. |
| `prompts` | User prompt generation history. |

### RLS (Row Level Security)
- Users can only read/write their own profiles, subscriptions, and prompts.
- Metadata tables (`tiers`, `templates`, `models`) are globally readable but only writeable by the system.

---

## 4. Application Logic

### 4.1 Prompt Generation Flow
1. **User Request**: User selects a **Blueprint** and **Style** on the Dashboard.
2. **Dynamic Params**: The UI renders inputs based on the Blueprint's `param_schema`.
3. **Server Action**: `generatePrompt` is called.
   - Fetches User Tier from DB.
   - Checks Monthly Quota.
   - If quota exists: Uses **System API Key**.
   - If quota exceeded: Checks for **User BYOK Key**.
   - Interpolates user inputs into the structure.
   - Calls Provider (Gemini/OpenAI).
   - Saves to History.

### 4.2 Monetization & Billing
- **Stripe Checkout**: Handled by Server Actions in `src/app/actions/stripe.ts`.
- **Webhooks**: `api/webhooks/stripe` handles subscription lifecycle events (upgrades/downgrades).
- **Consolidated Config**: `src/config/plans.ts` serves as the single source of truth for pricing.

---

## 5. Deployment Guide

### 5.1 Prerequisites
1. **Supabase Project**: Create a new project.
2. **Stripe Account**: Create products and prices for Basic ($2) and Pro ($5).

### 5.2 Step-by-Step Deployment
1. **Database Setup**:
   - Copy the content of `supabase/migrations/92c8de34-7ae7-48df-9784-756c395f50aa.sql` into the Supabase SQL Editor and run it.
2. **Environment Variables**:
   Add the following to Vercel/Local `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   GOOGLE_GENERATIVE_AI_API_KEY=...
   OPENAI_API_KEY=...
   STRIPE_SECRET_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   NEXT_PUBLIC_APP_URL=...
   ```
3. **Deploy to Vercel**:
   - Connect your repo.
   - Use `npm run build`.
   - Ensure the `NEXT_PUBLIC_*` variables are set.

---

## 6. Developer Workflows
- **Adding a Template**: Insert a new row into `supported_templates` via Supabase Dashboard. The UI will automatically render it.
- **Adding a Model**: Insert a new row into `supported_ai_models`.
- **Modifying UI**: Components use Tailwind CSS and are located in `src/components`.

---
*Created for the PromptGen Engineering Team.*
