# Context Boundaries Tasks

**Design**: `.specs/features/context-boundaries/design.md`
**Status**: Complete

---

## Execution Plan

### Phase 1: Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Core Context Extraction

```text
T3 -> T4 -> T5
T3 -> T6
T3 -> T7
```

### Phase 3: Route and Read Model Migration

```text
T5 -> T8 -> T9
T6 -> T10
T7 -> T11
```

### Phase 4: Verification and Cleanup

```text
T9 + T10 + T11 -> T12 -> T13
```

---

## Task Breakdown

### T1: Create Spec Artifacts [Done]

**What**: Create `.specs/features/context-boundaries` with spec, context decisions, design, and task plan.
**Where**: `.specs/features/context-boundaries/`
**Depends on**: None
**Requirement**: CTX-01 through CTX-07

**Done when**:

- [x] `spec.md` contains goals, stories, edge cases, and traceability.
- [x] `context.md` records user decisions.
- [x] `design.md` defines context interfaces and dependencies.
- [x] `tasks.md` contains atomic implementation tasks.

**Tests**: none
**Gate**: documentation review

---

### T2: Add Shared Domain Result and Error Types [Done]

**What**: Introduce typed domain result/error helpers for context modules.
**Where**: `lib/contexts/shared/`
**Depends on**: T1
**Requirement**: CTX-03

**Done when**:

- [x] `DomainResult<T>`, `DomainError`, `ok`, and `fail` are exported.
- [x] Error codes can carry context and stable code.
- [x] No existing application code is migrated yet.
- [x] TypeScript compiles.

**Tests**: unit if behavior helpers are non-trivial
**Gate**: `pnpm test -- --runTestsByPath` for new helper tests, then `pnpm lint`

---

### T3: Add Audit Context Port [Done]

**What**: Create a typed audit module that maps audit events to `AuditLog` writes.
**Where**: `lib/contexts/audit/`
**Depends on**: T2
**Requirement**: CTX-05

**Done when**:

- [x] Audit event types cover current event names used by routes/services.
- [x] Audit module accepts Prisma client or transaction client.
- [x] Existing metadata shapes are preserved.
- [x] Unit tests cover event-to-record mapping.

