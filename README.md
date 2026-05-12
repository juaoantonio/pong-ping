# Pong Ping

This repository is a pnpm/Turborepo monorepo. The Next.js app lives in
`apps/web`; the initial NestJS API app lives in `apps/api`.

## Getting Started

Install dependencies from the repo root:

```bash
pnpm install
```

Run the development server from the repo root:

```bash
pnpm dev
```

For tenant Google login in local development, point fake local domains to
`127.0.0.1` so the frontend and API share the `.localhost.me` cookie domain:

```text
127.0.0.1 localhost.me
127.0.0.1 teste.localhost.me
127.0.0.1 api.localhost.me
```

Open `http://teste.localhost.me:5173/club/login` for a tenant named `teste`.
The central OAuth/API host is `http://api.localhost.me:3001/v1`, and the
Google Console redirect URI should match:

```text
http://api.localhost.me:3001/v1/auth/google/callback
```

Direct service URLs remain available for debugging: the Vite app listens on
`http://localhost:5173`, and the API listens on `http://127.0.0.1:3001/v1`.

## Common Commands

Run these from the repo root:

```bash
pnpm build
pnpm lint
pnpm test
pnpm prisma:generate
pnpm prisma:migrate
```

App-local environment files should live in `apps/web/.env`, or variables can
be passed by the shell when running the app workspace. See
`apps/web/.env.example` for the expected variables.

The API uses `apps/api/envs/.env` and a separate PostgreSQL database named
`pong_ping_api` in the root Docker Compose Postgres service. Start the service
through the API workspace so Docker Compose receives the API env values and the
configured database is created idempotently:

```bash
pnpm --filter @pong-ping/api services:up
```

## Deploy on Vercel

The existing Vercel project link remains at the repository root. Configure the
Vercel project root directory as `apps/web` so Vercel builds the Next.js app
workspace.
