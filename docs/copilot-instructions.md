# Copilot Instructions for PromptGen

## Project Overview
PromptGen is a Next.js 14 SaaS for AI prompt engineering, integrating Supabase (PostgreSQL, Auth), Stripe billing, and dynamic prompt templates ("Blueprints"). The codebase is split between the Next.js app (`src/`) and Supabase config/migrations (`supabase/`).

## Architecture & Data Flow
- **Frontend**: React 18, Tailwind CSS, shadcn/ui. UI is modular, with dashboard and landing components in `src/components/`.
- **Backend/API**: Next.js Server Actions (see `src/app/actions/`), Supabase Edge Functions, and API routes.
- **Database**: All schema/migrations in `supabase/migrations/`. Core tables: `profiles`, `subscriptions`, `tiers`, `supported_templates`, `supported_ai_models`, `user_api_keys`, `prompts`.
- **Auth**: Supabase Auth (email/password). RLS restricts data access to user-owned rows.
- **Payments**: Stripe integration via `src/app/actions/stripe.ts` and webhooks in `src/app/api/webhooks/stripe/route.ts`.
- **AI Providers**: Google Gemini and OpenAI, with BYOK fallback logic.

## Key Patterns & Conventions
- **Dynamic Blueprints**: Prompt templates and their parameters are defined in the DB (`supported_templates`). UI auto-renders controls based on schema.
- **Single Source of Truth**: Pricing/plans in `src/config/plans.ts`. All config in `src/config/`.
- **Server Actions**: All business logic (prompt generation, billing, key management) is in `src/app/actions/`.
- **Component Structure**: Dashboard and landing page components are separated in `src/components/dashboard/` and `src/components/landing/`.
- **Supabase Functions**: Custom logic (e.g., Stripe portal, checkout) in `supabase/functions/`.

## Developer Workflows
- **Run locally**: `npm run dev` (from project root)
- **DB migration**: Apply `supabase/migrations/20260118061718_92c8de34-7ae7-48df-9784-756c395f50aa.sql` in Supabase SQL Editor.
- **Add a template/model**: Insert a row in `supported_templates`/`supported_ai_models` via Supabase dashboard.
- **Update pricing**: Edit `src/config/plans.ts`.
- **Stripe webhooks**: Use Stripe CLI for local webhook testing.

## Integration Points
- **AI Service Logic**: See `src/lib/ai-service.ts` for provider abstraction and prompt dispatch.
- **Supabase Client**: `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (server).
- **API Keys**: User keys stored encrypted in `user_api_keys` (BYOK logic in `generate-prompt.ts`).

## Notable Conventions
- **All prompt templates and models are DB-driven**—no hardcoded prompt logic in the frontend.
- **RLS enforced**: Never bypass Supabase RLS for user data.
- **Config-first**: All business logic (plans, templates, models) is config/database driven for rapid iteration.

## References
- [ARCHITECTURE.md](ARCHITECTURE.md) — full technical breakdown
- [README.md](README.md) — setup and usage
- [../src/app/actions/generate-prompt.ts](../src/app/actions/generate-prompt.ts) — main prompt generation logic
- [../src/config/plans.ts](../src/config/plans.ts) — pricing/tier config
- [../supabase/migrations/20260118061718_92c8de34-7ae7-48df-9784-756c395f50aa.sql](../supabase/migrations/20260118061718_92c8de34-7ae7-48df-9784-756c395f50aa.sql) — DB schema

---
*For AI agents: Adhere to config/database-driven patterns, reference config files for business logic, and never hardcode prompt templates or pricing.*
