# Club Core Priority Read Integration Specification

**Status**: Draft
**Source scope**: `PENDENCIAS_BACKEND.md` > `Pendencias Prioritarias` and matching priority items in `PENDENCIAS_FRONTEND.md`
**Generated on**: 2026-05-20

## Problem Statement

The club area in `apps/frontend` is authenticated but still static because `apps/api` does not expose the core read APIs needed by the UI. Existing backend commands cover table, queue, game, athlete profile, and rating mutations, but read flows must be implemented without forcing rich domain aggregate reconstruction for display-only use cases.

## Goals

- [ ] Expose tenant-scoped core read APIs for tables, athletes, ratings, games, and club dashboard data.
- [ ] Define a pragmatic read-side folder pattern that can use NestJS, TypeORM repositories, QueryBuilder, SQL, and response DTOs directly.
- [ ] Add response contracts and pagination contracts where useful in `packages/contracts`.
- [ ] Integrate `apps/frontend` club screens with read APIs through TanStack Query and existing API client conventions.
- [ ] Wire existing backend commands into frontend mutations with targeted query invalidation.
- [ ] Deliver real club dashboard, table, game, athlete, and ranking flows with loading, error, and empty states.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Next.js legacy work in `apps/web` | `PENDENCIAS_FRONTEND.md` explicitly states new implementation must target `apps/frontend`. |
| Scoreboard persistence/API | Listed outside priority backend scope. |
| Invitations | Listed outside priority backend scope. |
| Real TypeORM migrations | Listed under persistence/operation, not priority scope. |
| E2E with Testcontainers | Currently blocked by Docker/runtime availability and not part of priority implementation. |
| Admin read API for `Club` beyond current tenant dashboard needs | Backend priority only requires dashboard support; administrative club decisions remain in non-priority core backlog. |

## User Stories

### P1: Tenant-Scoped Core Read APIs

**User Story**: As a tenant club user, I want the backend to return only my club's core data so that the UI can safely display tables, queue state, games, athletes, and ratings.

**Why P1**: All priority frontend work depends on these APIs, and tenant scope is mandatory to avoid cross-tenant leakage.

**Acceptance Criteria**:

1. WHEN an authenticated tenant member requests `GET /core/tables` THEN the API SHALL return paginated tables for the current tenant only.
2. WHEN an authenticated tenant member requests `GET /core/tables/:tableId` THEN the API SHALL return the table detail, queue, and active game only if the table belongs to the current tenant.
3. WHEN an authenticated tenant member requests `GET /core/athletes/me` THEN the API SHALL return the current athlete mapped from the current principal.
4. WHEN an authenticated tenant member requests `GET /core/athletes` THEN the API SHALL return paginated athletes for the current tenant only.
5. WHEN an authenticated tenant member requests `GET /core/ratings` THEN the API SHALL return paginated ratings ordered by points descending by default for the current tenant only.
6. WHEN an authenticated tenant member requests `GET /core/games` THEN the API SHALL return paginated game history for the current tenant only.
7. WHEN an authenticated tenant member requests `GET /core/games/:gameRecordId` THEN the API SHALL return the requested game only if it belongs to the current tenant.
8. WHEN any core read request targets data from another tenant THEN the API SHALL return the existing not-found or forbidden envelope without leaking resource existence.

**Independent Test**: Can seed or create two tenants with tables/games/athletes and verify each tenant sees only its own rows through the read endpoints.

### P1: Club Dashboard Read Model

**User Story**: As a club member, I want the dashboard to show a compact operational summary so that I can quickly understand club activity.

**Why P1**: `PENDENCIAS_BACKEND.md` and `PENDENCIAS_FRONTEND.md` both list dashboard as a priority dependency.

**Acceptance Criteria**:

1. WHEN the frontend loads `/club` THEN the system SHALL fetch a dashboard summary containing table summary, active athlete count, recent games, and compact ranking.
2. WHEN no club data exists THEN the API SHALL return empty arrays and zero counts, and the UI SHALL render an empty state.
3. WHEN dashboard data is partially empty THEN the UI SHALL render available sections without crashing or hiding the whole page.

**Independent Test**: Can open `/club` for an empty club and a club with activity and observe different dashboard states backed by API responses.

### P1: Club Tables Flow

**User Story**: As a club member or tenant admin, I want to manage table queues and active games from the frontend so that club play can be operated in real time.

**Why P1**: Table operations are the main operational flow and existing backend commands already support them.

**Acceptance Criteria**:

1. WHEN a club member opens the tables screen THEN the UI SHALL list tables with queue and active game status.
2. WHEN a tenant admin creates or renames a table THEN the UI SHALL call existing command endpoints and refresh affected table/dashboard queries.
3. WHEN a member enters or leaves a queue THEN the UI SHALL call existing queue command endpoints and refresh affected table/dashboard queries.
4. WHEN a member forms or rotates a winner-stays active game THEN the UI SHALL call existing active-game command endpoints and refresh affected table/dashboard queries.
5. WHEN an action is unavailable for role or state THEN the UI SHALL disable or hide the action consistently with backend authorization.

