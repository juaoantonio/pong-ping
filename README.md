# Pong Ping

This repository is a pnpm/Turborepo monorepo. The Next.js app lives in
`apps/web`.

## Getting Started

Install dependencies from the repo root:

```bash
pnpm install
```

Run the development server from the repo root:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see
the app.

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

## Deploy on Vercel

The existing Vercel project link remains at the repository root. Configure the
Vercel project root directory as `apps/web` so Vercel builds the Next.js app
workspace.
