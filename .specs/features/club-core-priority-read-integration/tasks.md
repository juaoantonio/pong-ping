# Club Core Priority Read Integration Tasks

**Design**: `.specs/features/club-core-priority-read-integration/design.md`
**Status**: Draft

## Execution Plan

### Phase 1: Backend Foundation (Sequential)

```
T1 -> T2 -> T3
```

### Phase 2: Backend Read APIs (Parallel OK After T3)

```
T3 -> T4 [P]
T3 -> T5 [P]
T3 -> T6 [P]
T3 -> T7 [P]
T4,T5,T6,T7 -> T8
```

### Phase 3: Frontend Foundation (Sequential)

```
T8 -> T9 -> T10
```

### Phase 4: Frontend Flows (Parallel OK After T10)

```
T10 -> T11 [P]
T10 -> T12 [P]
T10 -> T13 [P]
T10 -> T14 [P]
T10 -> T15 [P]
T11,T12,T13,T14,T15 -> T16
```

### Phase 5: Verification (Sequential)

```
T16 -> T17 -> T18
```

## Task Breakdown

### T1: Add Shared Read Contracts

**What**: Add pagination, rating read, dashboard summary, and any list/detail response contracts needed by core read APIs.
**Where**: `packages/contracts/src/core.ts`
**Depends on**: None
**Reuses**: Existing contract style in `packages/contracts/src/core.ts`
**Requirement**: CCR-03

**Tools**:

- MCP: `context7` only if contract syntax or package behavior is uncertain
- Skill: `coding-guidelines`

**Done when**:

- [ ] Contracts compile in `@pong-ping/contracts`
- [ ] Existing command contracts remain source-compatible
- [ ] `pnpm --filter @pong-ping/contracts build` passes

**Commit**: `feat(contracts): add core read contracts`

### T2: Define Backend Read-Side Folder and Shared Pagination DTOs

**What**: Create shared read-side pagination DTO/helpers and establish the selected folder pattern.
**Where**: `apps/api/src/modules/core/shared/presentation/http` or nearest existing shared HTTP location
**Depends on**: T1
**Reuses**: Existing DTO and Swagger response patterns
**Requirement**: CCR-02, CCR-03

**Tools**:

- MCP: `context7` for NestJS DTO/decorator questions
- Skill: `coding-guidelines`, `codenavi`

**Done when**:

- [ ] Page query DTO validates and normalizes `page`/`pageSize`
- [ ] Page response helper maps `items` and page metadata
- [ ] New folder pattern is reflected in read tasks and module imports
- [ ] API unit tests still compile

**Commit**: `feat(api): add core read pagination helpers`

### T3: Register Read Query Providers in Core Modules

**What**: Prepare module registration for read query providers/controllers without changing command providers.
**Where**: `apps/api/src/modules/core/*/*.module.ts`
**Depends on**: T2
**Reuses**: `TypeOrmModule.forFeature(...)`, `RequestContextModule`, existing provider style
**Requirement**: CCR-01, CCR-02

**Tools**:

- MCP: `context7` for NestJS provider injection questions
- Skill: `coding-guidelines`, `codenavi`

**Done when**:

- [ ] Each read provider has required TypeORM schemas registered
- [ ] Command controller behavior is unchanged
- [ ] `pnpm --filter @pong-ping/api test` reaches existing tests without DI failures

**Commit**: `feat(api): register core read providers`

### T4: Implement Table Read Endpoints [P]

**What**: Add `GET /core/tables` and `GET /core/tables/:tableId` with tenant scope, queue, and active game data.
**Where**: `apps/api/src/modules/core/table/`
**Depends on**: T3
**Reuses**: `TableSchema`, `TableMemberSchema`, `QueueEntrySchema`, `toTableResponse`
**Requirement**: CCR-01, CCR-05

**Tools**:

- MCP: `context7` for TypeORM QueryBuilder questions
- Skill: `coding-guidelines`, `codenavi`

**Done when**:

- [ ] List endpoint returns paginated current-tenant tables
- [ ] Detail endpoint rejects or hides cross-tenant IDs
- [ ] Response matches shared contracts
- [ ] Focused controller/query tests cover empty, populated, and cross-tenant cases

**Commit**: `feat(api): add core table read endpoints`

### T5: Implement Athlete Read Endpoints [P]

