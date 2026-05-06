# Current Round Player Match Finish Tasks

**Design**: `.specs/features/current-round-player-match-finish/design.md`
**Status**: Done

---

## Execution Plan

### Phase 1: Domain Authorization

```text
T1 -> T2
```

### Phase 2: Route Surface

```text
T2 -> T3 -> T4
```

### Phase 3: UI Eligibility

```text
T4 -> T5
```

### Phase 4: Verification

```text
T2 + T4 + T5 -> T6
```

---

## Task Breakdown

### T1: Add Competition Finish Permission Error [Done]

**What**: Add `finish_match_forbidden` to competition errors and map it to a 403 HTTP response.
**Where**: `lib/contexts/competition/use-cases.ts`, `lib/contexts/competition/errors.ts`
**Depends on**: None
**Reuses**: Existing `CompetitionErrorCode`, `competitionError`, and `mapCompetitionErrorToHttp` patterns.
**Requirement**: CPF-02

**Done when**:

- [x] `CompetitionErrorCode` includes `finish_match_forbidden`.
- [x] `mapCompetitionErrorToHttp` returns status `403` for the new code.
- [x] The user-facing message says only current round players or admins can finish the round.
- [x] TypeScript exhaustiveness remains valid.

**Tests**: unit
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/competition/match-routes.test.ts __tests__/unit/competition/match-use-cases.test.ts`

---

### T2: Enforce Actor Eligibility In `finishMatch` [Done]

**What**: Extend `finishMatch` input with `actorCanManageTable` and reject actors who are neither admins nor current players before any match writes.
**Where**: `lib/contexts/competition/use-cases.ts`, `__tests__/unit/competition/match-use-cases.test.ts`
**Depends on**: T1
**Reuses**: `getCurrentMatchParticipants` current player list and existing no-write failure assertions.
**Requirement**: CPF-01, CPF-02, CPF-03

**Done when**:

- [x] `finishMatch` accepts `actorCanManageTable: boolean`.
- [x] Admin/superadmin callers can finish even when not current players.
- [x] Current player callers with role `user` can finish.
- [x] Same-tenant non-current callers get `finish_match_forbidden`.
- [x] Forbidden finish attempts do not call ranking upserts, match history create, audit, ranking updates, or queue rotation.
- [x] Existing winner/current-player validation still runs and preserves current errors.

**Tests**: unit
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/competition/match-use-cases.test.ts`

---

### T3: Add Player-Accessible Match Finish Route [Done]

**What**: Create an authenticated tenant route for current players to finish table matches.
**Where**: `app/api/tables/[tableId]/matches/route.ts`, `__tests__/unit/competition/match-routes.test.ts`
**Depends on**: T2
**Reuses**: Auth/tenant handling from `app/api/tables/[tableId]/queue/route.ts`; response mapping from competition errors.
**Requirement**: CPF-01, CPF-02

**Done when**:

- [x] `POST /api/tables/[tableId]/matches` reads `winnerParticipantId`.
- [x] Unauthenticated requests return `401`.
- [x] Missing tenant context returns `403`.
- [x] Route calls `finishMatch` inside `prisma.$transaction`.
- [x] Route passes `actorUserId`, `tenantId`, `tableId`, `winnerParticipantId`, and `actorCanManageTable: canAccessAdmin(actor.role)`.
- [x] Route maps competition errors through `mapCompetitionErrorToHttp`.

**Tests**: route unit
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/competition/match-routes.test.ts`

---

### T4: Preserve Admin Match Finish Route Compatibility [Done]

**What**: Update the existing admin finish route to pass the new `finishMatch` permission input.
**Where**: `app/api/admin/tables/[tableId]/matches/route.ts`, `__tests__/unit/competition/match-routes.test.ts`
**Depends on**: T3
**Reuses**: Existing `requireAdmin` behavior and route tests.
**Requirement**: CPF-03

**Done when**:

- [x] Existing admin route still requires admin.
- [x] Existing admin route passes `actorCanManageTable: true`.
- [x] Existing admin route response shape remains `{ match: ... }`.
- [x] Existing admin route tests are updated for the new input shape.

**Tests**: route unit
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/competition/match-routes.test.ts`

---

### T5: Expose Finish Controls To Current Players [Done]

**What**: Show the existing finish dialog to current players and submit to the tenant table match endpoint.
**Where**: `components/tables/table-detail.tsx`, relevant component tests if present or added.
**Depends on**: T4
**Reuses**: Existing `viewerIsPlaying`, `canManage`, finish dialog, toast, pending state, and `router.refresh()` patterns.
**Requirement**: CPF-04

**Done when**:

- [x] Finish control renders when `roundIsActive && (canManage || table.viewerIsPlaying)`.
- [x] Finish control remains hidden for non-current non-admin viewers.
- [x] Finish submit fetches `/api/tables/${table.id}/matches`.
- [x] Rollback and queue removal controls remain `canManage` only.
- [x] Button pending state and dialog behavior remain stable on mobile and desktop.

**Tests**: component unit if existing test harness supports it; otherwise targeted manual/UI verification plus route tests.
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/competition/match-routes.test.ts`

---

### T6: Run Final Verification [Done]

**What**: Run targeted and broad gates after the refactor.
**Where**: repository root
**Depends on**: T2, T4, T5
**Reuses**: Existing package scripts.
**Requirement**: CPF-01 through CPF-04

**Done when**:

- [x] Targeted competition use-case tests pass.
- [x] Targeted competition route tests pass.
- [x] Table route tests still pass if touched indirectly.
- [x] `pnpm test` passes.
- [x] `pnpm build` passes.

**Tests**: unit + build
**Gate**: `pnpm test && pnpm build`

---

## Pre-Approval Checks

### Task Granularity

| Task | Atomic? | Reason |
| --- | --- | --- |
| T1 | Yes | One error/mapping addition. |
| T2 | Yes | One use-case authorization change plus co-located unit tests. |
| T3 | Yes | One new route and route tests. |
| T4 | Yes | One compatibility update to existing admin route. |
| T5 | Yes | One UI eligibility/API URL update. |
| T6 | Yes | Verification only. |

### Diagram-Definition Cross-Check

| Task | Depends on | Diagram Match |
| --- | --- | --- |
| T1 | None | Starts Phase 1. |
| T2 | T1 | `T1 -> T2`. |
| T3 | T2 | `T2 -> T3`. |
| T4 | T3 | `T3 -> T4`. |
| T5 | T4 | `T4 -> T5`. |
| T6 | T2, T4, T5 | `T2 + T4 + T5 -> T6`. |

### Test Co-Location Validation

| Task | Code Layer | Tests Field | Validation |
| --- | --- | --- | --- |
| T1 | Domain error mapper | unit | Uses existing competition tests. |
| T2 | Domain use case | unit | Adds/updates use-case tests in same task. |
| T3 | Route handler | route unit | Adds/updates route tests in same task. |
| T4 | Route handler | route unit | Updates existing admin route tests in same task. |
| T5 | Client component | component/manual | UI test depends on existing harness; route tests cover server permission. |
| T6 | Verification | unit + build | Runs targeted and broad gates. |

## Tooling Assumption

No `.specs/codebase/TESTING.md` exists. This plan uses the local `package.json` gates: `pnpm test` for Jest and `pnpm build` for the Next/TypeScript production build.
