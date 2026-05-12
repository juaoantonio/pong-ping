# Core Command Contracts and Controllers Tasks

**Design**: `.specs/features/core-command-contracts-controllers/design.md`  
**Status**: Draft

---

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| contracts | `pnpm --filter @pong-ping/contracts build` | Required after contract changes. |
| unit | `pnpm --filter @pong-ping/api test` | Use for DTO, serializer, use-case, controller, and filter tests. |
| build | `pnpm --filter @pong-ping/api build` | Required after Nest module/controller wiring. |

No `.specs/codebase/TESTING.md` exists, so test assignments follow existing API package scripts and controller/use-case spec placement conventions.

---

## Execution Plan

### Phase 1: Contract Foundation

```text
T1 -> T2
```

### Phase 2: Application Use Cases

```text
T2 -> T3 -> T4
```

### Phase 3: HTTP Surface By Capability

```text
T4 -> T5 -> T6 -> T7 -> T8
```

### Phase 4: Error Mapping And Final Verification

```text
T8 -> T9 -> T10
```

---

## Task Breakdown

### T1: Add Core Contract Types

**What**: Create framework-neutral core command request/response contracts and export them from `@pong-ping/contracts`.
**Where**: `packages/contracts/src/core.ts`, `packages/contracts/src/index.ts`
**Depends on**: None
**Reuses**: Existing `ISODateString` and identity contract export style.
**Requirement**: CORE-HTTP-01

**Tools**:

- MCP: none.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] Contract constants/unions exist for play mode and athlete profile literals.
- [ ] Request contracts exist for persisted club, athlete, table, and competition commands.
- [ ] Response contracts expose only JSON-safe primitive values and arrays.
- [ ] Contracts are exported from `@pong-ping/contracts`.
- [ ] Gate check passes: `pnpm --filter @pong-ping/contracts build`.

**Tests**: build
**Gate**: contracts
**Commit**: `feat(contracts): add core command contracts`

---

### T2: Add Core DTOs And Serializers

**What**: Add Nest DTO classes implementing core contracts and serializer functions that map domain objects to contract responses.
**Where**: `apps/api/src/modules/core/**/dtos/`, `apps/api/src/modules/core/**/serializers/`
**Depends on**: T1
**Reuses**: Identity DTO patterns and existing domain aggregate getters.
**Requirement**: CORE-HTTP-01, CORE-HTTP-02

**Tools**:

- MCP: Context7 for `class-validator` or Swagger only if decorator behavior is unclear.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] DTO classes implement the matching contract interfaces.
- [ ] DTOs validate required strings, optional profile fields, enum literals, arrays, and booleans as applicable.
- [ ] Serializers convert club, athlete, table, active-game, queue, game-record, and rating-delta values into contract payloads.
- [ ] Serializer tests cover representative domain objects and ISO date formatting.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add core command dto serializers`

---

### T3: Add Missing Club Use Cases

**What**: Add application use cases for persisted club domain methods not currently exposed by the application layer.
**Where**: `apps/api/src/modules/core/club/application/use-cases/`, `apps/api/src/modules/core/club/club.module.ts`
**Depends on**: T2
**Reuses**: `ClubRepository`, `ClubSlugUniquenessService`, `RenameClubUseCase` not-found style.
**Requirement**: CORE-HTTP-03

**Tools**:

- MCP: none.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] `ChangeClubSlugUseCase` loads by id, enforces slug uniqueness, changes slug, and saves.
- [ ] `ActivateClubUseCase` loads by id, activates, and saves.
- [ ] `DeactivateClubUseCase` loads by id, deactivates, and saves.
- [ ] Use-case barrel and `ClubModule` exports/providers include the new use cases.
- [ ] Unit tests cover success, persistence, not found, and duplicate slug conflict.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add club command use cases`

---

### T4: Add Missing Table Use Cases

**What**: Add application use cases for table creation, rename, and active-player removal.
**Where**: `apps/api/src/modules/core/table/application/use-cases/`, `apps/api/src/modules/core/table/table.module.ts`
**Depends on**: T3
**Reuses**: `TableRepository`, `findTableOrThrow`, existing table use-case/provider style.
**Requirement**: CORE-HTTP-03

**Tools**:

- MCP: none.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] `CreateTableUseCase` creates a table with id, current club id, name, play mode, creator athlete id, and creation date.
- [ ] `RenameTableUseCase` loads by id, renames, and saves.
- [ ] `RemoveFromActiveGameUseCase` loads by id, removes the active athlete, and saves.
- [ ] Use-case barrel and `TableModule` exports/providers include the new use cases.
- [ ] Unit tests cover success, persistence, and not-found/domain-rule failures.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add table command use cases`

---

### T5: Add Club Command Controller

**What**: Expose persisted club commands through a tenant-scoped controller.
**Where**: `apps/api/src/modules/core/club/club-command.controller.ts`, `apps/api/src/modules/core/club/club.module.ts`
**Depends on**: T4
**Reuses**: Existing identity controller style, `CurrentContextService`, club DTOs/serializers.
**Requirement**: CORE-HTTP-02, CORE-HTTP-03

**Tools**:

- MCP: Context7 for Nest controller metadata only if API usage is unclear.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] Controller exposes create, rename current club, change slug, activate, and deactivate routes.
- [ ] Current tenant id is used as the club id for current-club commands.
- [ ] Admin tenant role is required.
- [ ] Controller unit tests verify delegation and serialized responses.
- [ ] `ClubModule` registers the controller.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add club command controller`

---

### T6: Add Athlete Command Controller