**What**: Add `GET /core/athletes/me` and `GET /core/athletes` with tenant scope.
**Where**: `apps/api/src/modules/core/athlete/`
**Depends on**: T3
**Reuses**: `AthleteSchema`, `CoreIdentityTranslator`, `toAthleteResponse`
**Requirement**: CCR-01, CCR-07

**Tools**:

- MCP: `context7` if NestJS decorator/DI details are uncertain
- Skill: `coding-guidelines`, `codenavi`

**Done when**:

- [ ] Current athlete resolves from current principal and tenant
- [ ] List endpoint returns paginated athletes for current tenant
- [ ] Not-found behavior is deterministic when no athlete exists
- [ ] Tests cover current athlete, empty roster, and cross-tenant exclusion

**Commit**: `feat(api): add core athlete read endpoints`

### T6: Implement Rating Read Endpoint [P]

**What**: Add `GET /core/ratings` ranking endpoint ordered by points with wins, total matches, and win rate.
**Where**: `apps/api/src/modules/core/rating/`
**Depends on**: T3
**Reuses**: `RatingSchema`, optional `AthleteSchema` join
**Requirement**: CCR-01, CCR-08

**Tools**:

- MCP: `context7` for TypeORM ordering/pagination questions
- Skill: `coding-guidelines`, `codenavi`

**Done when**:

- [ ] Endpoint returns paginated ratings for current tenant
- [ ] Default order is points descending
- [ ] Rows include athlete display name when available
- [ ] Empty ranking returns successful empty page

**Commit**: `feat(api): add core rating read endpoint`

### T7: Implement Game Read Endpoints [P]

**What**: Add `GET /core/games` and `GET /core/games/:gameRecordId`.
**Where**: `apps/api/src/modules/core/competition/`
**Depends on**: T3
**Reuses**: `GameRecordSchema`, `toGameRecordResponse`
**Requirement**: CCR-01, CCR-06

**Tools**:

- MCP: `context7` for TypeORM pagination and filtering questions
- Skill: `coding-guidelines`, `codenavi`

**Done when**:

- [ ] History endpoint returns paginated current-tenant games
- [ ] Detail endpoint filters by current tenant before returning data
- [ ] Correction/original fields are present
- [ ] Tests cover empty, populated, and cross-tenant cases

**Commit**: `feat(api): add core game read endpoints`

### T8: Implement Dashboard Summary Endpoint

**What**: Add a dedicated dashboard summary endpoint for `/club`.
**Where**: `apps/api/src/modules/core/`
**Depends on**: T4, T5, T6, T7
**Reuses**: Table, athlete, rating, and game read query providers
**Requirement**: CCR-04

**Tools**:

- MCP: None expected after prior tasks
- Skill: `coding-guidelines`, `codenavi`

**Done when**:

- [ ] Endpoint returns table summary, active athlete count, recent games, and compact ranking
- [ ] Empty club response uses zeros and empty arrays
- [ ] Query/provider tests cover empty and active club summaries
- [ ] `pnpm --filter @pong-ping/api test` passes

**Commit**: `feat(api): add club dashboard read model`

### T9: Add Frontend Core API Client

**What**: Create typed API functions for all priority core reads and existing command endpoints.
**Where**: `apps/frontend/src/lib/api/core.ts`
**Depends on**: T8
**Reuses**: `apiRequest`, shared contracts
**Requirement**: CCR-09

**Tools**:

- MCP: None expected
- Skill: `coding-guidelines`, `react-best-practices`

**Done when**:

- [ ] Read functions map to backend paths
- [ ] Command functions map to existing command paths
- [ ] Types import from `@pong-ping/contracts`
- [ ] API client tests cover representative read and command calls

**Commit**: `feat(frontend): add core api client`

### T10: Add Club Query Keys, Read Hooks, and Mutation Hooks

**What**: Add query key factory, read hooks, and mutation hooks with invalidation maps.
**Where**: `apps/frontend/src/features/club/api/`
**Depends on**: T9
**Reuses**: `@tanstack/react-query`, existing query client setup
**Requirement**: CCR-09, CCR-10

**Tools**:

- MCP: `context7` for TanStack Query v5 questions
- Skill: `react-best-practices`, `coding-guidelines`

**Done when**:

- [ ] Query keys are stable and separated by dashboard, tables, athletes, ratings, and games
- [ ] Reads use `useQuery({ queryKey, queryFn })`
- [ ] Mutations invalidate all affected keys on success
- [ ] Hook tests or component tests prove invalidation for one representative mutation

