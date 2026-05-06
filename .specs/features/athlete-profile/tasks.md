# Athlete Profile Tasks

**Spec**: `.specs/features/athlete-profile/spec.md`
**Status**: Implemented

---

## Execution Plan

```text
T1 -> T2 -> T3 -> T4 -> T5 -> T6
```

## Task Breakdown

### T1: Add Athlete Profile Schema

**What**: Add athlete profile enums, model relations, and a migration.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`
**Depends on**: none
**Requirement**: AP-001, AP-002

**Done when**:

- [x] `AthleteTechnicalLevel`, `AthleteGripStyle`, and `AthletePlayingStyle` enums exist.
- [x] `AthleteProfile` exists with `tenantId`, `userId`, profile fields, equipment fields, and timestamps.
- [x] `User` has an optional `athleteProfile` relation.
- [x] `Tenant` has `athleteProfiles`.
- [x] Migration creates the table, indexes, relations, and enum types.
- [x] Existing users do not require backfill.

**Gate**: `pnpm prisma:generate`

### T2: Create Athlete Profile Read Model

**What**: Add server-side query helpers for editable athlete data, ranking summary, ranking position, and evolution history.
**Where**: `lib/athletes/profile.ts` or equivalent
**Depends on**: T1
**Requirement**: AP-003, AP-004

**Done when**:

- [x] Query returns empty editable athlete fields when no `AthleteProfile` exists.
- [x] Ranking summary reads `PlayerRanking` or falls back to default ranking values.
- [x] Ranking position is scoped to the authenticated user's tenant.
- [x] Ranking ordering matches public ranking semantics.
- [x] Evolution query returns latest tenant-scoped `MatchHistory` rows where the user is winner or loser.
- [x] Evolution mapper correctly handles win and loss perspectives.
- [x] Rollback rows are excluded from the default evolution list.

**Gate**: focused unit tests for ranking position and evolution mapping

### T3: Extend Authenticated User API

**What**: Extend `PATCH /api/auth/me` to validate and persist athlete profile fields while preserving name update behavior.
**Where**: `app/api/auth/me/route.ts`, `lib/auth/shared.ts` if client response changes
**Depends on**: T1
**Requirement**: AP-001, AP-002, AP-005

**Done when**:

- [x] Existing `name` validation still accepts 2 to 80 trimmed characters.
- [x] Technical level accepts only supported enum values or null.
- [x] Grip accepts only `classic`, `penhold`, or null.
- [x] Playing style accepts only `offensive`, `defensive`, `all_round`, or null.
- [x] Equipment names are optional, trimmed, nullable, and limited to 120 characters.
- [x] Equipment notes are optional, trimmed, nullable, and limited to 500 characters.
- [x] API derives `tenantId` from the authenticated user.
- [x] API upserts `AthleteProfile` by `userId`.
- [x] API does not accept ranking or evolution fields as writable data.

**Gate**: route tests for valid save, invalid enums, oversized fields, null optional fields, and name regression

### T4: Update Profile Page Data Loading

**What**: Load athlete profile, ranking summary, and evolution history for `/profile`.
**Where**: `app/(app)/profile/page.tsx`
**Depends on**: T2
**Requirement**: AP-003, AP-004, AP-006

**Done when**:

- [x] Page passes initial athlete profile values into `ProfileForm`.
- [x] Page renders internal ranking as read-only data.
- [x] Page renders recent evolution history as read-only data.
- [x] Empty ranking/history states render compactly.
- [x] Long names, emails, and equipment labels do not cause mobile overflow.
- [x] Existing header and validated account data remain available.

**Gate**: manual review at 375px and 1280px

### T5: Extend Profile Form UI

**What**: Add editable controls for athlete profile and equipment fields.
**Where**: `app/(app)/profile/profile-form.tsx`
**Depends on**: T3, T4
**Requirement**: AP-001, AP-002, AP-005, AP-006

**Done when**:

- [x] Form includes name, technical level, grip, playing style, blade, forehand rubber, backhand rubber, and equipment notes.
- [x] Enum fields use `Select`.
- [x] Equipment notes use `Textarea`.
- [x] Submit payload includes only editable profile fields.
- [x] Save button disabled state accounts for changes and valid required name.
- [x] Pending state keeps layout stable.
- [x] Existing toast, `mutateUser`, and `router.refresh()` behavior still work.
- [x] All controls have visible labels and keyboard focus.

**Gate**: component smoke test or manual keyboard pass

### T6: Verify And Harden

**What**: Add automated coverage and run project checks.
**Where**: `__tests__/unit/*`, touched source files
**Depends on**: T1, T2, T3, T4, T5
**Requirement**: AP-001 through AP-006

**Done when**:

- [x] API tests cover valid athlete profile save.
- [x] API tests cover invalid enum values.
- [x] API tests cover oversized equipment fields.
- [x] API tests cover clearing optional fields to null.
- [x] Query tests cover ranking fallback and ranking position.
- [x] Query tests cover win/loss evolution mapping.
- [x] Query tests cover rollback and cross-tenant exclusion.
- [x] Existing auth/profile behavior still passes.
- [x] Visual/accessibility review finds no missing labels or mobile overflow.

**Gate**: `pnpm test`, `pnpm lint`, `pnpm build`

## Parallelization Notes

- T2 and T3 can proceed after T1 but should coordinate shared validation/types.
- T4 and T5 should be done together or sequentially because props and form state are tightly coupled.
- T6 should run after implementation, but query tests can be added alongside T2 and API tests alongside T3.

## Implementation Order Recommendation

1. T1 schema and Prisma generation.
2. T2 read model with tests.
3. T3 API validation and upsert with tests.
4. T4 page data integration.
5. T5 form controls and UI behavior.
6. T6 full verification.
