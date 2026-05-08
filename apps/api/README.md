# @pong-ping/api

Pong Ping backend API service.

## Development

From the repository root:

```bash
pnpm install
pnpm --filter @pong-ping/api services:up
pnpm --filter @pong-ping/api dev
```

The API listens on `http://127.0.0.1:3001/v1`.

The backend uses the root PostgreSQL service and a separate database named
`pong_ping_api`. Start the service through the API workspace so Docker Compose
receives the API env values and the configured database is created
idempotently:

```bash
pnpm --filter @pong-ping/api services:up
```

## Scripts

- `pnpm build` compiles the NestJS app.
- `pnpm dev` starts the NestJS watcher.
- `pnpm lint` runs Biome checks.
- `pnpm test` runs unit tests.
- `pnpm test:e2e` runs Supertest/Testcontainers checks.
- `pnpm services:up` starts PostgreSQL, waits for it, and creates the configured database if needed.
- `pnpm migration:generate` and `pnpm migration:run` use `data-source.ts`.

## Included

This starter includes configuration validation, PostgreSQL with TypeORM, health checks, Winston console logging, request IDs, response envelopes, standardized error handling, validation, pagination helpers, Vitest, Supertest, and Testcontainers.

It intentionally does not include auth, users, Redis, queues, storage, email, CSRF, Loki/Grafana, MinIO, MailCatcher, or domain modules.
