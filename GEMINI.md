# Pong Ping Workspace

## Project Overview

Pong Ping is a monorepo built using **pnpm** and **Turborepo**. It comprises multiple frontend and backend applications with shared packages.

### Applications & Packages

- **`apps/api` (Backend)**
  - Framework: **NestJS** (Node.js)
  - Database & ORM: **PostgreSQL** with **TypeORM**
  - Testing: **Vitest** and **Testcontainers**
  - Features: Passport-based authentication (Google OAuth2), Swagger API docs, winston logging.
- **`apps/frontend` (Web App)**
  - Framework: **React** (Vite)
  - Routing & State: **TanStack Router**, **TanStack Query**, and **TanStack Form**
  - Styling: **TailwindCSS** v4, Radix UI, lucide-react.
  - Testing: **Vitest**
- **`apps/web` (Web App)**
  - Framework: **Next.js**
  - Database & ORM: **Prisma** (PostgreSQL & Better SQLite3)
  - Auth: **Next-Auth** v5 (Beta)
  - Styling: **TailwindCSS** v4, Shadcn UI
  - Testing: **Jest**
- **`packages/contracts` (Shared Library)**
  - Likely holds shared types, interfaces, and utilities for cross-app consumption (`@pong-ping/contracts`).

## Building and Running

The project heavily relies on Turborepo (`turbo run <command>`) through `pnpm` scripts.

### Common Commands (Root level)
- **Install dependencies**: `pnpm install`
- **Start development server**: `pnpm dev` (Runs `turbo run dev`)
- **Build all projects**: `pnpm build`
- **Lint all projects**: `pnpm lint`
- **Run tests**: `pnpm test`
- **Prisma**: `pnpm prisma:generate` and `pnpm prisma:migrate`

### Environment and Infrastructure

- The API uses a distinct `.env` file at `apps/api/envs/.env`.
- Next.js expects its environment variables at `apps/web/.env` (see `apps/web/.env.example`).
- **Database**: PostgreSQL is provided via Docker Compose.
  - Start services via the API workspace: `pnpm --filter @pong-ping/api services:up`
- **Local Authentication Routing**: For Google login in local dev, point these local domains to `127.0.0.1`:
  - `localhost.me`
  - `teste.localhost.me` (For tenant tests)
  - `api.localhost.me` (For the API host `http://api.localhost.me:3001/v1`)

## Development Conventions
- **Code Style**: Prettier and ESLint are standard across the monorepo (`eslint.config.mjs`).
- **Testing**: A mix of `vitest` (API and frontend apps) and `jest` (Next.js app).
- **TypeScript**: Strict TypeScript checks across apps (`tsc -b`).
- **Monorepo Linking**: Internal packages use the `workspace:*` prefix.