**Commit**: `feat(frontend): add club core query hooks`

### T11: Build API-Backed Club Dashboard [P]

**What**: Replace static dashboard panels with API-backed summary, previews, loading, error, and empty states.
**Where**: `apps/frontend/src/features/club/dashboard-shell-page.tsx`
**Depends on**: T10
**Reuses**: `PageShell`, UI primitives, existing dashboard tests
**Requirement**: CCR-04, CCR-11

**Tools**:

- MCP: None expected
- Skill: `frontend-design`, `react-best-practices`, `coding-guidelines`

**Done when**:

- [ ] Dashboard renders summary, table preview, recent games, and ranking preview
- [ ] Empty club state is visible and useful
- [ ] Loading/error states do not break layout
- [ ] Existing dashboard tests are updated and pass

**Commit**: `feat(frontend): connect club dashboard to core api`

### T12: Build Club Tables Flow [P]

**What**: Add table list/detail UI and connect table command mutations.
**Where**: `apps/frontend/src/features/club/tables/`, `apps/frontend/src/routes/club/tables*.tsx`
**Depends on**: T10
**Reuses**: UI table/dialog/button/select components
**Requirement**: CCR-05, CCR-10, CCR-11, CCR-12

**Tools**:

- MCP: None expected
- Skill: `frontend-design`, `react-best-practices`, `coding-guidelines`

**Done when**:

- [ ] Members can view tables, queues, and active games
- [ ] Admins can create and rename tables
- [ ] Members can enter/leave queue, form game, remove active athlete, and rotate winner-stays where allowed
- [ ] Mutations refresh table/dashboard data
- [ ] Tests cover empty, loaded, and one mutation path

**Commit**: `feat(frontend): add club table operations`

### T13: Build Club Games Flow [P]

**What**: Add game history, record confirmation, rating change display, and admin correction action.
**Where**: `apps/frontend/src/features/club/games/`, `apps/frontend/src/routes/club/games*.tsx`
**Depends on**: T10
**Reuses**: Dialog/table primitives, game contracts
**Requirement**: CCR-06, CCR-10, CCR-11, CCR-12

**Tools**:

- MCP: None expected
- Skill: `frontend-design`, `react-best-practices`, `coding-guidelines`

**Done when**:

- [ ] Game history is paginated
- [ ] Recording a result requires confirmation
- [ ] Rating changes from command response are shown
- [ ] Admin correction refreshes games/ratings/dashboard
- [ ] Tests cover confirmation and history rendering

**Commit**: `feat(frontend): add club game flow`

### T14: Build Club Athletes and Profile Flow [P]

**What**: Add current athlete profile view/edit and athletes list.
**Where**: `apps/frontend/src/features/club/athletes/`, `apps/frontend/src/features/club/profile/`, routes under `apps/frontend/src/routes/club/`
**Depends on**: T10
**Reuses**: Existing athlete profile contracts and form/UI primitives
**Requirement**: CCR-07, CCR-10, CCR-11

**Tools**:

- MCP: `context7` only if TanStack Form usage is introduced
- Skill: `frontend-design`, `react-best-practices`, `coding-guidelines`

**Done when**:

- [ ] Current profile fetches from `GET /core/athletes/me`
- [ ] Profile mutation calls existing backend command
- [ ] Athletes list shows technical/equipment fields
- [ ] Empty/null profile values render cleanly
- [ ] Tests cover profile loading and update submission

**Commit**: `feat(frontend): add club athlete profile flow`

### T15: Build Club Ranking Flow [P]

**What**: Add ranking screen backed by `GET /core/ratings`.
**Where**: `apps/frontend/src/features/club/ranking/`, `apps/frontend/src/routes/club/ranking.tsx`
**Depends on**: T10
**Reuses**: UI table/badge components
**Requirement**: CCR-08, CCR-11

**Tools**:

- MCP: None expected
- Skill: `frontend-design`, `react-best-practices`, `coding-guidelines`

**Done when**:

- [ ] Ranking lists ratings ordered by points
- [ ] Rows show wins, total matches, and win rate
- [ ] Empty state appears when no ratings exist
- [ ] Tests cover loaded and empty states

**Commit**: `feat(frontend): add club ranking`

### T16: Add Club Navigation and Role-Aware Actions

