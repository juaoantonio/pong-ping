# Core API Status

As of 2026-05-20, `apps/api/src/modules/core` is a NestJS modular core organized by capability first, then by layer.

- `CoreModule` imports and exports `ClubModule`, `AthleteModule`, `TableModule`, `RatingModule`, and `CompetitionModule`, and provides `CoreIdentityEventsListener`.
- Core read side now exposes tenant-scoped club APIs:
  - `GET /core/dashboard`
  - `GET /core/tables`
  - `GET /core/tables/:tableId`
  - `GET /core/athletes/me`
  - `GET /core/athletes`
  - `GET /core/ratings`
  - `GET /core/games`
  - `GET /core/games/:gameRecordId`
- Read query providers live near HTTP delivery under `presentation/http/queries`, intentionally using TypeORM repositories and response contracts directly for display-oriented reads.
- Identity events synchronize core clubs and athletes: tenant create/update maps to club create/rename/slug/activation changes, and tenant authentication auto-registers an athlete.
- HTTP command controllers exist for athletes, tables, and competitions. HTTP read controllers exist for athletes, tables, ratings, competitions, and dashboard. Club has DTOs/serializers/use cases/repository but no controller registered. Invitation and scoreboard are domain-only.
- Competition records games, updates ratings, and saves game records through a transaction helper on `GameRecordRepository`.
- Core repositories currently use direct TypeORM repositories, not `TenantScopedRepository`; command flows mostly pass tenant/club context into creation and rely on IDs/domain checks for later operations.
- Unit tests pass after building `packages/contracts` first because `@pong-ping/contracts` exports `dist/index.js`.
- API build passes. E2E health tests require a working Docker/Testcontainers runtime and could not run in the current environment.
- No TypeORM migrations are committed yet beyond `.gitkeep`; runtime TypeORM can rely on `DB_SYNCHRONIZE`, while `data-source.ts` is prepared for generated migrations.

References:

- `apps/api/src/modules/core/core.module.ts`
- `apps/api/src/modules/core/application/identity/core-identity-events.listener.ts`
- `apps/api/src/modules/core/table/table-command.controller.ts`
- `apps/api/src/modules/core/table/table-read.controller.ts`
- `apps/api/src/modules/core/athlete/athlete-read.controller.ts`
- `apps/api/src/modules/core/rating/rating-read.controller.ts`
- `apps/api/src/modules/core/competition/competition-read.controller.ts`
- `apps/api/src/modules/core/core-dashboard-read.controller.ts`
- `apps/api/src/modules/core/competition/competition-command.controller.ts`
- `apps/api/src/modules/core/competition/application/use-cases/record-game.use-case.ts`
- `apps/api/src/common/database/database.module.ts`
- `apps/api/data-source.ts`
