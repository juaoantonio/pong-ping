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

For local frontend development, keep the Vite dev origin in `CORS_ORIGIN`:
`["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]`.
The Vite frontend should use `VITE_API_BASE_URL=http://localhost:3001/v1` so
system auth requests reach the configured `ROOT_DOMAIN=localhost` root host.
After Google completes system auth, the API redirects the browser to
`SYSTEM_ADMIN_FRONTEND_URL`, which defaults locally to
`http://localhost:5173/admin/tenants`.

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
- `pnpm system-admin:create -- --email admin@example.com` creates or updates a system admin user.
- `pnpm migration:generate` and `pnpm migration:run` use `data-source.ts`.

Create the first system admin from the repository root:

```bash
pnpm --filter @pong-ping/api system-admin:create
```

Or pass values non-interactively:

```bash
pnpm --filter @pong-ping/api system-admin:create -- --email admin@example.com --display-name "Admin"
```

The command assigns the `system_admin` role. If `--google-subject` is omitted, the pending user is linked automatically on first Google login with the same email.

## Included

This starter includes configuration validation, PostgreSQL with TypeORM, health checks, Winston console logging, request IDs, response envelopes, standardized error handling, validation, pagination helpers, Vitest, Supertest, and Testcontainers.

It intentionally does not include auth, users, Redis, queues, storage, email, CSRF, Loki/Grafana, MinIO, MailCatcher, or domain modules.