**Tests**: unit
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/audit/*.test.ts`

---

### T4: Extract Table Play Context [Done]

**What**: Move table membership, queue, participant removal, current-player lookup, and queue rotation into table-play.
**Where**: `lib/contexts/table-play/`
**Depends on**: T3
**Requirement**: CTX-01

**Done when**:

- [x] Queue and membership functions return typed domain results.
- [x] Existing queue-position and current-player rules are preserved.
- [x] Existing table queue route tests are updated to mock/use table-play.
- [x] `lib/tables/queue.ts` and `lib/tables/service.ts` no longer own new table-play behavior except temporary compatibility exports if needed.

**Tests**: unit + route regression
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/tables/queue.test.ts __tests__/unit/tables/table-queue-route.test.ts`

---

### T5: Extract Competition Use Cases [Done]

**What**: Move match finalization and rollback into competition use cases.
**Where**: `lib/contexts/competition/`
**Depends on**: T4
**Requirement**: CTX-02, CTX-03, CTX-05

**Done when**:

- [x] `finishMatch` owns match history and ranking updates.
- [x] `rollbackMatch` owns rollback validation and ranking reversal.
- [x] Competition calls table-play for current players and queue rotation.
- [x] Competition calls audit context for match events.
- [x] Existing Elo behavior and match history fields are preserved.
- [x] Unit tests cover success and core failure cases.

**Tests**: unit
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/competition/*.test.ts __tests__/unit/ranking/elo.test.ts`

---

### T6: Extract Invitation Policy and Use Cases [Done]

**What**: Centralize invitation availability and claim behavior, then adapt access and table invitation flows.
**Where**: `lib/contexts/invitations/`
**Depends on**: T3
**Requirement**: CTX-04, CTX-05

**Done when**:

- [x] Shared policy handles expiration and one-time-use availability.
- [x] Access invitation claim still upserts `AllowedEmail`.
- [x] Table invitation claim still ensures table membership.
- [x] Claim race behavior keeps existing atomic `updateMany` semantics.
- [x] Route tests cover unavailable and successful claims.

**Tests**: unit + route regression
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/access.test.ts __tests__/unit/*invitation*.test.ts`

---

### T7: Create Competition Read Models [Done]

**What**: Move admin round filter construction and query mapping out of page components.
**Where**: `lib/contexts/competition/queries.ts`
**Depends on**: T3
**Requirement**: CTX-06

**Done when**:

- [x] Admin rounds page calls a query facade instead of building `Prisma.MatchHistoryWhereInput`.
- [x] Existing filter semantics for q, tableId, player, createdBy, kind, status, from, and to are preserved.
- [x] Returned DTO matches `RoundsAdmin` needs.

**Tests**: unit for filter/query mapping where practical
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/admin-pagination-routes.test.ts`

---

### T8: Migrate Match and Rollback Routes [Done]

**What**: Update admin match routes to call competition use cases and typed HTTP error mappers.
**Where**: `app/api/admin/tables/[tableId]/matches/*`, `app/api/admin/rounds/[roundId]/rollback/route.ts`
**Depends on**: T5
**Requirement**: CTX-02, CTX-03

**Done when**:

- [x] Routes no longer import `rollbackTableMatch` or `finishTableMatch` from `lib/tables/service`.
- [x] Routes do not branch on raw `Error.message`.
- [x] User-facing status/message behavior is preserved or intentionally documented.

**Tests**: route regression
**Gate**: targeted Jest route tests, then `pnpm test`

---

### T9: Remove Legacy Competition Behavior From Tables Service [Done]

**What**: Delete or reduce `lib/tables/service.ts` so it no longer owns competition behavior.
**Where**: `lib/tables/service.ts`, compatibility import sites
**Depends on**: T8
**Requirement**: CTX-01, CTX-02

**Done when**:

- [x] `lib/tables/service.ts` contains no Elo, `MatchHistory`, rollback, or audit orchestration.
- [x] All imports compile against new context modules.
- [x] No duplicate match finalization/rollback implementation remains.

**Tests**: full unit suite
**Gate**: `pnpm test`

---

### T10: Migrate Invitation Routes [Done]

**What**: Update access and table invitation routes/admin handlers to use invitation use cases.
**Where**: `app/api/admin/access/route.ts`, `app/api/invitations/[token]/route.ts`, `app/api/admin/tables/[tableId]/invites/route.ts`, `app/api/tables/join/[token]/route.ts`
**Depends on**: T6
**Requirement**: CTX-04

**Done when**:

- [x] Duplicate expiration/one-time-use checks are removed from routes.
- [x] Routes keep HTTP request/response responsibilities.
- [x] Context-specific messages remain clear.

**Tests**: access and invitation route/unit tests
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/access.test.ts __tests__/unit/sign-in-policy.test.ts`

---

### T11: Add Scoreboard Adapter Boundary [Done]

**What**: Isolate Firebase path construction and re-export scoreboard state through a context module.
**Where**: `lib/contexts/scoreboard/`, `components/scoreboard/*`
**Depends on**: T7
**Requirement**: CTX-07

**Done when**:

- [x] Components no longer hardcode `scoreboards/${tableId}/current`.
- [x] Existing scoreboard state behavior is unchanged.
- [x] Existing scoreboard tests pass.

**Tests**: unit/component
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/scoreboard/state.test.ts __tests__/unit/scoreboard/realtime-scoreboard.test.tsx __tests__/unit/scoreboard/scoreboard-controls.test.tsx`

---

### T12: Update Imports, Docs, and Remove Dead Code [Done]

**What**: Clean up legacy imports and update docs/comments to match context names.
**Where**: affected `app`, `lib`, `components`, and `.specs`
**Depends on**: T9, T10, T11
**Requirement**: CTX-01 through CTX-07

**Done when**:

- [x] No stale imports from removed legacy functions remain.
- [x] `.specs/features/context-boundaries/tasks.md` statuses are updated.
- [x] No unrelated untracked directories are modified.

**Tests**: lint + test
**Gate**: `pnpm lint && pnpm test`

---

### T13: Full Verification [Done]

**What**: Run final verification gates and record implementation summary.
**Where**: repository root and `.specs/features/context-boundaries/`
**Depends on**: T12
**Requirement**: CTX-01 through CTX-07

**Done when**:

- [x] `pnpm test` passes.
- [x] `pnpm lint` passes.
- [x] `pnpm build` passes.
- [x] `.specs/features/context-boundaries/` reflects final status and any deviations.

**Tests**: full suite
**Gate**: `pnpm test`, `pnpm lint`, `pnpm build`

---

## Validation Tables

### Task Granularity

| Task | Atomic? | Notes |
| --- | --- | --- |
| T1 | Yes | Documentation artifact only. |
| T2 | Yes | Shared result/error contract only. |
| T3 | Yes | Audit port only. |
| T4 | Yes | Table-play extraction. |
| T5 | Yes | Competition use cases. |
| T6 | Yes | Invitation policy/use cases. |
| T7 | Yes | Competition read model facade. |
| T8 | Yes | Match/rollback route migration. |
| T9 | Yes | Legacy table service cleanup. |
| T10 | Yes | Invitation route migration. |
| T11 | Yes | Scoreboard adapter boundary. |
| T12 | Yes | Cleanup and docs status. |
| T13 | Yes | Final verification only. |

### Dependency Cross-Check

| Task | Depends on | Matches Execution Plan |
| --- | --- | --- |
| T1 | None | Yes |
| T2 | T1 | Yes |
| T3 | T2 | Yes |
| T4 | T3 | Yes |
| T5 | T4 | Yes |
| T6 | T3 | Yes |
| T7 | T3 | Yes |
| T8 | T5 | Yes |
| T9 | T8 | Yes |
| T10 | T6 | Yes |
| T11 | T7 | Yes |
| T12 | T9, T10, T11 | Yes |
| T13 | T12 | Yes |

### Test Co-location

| Task | Test Type | Co-located? |
| --- | --- | --- |
| T1 | none | N/A |
| T2 | unit if helper behavior exists | Yes |
| T3 | unit | Yes |
| T4 | unit + route regression | Yes |
| T5 | unit | Yes |
| T6 | unit + route regression | Yes |
| T7 | unit | Yes |
| T8 | route regression | Yes |
| T9 | full unit suite | Yes |
| T10 | route/unit regression | Yes |
| T11 | unit/component | Yes |
| T12 | lint + test | N/A |
| T13 | full gates | N/A |
