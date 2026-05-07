# API Core Domain Foundation Tasks

**Design**: `.specs/features/api-core-domain-foundation/design.md`
**Status**: Verified

---

## Execution Plan

### Phase 1: Shared Foundation

```text
T1 -> T2
```

### Phase 2: Independent Domain Contexts

```text
T2 -> T3
T2 -> T4
T2 -> T5
T2 -> T6
T2 -> T7
```

### Phase 3: Cross-Context Domain Rules

```text
T5 + T6 -> T8
T3 + T5 -> T9
T5 -> T10
```

### Phase 4: Verification

```text
T3 + T4 + T5 + T6 + T7 + T8 + T9 + T10 -> T11
```

---

## Task Breakdown

### T1: Create Shared Domain Kernel

**What**: Add shared domain primitives for entities, aggregate roots, domain events, domain errors, and the base `DomainId` value object.
**Where**: `apps/api/src/modules/core/domain/shared/`
**Depends on**: None
**Requirement**: CDF-01

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] `Entity<TId>` supports identity equality.
- [x] `AggregateRoot<TId>` stores and exposes pending domain events.
- [x] `DomainRuleViolation` carries a stable code.
- [x] Base `DomainId` validates non-empty string IDs; concrete IDs live in their owning modules.
- [x] Unit tests cover equality, event pulling, and invalid IDs.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add shared domain kernel`

---

### T2: Create Clubs Domain

**What**: Model `Club` as the sports data ownership boundary with name/slug value objects and same-club guard behavior.
**Where**: `apps/api/src/modules/core/domain/clubs/`
**Depends on**: T1
**Requirement**: CDF-01

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] `Club` exposes creation, rename, slug change, activate/deactivate, and same-club guard methods.
- [x] `ClubName` and `ClubSlug` normalize/validate input.
- [x] No class uses `Tenant` terminology.
- [x] Unit tests cover valid creation, invalid names/slugs, and cross-club guard failure.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add clubs domain`

---

### T3: Create Identity and Athletes Domain

**What**: Add minimal generic `User` identity model and sports-focused `Athlete` model with profile value objects.
**Where**: `apps/api/src/modules/identity/domain/`, `apps/api/src/modules/core/domain/athletes/`
**Depends on**: T2
**Requirement**: CDF-01

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] `User` contains only identity/auth concepts: ID, email, role, active state.
- [x] `Email` normalizes and validates addresses.
- [x] `Athlete` references `UserId` but owns sports display/profile behavior.
- [x] Athlete profile VOs cover technical level, grip style, playing style, and equipment text.
- [x] Unit tests prove sports-domain code uses `Athlete` terminology and does not treat `User` as a player.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add identity and athletes domain`

---

### T4: Create Table Value Objects and Game Side Model

**What**: Add table-specific value objects and side/play-mode model needed before implementing `Table`.
**Where**: `apps/api/src/modules/core/domain/tables/value-objects/`
**Depends on**: T2, T3
**Requirement**: CDF-02

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] `TableName`, `PlayMode`, `QueuePosition`, `GameSide`, and `ActiveGame` are implemented.
- [x] Singles sides accept exactly one athlete.
- [x] Doubles sides accept exactly two distinct athletes.
- [x] Active games reject duplicate athletes across both sides.
- [x] Unit tests cover singles, doubles, duplicate athlete rejection, and invalid positions.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add table game value objects`

---

### T5: Create Table Aggregate and Queue Rules

**What**: Implement `Table`, `TableMember`, `TableQueue`, and `QueueEntry` with membership, enqueue, removal, active-game formation, and winner-stays rotation.
**Where**: `apps/api/src/modules/core/domain/tables/`
**Depends on**: T4
**Requirement**: CDF-02

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] `Table.enqueue` prevents duplicate queue entries.
- [x] Enqueue can indicate that persistent membership must be created later.
- [x] `Table.formActiveGame` supports singles and doubles.
- [x] `Table.rotateWinnerStays` preserves winning side and moves losing side to the end.
- [x] Current players cannot leave the normal queue while a playable active game exists.
- [x] Unit tests cover all acceptance criteria in CDF-02.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add table aggregate rules`

---

### T6: Create Ratings Domain

**What**: Implement rating state, Elo calculation, rating deltas, tier resolution, and club ladder ordering.
**Where**: `apps/api/src/modules/core/domain/ratings/`
**Depends on**: T3
**Requirement**: CDF-04

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] Default rating points are `1000`.
- [x] Elo K factor is `64`.
- [x] `Rating.recordWinAgainst` updates both winner and loser through domain methods.
- [x] Win rate follows the existing rounded percentage behavior.
- [x] `ClubLadder` rejects mixed-club ratings and orders by points, wins, then athlete identity.
- [x] `Tier` resolves from thresholds.
- [x] Unit tests cover Elo, win rate, correction delta, ladder scope, and tier resolution.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add ratings domain`