**What**: Expose athlete registration and profile update commands.
**Where**: `apps/api/src/modules/core/athlete/athlete-command.controller.ts`, `apps/api/src/modules/core/athlete/athlete.module.ts`
**Depends on**: T5
**Reuses**: `RegisterAthleteUseCase`, `UpdateAthleteProfileUseCase`, `CoreIdentityTranslator`, athlete DTOs/serializers.
**Requirement**: CORE-HTTP-02

**Tools**:

- MCP: none.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] Register route uses current tenant id as `clubId`.
- [ ] Register route uses current principal user id as the core actor id.
- [ ] Profile update route delegates to `UpdateAthleteProfileUseCase`.
- [ ] Member or admin tenant role is required.
- [ ] Controller unit tests verify context mapping, delegation, and serialized responses.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add athlete command controller`

---

### T7: Add Table Command Controller

**What**: Expose table creation, rename, queue, active-game, and winner-stays commands.
**Where**: `apps/api/src/modules/core/table/table-command.controller.ts`, `apps/api/src/modules/core/table/table.module.ts`
**Depends on**: T6
**Reuses**: Existing table use cases, new table use cases, table DTOs/serializers, tenant/principal context.
**Requirement**: CORE-HTTP-02, CORE-HTTP-03

**Tools**:

- MCP: none.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] Controller exposes create, rename, enqueue, remove queued athlete, remove active athlete, form active game, and rotate winner-stays routes.
- [ ] Create table uses current tenant id and actor athlete id from request context.
- [ ] Admin role is required for create/rename; member or admin role is required for gameplay commands.
- [ ] Controller unit tests verify delegation, role metadata where practical, and serialized responses.
- [ ] `TableModule` registers the controller.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add table command controller`

---

### T8: Add Competition Command Controller

**What**: Expose game recording and game correction commands.
**Where**: `apps/api/src/modules/core/competition/competition-command.controller.ts`, `apps/api/src/modules/core/competition/competition.module.ts`
**Depends on**: T7
**Reuses**: `RecordGameUseCase`, `CorrectGameUseCase`, competition DTOs/serializers, `CoreIdentityTranslator`.
**Requirement**: CORE-HTTP-02

**Tools**:

- MCP: none.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] Record game route uses route `tableId`, body winning athlete ids, and current actor id.
- [ ] Correct game route uses route `gameRecordId` and current actor id.
- [ ] Member or admin role is required for record game; admin role is required for correction.
- [ ] Controller unit tests verify delegation and serialized game record responses.
- [ ] `CompetitionModule` registers the controller.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add competition command controller`

---

### T9: Map Domain Rule Violations In Global Filter

**What**: Normalize `DomainRuleViolation` into the existing API error envelope.
**Where**: `apps/api/src/common/shared/filters/global-exception.filter.ts`
**Depends on**: T8
**Reuses**: Existing envelope construction and app error codes.
**Requirement**: CORE-HTTP-04

**Tools**:

- MCP: none.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] Domain not-found codes map to 404.
- [ ] Conflict-like domain codes map to 409.
- [ ] Other domain codes map to 400.
- [ ] Existing HttpException and Postgres mapping behavior remains unchanged.
- [ ] Filter unit tests cover all new mapping categories.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): map core domain errors`

---

### T10: Run Final Build Verification

**What**: Run package and API build gates after all wiring is complete.
**Where**: repo root
**Depends on**: T9
**Reuses**: Existing package scripts.
**Requirement**: CORE-HTTP-01, CORE-HTTP-02, CORE-HTTP-03, CORE-HTTP-04

**Tools**:

- MCP: none.
- Skill: `tlc-spec-driven`.

**Done when**:

- [ ] `pnpm --filter @pong-ping/contracts build` passes.
- [ ] `pnpm --filter @pong-ping/api test` passes.
- [ ] `pnpm --filter @pong-ping/api build` passes.
- [ ] OpenAPI decorators compile for all new controllers.

**Tests**: build
**Gate**: build
**Commit**: `test(api): verify core command controllers`

---

## Parallel Execution Map

This plan is intentionally sequential because each phase builds on shared contracts, then use cases, then module wiring. Parallel controller work is possible after T4, but the same DTO/serializer files and role/context patterns are shared enough that sequential execution is lower risk.

```text
T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7 -> T8 -> T9 -> T10
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | One contracts module plus export | OK |
| T2 | DTOs and serializers across capabilities | Broad but cohesive foundation for all controllers |
| T3 | Club use-case group | OK: one capability, same repository |
| T4 | Table use-case group | OK: one capability, same repository |
| T5 | One controller/module capability | OK |
| T6 | One controller/module capability | OK |
| T7 | One controller/module capability | OK |
| T8 | One controller/module capability | OK |
| T9 | One filter behavior | OK |
| T10 | Verification only | OK |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | Match |
| T2 | T1 | T1 | Match |
| T3 | T2 | T2 | Match |
| T4 | T3 | T3 | Match |
| T5 | T4 | T4 | Match |
| T6 | T5 | T5 | Match |
| T7 | T6 | T6 | Match |
| T8 | T7 | T7 | Match |
| T9 | T8 | T8 | Match |
| T10 | T9 | T9 | Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Contracts package types | build | build | OK |
| T2 | API DTOs and serializers | unit | unit | OK |
| T3 | Application use cases | unit | unit | OK |
| T4 | Application use cases | unit | unit | OK |
| T5 | Controller and module wiring | unit | unit | OK |
| T6 | Controller and module wiring | unit | unit | OK |
| T7 | Controller and module wiring | unit | unit | OK |
| T8 | Controller and module wiring | unit | unit | OK |
| T9 | Global exception filter | unit | unit | OK |
| T10 | Build verification | build | build | OK |

