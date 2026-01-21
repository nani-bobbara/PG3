# PromptGen: AI Prompt Engineering Made Simple 🚀

PromptGen is a professional prompt engineering workspace that converts simple concepts into high-fidelity AI instructions for Midjourney, DALL·E 3, and Marketing workflows.

## 📁 Repository Overview
This repository contains the full-stack PromptGen application, integrated with Supabase and Stripe.

- **`/src`**: Next.js 14 Frontend, Server Actions, and API Routes.
- **`/supabase`**: Database Schema, Migrations, and Configuration.
- **`/public`**: Static assets and public resources.
- **`/docs`**: Comprehensive architecture and deployment guides.

## 🛠️ Features
- **Dynamic Parameters**: Every template has its own unique slider and select controls.
- **Visual Signatures**: Curated art styles (Cyberpunk, Cinematic, etc.).
- **Tiered Access**: Free ($0), Basic ($2), and Pro ($5) subscription plans.
- **BYOK Support**: Unlimited usage via personal API key fallback.
- **Searchable History**: Automatic retention of all generated prompts.

## 🚀 Getting Started

> **⚠️ Important**: For detailed setup, environment variables, and Stripe configuration, please refer to the **[Deployment Guide](docs/DEPLOYMENT.md)**.

### Quick Start
1.  **Clone & Install**:
    ```bash
    git clone <repo-url>
    cd promptify
    npm install
    ```
2.  **Setup Environment**: See [Deployment Guide](docs/DEPLOYMENT.md) for `.env.local` template.
3.  **Run Locally**:
    ```bash
    npm run dev
    ```

## 📖 Documentation
- [Deployment & Configuration](docs/DEPLOYMENT.md) — **Single Source of Truth** for setup.
- [Architecture Guide](docs/ARCHITECTURE.md) — Technical details (RLS, Flows).
- [User Guide](docs/USER_GUIDE.md) — End-user manual.

## ⚖️ License
MIT