---

### T7: Create Invitations Domain

**What**: Model `ClubInvite`, `TableInvite`, token/expiration value objects, and claim availability policy.
**Where**: `apps/api/src/modules/core/domain/invitations/`
**Depends on**: T2, T3, T4
**Requirement**: CDF-05

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] Invite tokens validate non-empty safe token values.
- [x] Expiring at or before `now` is unavailable.
- [x] One-time invites reject a second claim.
- [x] Reusable invites allow repeated claims until expiration.
- [x] Table invites reference `TableId`; club invites reference `ClubId`.
- [x] Unit tests cover expired, used, reusable, and successful claim scenarios.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add invitations domain`

---

### T8: Create Competition Records and Corrections

**What**: Implement `GameRecord`, `GameCorrection`, result value objects, and compensating correction behavior.
**Where**: `apps/api/src/modules/core/domain/competition/`
**Depends on**: T5, T6
**Requirement**: CDF-03

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] `GameRecord.record` stores winning and losing `GameSide` values.
- [x] Rating changes are represented per side.
- [x] `GameCorrection.createCompensating` reverses original rating deltas.
- [x] `GameRecord.correct` allows at most one correction.
- [x] Corrections cannot target corrections.
- [x] Unit tests cover record creation, side-based results, compensating deltas, and duplicate correction rejection.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add competition record domain`

---

### T9: Create Scoreboards Domain

**What**: Implement live scoreboard state and point operations separate from game records and ratings.
**Where**: `apps/api/src/modules/core/domain/scoreboards/`
**Depends on**: T5
**Requirement**: CDF-05

**Tools**:

- Skill: `tactical-ddd`, `coding-guidelines`
- MCP: none required

**Done when**:

- [x] `Scoreboard` references club, table, and active game identity/state only.
- [x] Point increment, undo, and reset behavior are implemented.
- [x] Score points cannot become negative.
- [x] Scoreboard code imports nothing from `competition` or `ratings`.
- [x] Unit tests prove point/reset behavior does not create or mutate `GameRecord`.

**Gate**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add scoreboards domain`

---

### T10: Add Domain Barrel Exports and Static Import Guard

**What**: Add context-level exports and a test/static check that domain files do not import framework or persistence packages.
**Where**: `apps/api/src/modules/core/domain/*/index.ts`, `apps/api/src/modules/identity/domain/index.ts`, `apps/api/test` or `apps/api/src/**/*.spec.ts`
**Depends on**: T1 through T9
**Requirement**: CDF-01

**Tools**:

- Skill: `coding-guidelines`
- MCP: none required

**Done when**:

- [x] Each domain context has an `index.ts` exporting its public domain API.
- [x] Tests or static checks fail if domain files import `@nestjs/*`, `typeorm`, or TypeORM decorators.
- [x] No circular imports are introduced between context barrels.
- [x] TypeScript compiles.

**Gate**: `pnpm --filter @pong-ping/api test && pnpm --filter @pong-ping/api build`
**Commit**: `test(api): guard domain framework independence`

---

### T11: Final Verification

**What**: Run full API verification and update task statuses after implementation.
**Where**: `.specs/features/api-core-domain-foundation/tasks.md`
**Depends on**: T10
**Requirement**: CDF-01 through CDF-05

**Tools**:

- Skill: `tlc-spec-driven`
- MCP: none required

**Done when**:

- [x] `pnpm --filter @pong-ping/api test` passes.
- [x] `pnpm --filter @pong-ping/api build` passes.
- [x] Requirement traceability in `spec.md` is updated to verified/complete.
- [x] `tasks.md` statuses reflect implemented tasks.
- [x] Any deferred persistence/application work is recorded as out of scope, not silently implemented.

**Gate**: full API test/build
**Commit**: `docs(specs): mark api core domain foundation verified`

---

## Parallel Execution Map

```text
Sequential foundation:
  T1 -> T2

Parallel after T2:
  T3 identity/athletes
  T4 table VOs
  T6 ratings
  T7 invitations

Sequential gates:
  T4 -> T5 table aggregate
  T5 + T6 -> T8 competition
  T5 -> T9 scoreboards

Final:
  T1..T9 -> T10 -> T11
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Shared domain primitives | Complete |
| T2 | One aggregate context | Complete |
| T3 | Identity boundary plus athlete context | Complete |
| T4 | Table VOs only | Complete |
| T5 | One table aggregate suite | Complete |
| T6 | One rating context | Complete |
| T7 | One invitation context | Complete |
| T8 | One competition record context | Complete |
| T9 | One scoreboard context | Complete |
| T10 | Cross-context exports/static guard | Complete |
| T11 | Verification/documentation status | Complete |