**What**: Extend club navigation beyond dashboard and ensure admin/member action availability is consistent.
**Where**: `apps/frontend/src/components/layout/club-layout.tsx`, relevant club feature components
**Depends on**: T11, T12, T13, T14, T15
**Reuses**: Existing tenant auth/session data
**Requirement**: CCR-12

**Tools**:

- MCP: None expected
- Skill: `frontend-design`, `react-best-practices`, `coding-guidelines`

**Done when**:

- [ ] Club nav includes dashboard, tables, ranking, games, athletes, profile
- [ ] Admin-only actions are gated in UI
- [ ] Backend remains source of truth for authorization
- [ ] Layout tests cover navigation links

**Commit**: `feat(frontend): add club navigation`

### T17: Run Backend and Frontend Verification

**What**: Run the priority verification commands and fix failures within scope.
**Where**: Workspace root
**Depends on**: T16
**Reuses**: Existing package scripts
**Requirement**: All

**Tools**:

- MCP: None
- Skill: `coding-guidelines`

**Done when**:

- [ ] `pnpm --filter @pong-ping/contracts build` passes
- [ ] `pnpm --filter @pong-ping/api test` passes
- [ ] `pnpm --filter @pong-ping/api build` passes
- [ ] `pnpm --filter @pong-ping/frontend test` passes
- [ ] `pnpm --filter @pong-ping/frontend build` passes
- [ ] Any skipped e2e is explicitly documented with reason

**Commit**: `test: verify club core integration`

### T18: Update Pendency and Notebook Artifacts

**What**: Mark completed priority items and document new read/query conventions.
**Where**: `PENDENCIAS_BACKEND.md`, `PENDENCIAS_FRONTEND.md`, `.notebook/`
**Depends on**: T17
**Reuses**: Existing notebook format
**Requirement**: All

**Tools**:

- MCP: None
- Skill: `tlc-spec-driven`, `codenavi`

**Done when**:

- [ ] Priority checkboxes reflect implemented state
- [ ] Notebook captures backend read-side pattern
- [ ] Notebook captures frontend core query pattern
- [ ] No unrelated pendencies are changed

**Commit**: `docs: update club core integration status`

## Parallel Execution Map

```
Backend:
  T1 -> T2 -> T3
              ├── T4 table reads
              ├── T5 athlete reads
              ├── T6 rating reads
              └── T7 game reads
                   -> T8 dashboard

Frontend:
  T8 -> T9 -> T10
               ├── T11 dashboard
               ├── T12 tables
               ├── T13 games
               ├── T14 athletes/profile
               └── T15 ranking
                    -> T16 navigation

Verification:
  T16 -> T17 -> T18
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Contract file family | Good |
| T2 | Shared backend read helper | Good |
| T3 | Module registration | Good |
| T4 | Table read endpoint group | Acceptable cohesive endpoint pair |
| T5 | Athlete read endpoint group | Acceptable cohesive endpoint pair |
| T6 | Rating read endpoint | Good |
| T7 | Game read endpoint group | Acceptable cohesive endpoint pair |
| T8 | Dashboard read model | Good |
| T9 | API client file | Good |
| T10 | Query/mutation hook layer | Good |
| T11-T15 | One frontend flow each | Good for separate worker ownership |
| T16 | Navigation/role integration | Good |
| T17 | Verification | Good |
| T18 | Documentation status update | Good |

## Recommended Subagent Allocation

| Agent | Type | Scope | Write Ownership | Skills |
| --- | --- | --- | --- | --- |
| A1 Backend Read Worker | `worker` | T1-T8 | `packages/contracts/src/core.ts`, `apps/api/src/modules/core/**/presentation/http/**`, core module registrations | `coding-guidelines`, `codenavi`, `context7-mcp` as needed |
| A2 Frontend Data Worker | `worker` | T9-T10 | `apps/frontend/src/lib/api/core.ts`, `apps/frontend/src/features/club/api/**` | `react-best-practices`, `coding-guidelines`, `context7-mcp` |
| A3 Frontend UX Worker | `worker` | T11-T16 | `apps/frontend/src/features/club/**`, `apps/frontend/src/routes/club*.tsx`, `club-layout.tsx` | `frontend-design`, `react-best-practices`, `coding-guidelines` |
| A4 Verification Explorer | `explorer` | Review T1-T17 coverage | Read-only unless asked | `codenavi`, `coding-guidelines` |

Do not run A2 before backend contracts in T1 stabilize. Do not run A3 before T10 gives stable hooks unless A3 starts with static component shells only.
