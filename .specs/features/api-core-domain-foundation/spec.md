# API Core Domain Foundation Specification

## Problem Statement

`apps/api` is currently a NestJS starter with infrastructure modules but no physical sports domain model. The canonical domain language already exists in `CONTEXT.md`, while executable rules still live mostly in the legacy Next.js/Prisma app. This feature defines the core domain foundation that will let the API implement the Pong Ping model with rich entities, value objects, and domain services before adding persistence or HTTP behavior.

## Goals

- [ ] Create a rich, persistence-unaware core domain model in `apps/api/src/modules/core/domain`.
- [ ] Encode the canonical language from `CONTEXT.md` in module names, class names, and method names.
- [ ] Protect core invariants inside entities/value objects instead of use cases/controllers.
- [ ] Keep generic identity/auth behavior minimal and outside sports-domain concepts.
- [ ] Add unit-testable domain behavior for table play, competition records, ratings, invitations, and scoreboard separation.

## Out of Scope

| Feature | Reason |
| --- | --- |
| NestJS controllers and DTOs | This feature is core domain only. |
| Application use cases with `Repository<Entity>` | Orchestration and persistence are deferred. |
| TypeORM `EntitySchema` files | Persistence mapping is deferred despite being the later intended ORM style. |
| Database migrations | No schema changes are generated in this step. |
| Auth provider/session implementation | Authentication is a generic subdomain and can stay framework-oriented later. |
| Porting public API contracts | `packages/api-contracts` and legacy route compatibility are not part of this feature. |
| Web UI changes | This is API/domain preparation only. |

---

## User Stories

### P1: Canonical Domain Modules

**User Story**: As a maintainer, I want each core context physically separated in the API so that domain concepts are discoverable and do not collapse into generic services.

**Why P1**: The API has no sports-domain structure yet, and the migration must enforce the language from `CONTEXT.md` from the first implementation.

**Acceptance Criteria**:

1. WHEN core sports-domain files are added THEN they SHALL live under `apps/api/src/modules/core/domain/<context>`.
2. WHEN a sports-domain class refers to a person who plays THEN it SHALL use `Athlete`, not `User` or `Player`.
3. WHEN a sports-domain class refers to data ownership THEN it SHALL use `Club`, not `Tenant`.
4. WHEN a class models persistence identity THEN it SHALL expose immutable identity through domain constructors/factories.
5. WHEN domain code is inspected THEN it SHALL not import `@nestjs/*`, `typeorm`, or TypeORM decorators.

**Independent Test**: Static inspection and TypeScript compile prove the module tree exists and domain files are framework-free.

---

### P1: Table Play Rules

**User Story**: As a maintainer, I want table membership, queue, active game formation, and winner-stays rotation modeled in the domain so that table rules are not spread through future use cases.

**Why P1**: Table play is the main interactive domain and owns several invariants listed in `CONTEXT.md`.

**Acceptance Criteria**:

1. WHEN an athlete enters a table queue THEN the `Table` aggregate SHALL prevent duplicate active queue entries.
2. WHEN an athlete enters the queue without membership THEN the domain SHALL represent that table membership must be created.
3. WHEN `PlayMode` is singles THEN `ActiveGame` SHALL be formed from the first two `QueueEntry` items.
4. WHEN `PlayMode` is doubles THEN `ActiveGame` SHALL be formed from the first four `QueueEntry` items with two athletes per `GameSide`.
5. WHEN winner-stays rotation runs THEN the winning `GameSide` SHALL stay first and the losing side SHALL move to the end while preserving relative side order.
6. WHEN a current player tries to leave the normal queue while a game can be played THEN the domain SHALL reject the operation.

**Independent Test**: Unit tests instantiate a `Table`, enqueue athletes, form active games in singles/doubles, rotate winners, and assert failure cases without a database.

---

### P1: Competition Records and Corrections

**User Story**: As a maintainer, I want game results and corrections modeled as domain concepts so that recorded history is immutable and correction behavior is explicit.

**Why P1**: `Registro de Jogo` and `Correção de Jogo` are core historical concepts and must not be treated as generic rows.

**Acceptance Criteria**:

1. WHEN a `GameRecord` is created THEN it SHALL store `Club`, `Table`, winning side, losing side, actor, rating deltas, and finish time.
2. WHEN a result is recorded THEN winner/loser SHALL be represented by `GameSide`, not direct single-athlete winner/loser fields only.
3. WHEN a game is corrected THEN the original `GameRecord` SHALL not be deleted or mutated into a rollback.
4. WHEN a correction is created THEN it SHALL be compensatory and reference the original `GameRecord`.
5. WHEN a second correction is requested for the same `GameRecord` THEN the domain SHALL reject it.

**Independent Test**: Unit tests create a record, create one correction, verify compensating deltas, and verify a second correction is rejected.

---

### P1: Ratings and Club Ladder

**User Story**: As a maintainer, I want rating and ranking rules modeled in the domain so that Elo and ladder ordering remain club-scoped and testable.

**Why P1**: Rankings are core to Pong Ping and must not leak across clubs.

**Acceptance Criteria**:

1. WHEN a rating is created without history THEN it SHALL start from the default domain points.
2. WHEN a win/loss is recorded THEN `Rating` SHALL update points, wins, total matches, and win rate consistently.
3. WHEN Elo is calculated THEN the current K factor and default points behavior SHALL be preserved from the legacy implementation.
4. WHEN a `ClubLadder` is built THEN it SHALL order only athletes from the same `Club`.
5. WHEN a `Tier` is resolved THEN it SHALL be derived from rating thresholds, not manually assigned to an athlete.

**Independent Test**: Unit tests verify Elo calculation, win rate, rating mutation, club-scoped ordering, and tier resolution.

---

### P2: Invitations and Scoreboard Separation

**User Story**: As a maintainer, I want invitations and scoreboard state modeled separately from game records so that generic access rules and live scoring do not distort competition history.

**Why P2**: These contexts matter, but their persistence and framework integration can be added after the core sports model.

**Acceptance Criteria**:

1. WHEN a `ClubInvite` or `TableInvite` is checked THEN expiration and one-time-use rules SHALL be evaluated by domain behavior.
2. WHEN a one-time invite is claimed THEN a second claim SHALL be rejected.
3. WHEN a reusable invite is claimed THEN reuse SHALL be allowed until expiration.
4. WHEN `Scoreboard` points change THEN no `GameRecord` SHALL be created by scoreboard behavior.
5. WHEN `Scoreboard` is reset THEN it SHALL reset live points only, not historical ratings or records.

**Independent Test**: Unit tests cover invite availability/claim behavior and scoreboard point/reset behavior without persistence.

---

## Edge Cases

- WHEN a value object receives blank or malformed input THEN it SHALL throw a domain validation error.
- WHEN IDs from different clubs are combined inside a core sports operation THEN the operation SHALL reject the cross-club state.
- WHEN a table has too few queue entries for the configured `PlayMode` THEN `ActiveGame` creation SHALL fail.
- WHEN doubles mode receives duplicate athletes across sides THEN the domain SHALL reject it.
- WHEN rating values would become inconsistent with wins/total matches THEN `Rating` SHALL reject or normalize through a single domain method.
- WHEN a correction targets a correction record THEN the domain SHALL reject it.
- WHEN an invitation expires exactly at `now` THEN it SHALL be unavailable.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| CDF-01 | P1: Canonical Domain Modules | Verified |
| CDF-02 | P1: Table Play Rules | Verified |
| CDF-03 | P1: Competition Records and Corrections | Verified |
| CDF-04 | P1: Ratings and Club Ladder | Verified |
| CDF-05 | P2: Invitations and Scoreboard Separation | Verified |

Coverage: 5 total, 5 mapped to tasks, 5 verified, 0 unmapped.

## Success Criteria

- [x] `apps/api/src/modules/core/domain` contains core domain contexts with rich entities, VOs, and domain services.
- [x] Domain files compile without importing NestJS or TypeORM.
- [x] Unit tests cover all P1 invariants and the P2 invitation/scoreboard separation.
- [x] `pnpm --filter @pong-ping/api test` passes.
- [x] `pnpm --filter @pong-ping/api build` passes.