**Independent Test**: Can create a table as admin, enqueue members, form a game, and see query-backed table state update after each mutation.

### P1: Club Games Flow

**User Story**: As a club member or tenant admin, I want to record and review games so that outcomes and ratings stay visible.

**Why P1**: Game history and rating changes are core product value and listed in both priority files.

**Acceptance Criteria**:

1. WHEN a member records a winner for an active game THEN the UI SHALL show a confirmation before calling `POST /core/tables/:tableId/games`.
2. WHEN a game is recorded THEN the UI SHALL display returned rating changes and refresh games, ratings, tables, and dashboard queries.
3. WHEN a tenant admin corrects a game THEN the UI SHALL call `POST /core/games/:gameRecordId/corrections` and refresh games, ratings, and dashboard queries.
4. WHEN a member opens game history THEN the UI SHALL show paginated games with correction/original markers.

**Independent Test**: Can record a game from a table and verify it appears in history with rating changes visible.

### P1: Club Athletes Flow

**User Story**: As a club member, I want to view and update my athlete profile and see other club athletes so that the club roster is usable.

**Why P1**: Athlete profile and list are required by queue/game/ranking screens and listed as priority frontend work.

**Acceptance Criteria**:

1. WHEN a member opens profile THEN the UI SHALL fetch `GET /core/athletes/me`.
2. WHEN a member updates profile THEN the UI SHALL call `PATCH /core/athletes/:athleteId/profile` and refresh athlete/profile-dependent queries.
3. WHEN a member opens athletes list THEN the UI SHALL show paginated club athletes with technical/equipment fields.
4. WHEN athlete profile fields are unset THEN the UI SHALL render neutral empty values without treating them as errors.

**Independent Test**: Can edit current athlete profile and see updated values in profile and athlete list.

### P1: Club Ranking Flow

**User Story**: As a club member, I want to see ranked athletes by rating points so that competitive standing is transparent.

**Why P1**: Ranking is explicitly prioritized and depends on read-side ratings.

**Acceptance Criteria**:

1. WHEN a member opens ranking THEN the UI SHALL list paginated ratings ordered by points.
2. WHEN rating rows are rendered THEN each row SHALL include wins, total matches, and win rate.
3. WHEN no athletes have matches THEN the UI SHALL render an empty ranking state.

**Independent Test**: Can record games and verify ranking order and stats update after query invalidation.

## Edge Cases

- WHEN pagination parameters are omitted THEN the API SHALL apply default `page` and `pageSize`.
- WHEN pagination parameters are invalid THEN the API SHALL return validation errors in the existing API envelope.
- WHEN a table/game/athlete ID does not belong to the current tenant THEN the API SHALL not expose cross-tenant data.
- WHEN a mutation succeeds but refetch fails THEN the UI SHALL show the command result where available and keep a recoverable error state for stale reads.
- WHEN the current tenant has no core athlete mapped THEN profile-dependent reads SHALL return the existing domain/not-found error envelope.
- WHEN the frontend receives an unknown API envelope THEN existing `ApiParseError` behavior SHALL remain the failure path.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CCR-01 | Tenant-scoped core read APIs | Design | Pending |
| CCR-02 | Read-side folder pattern | Design | Pending |
| CCR-03 | Response and pagination contracts | Design | Pending |
| CCR-04 | Club dashboard read model | Design | Pending |
| CCR-05 | Club tables flow | Design | Pending |
| CCR-06 | Club games flow | Design | Pending |
| CCR-07 | Club athletes flow | Design | Pending |
| CCR-08 | Club ranking flow | Design | Pending |
| CCR-09 | Frontend API client and query keys | Design | Pending |
| CCR-10 | TanStack Query reads and mutation invalidation | Design | Pending |
| CCR-11 | Loading, error, and empty states | Design | Pending |
| CCR-12 | Role-aware UI actions | Design | Pending |

**Coverage**: 12 total, 12 mapped to tasks, 0 unmapped.

## Success Criteria

- [ ] Backend exposes all priority read endpoints listed in `PENDENCIAS_FRONTEND.md` dependency section.
- [ ] Every core read endpoint applies current tenant scope before returning data.
- [ ] Read-side DTOs/contracts cover list, detail, dashboard, pagination, and filters needed by frontend priority flows.
- [ ] `/club` dashboard displays API-backed summary, tables, recent games, ranking, and empty states.
- [ ] Club table, game, athlete, and ranking screens use TanStack Query reads and command mutations.
- [ ] Mutations invalidate related query keys after success.
- [ ] `pnpm --filter @pong-ping/contracts build`, `pnpm --filter @pong-ping/api test`, `pnpm --filter @pong-ping/api build`, `pnpm --filter @pong-ping/frontend test`, and `pnpm --filter @pong-ping/frontend build` pass.
