# Athlete Profile Specification

## Problem Statement

The current profile page only lets a user edit their display name. For a ping-pong club app, a player profile should also describe the athlete's technical characteristics, equipment, internal ranking, and progression over time.

This feature adds athlete-specific profile data while preserving the existing ranking and match-history sources of truth. Self-declared fields are editable in `/profile`; competitive data is displayed as read-only information derived from `PlayerRanking` and `MatchHistory`.

## Goals

- [x] Add athlete profile fields for technical level, grip, playing style, and equipment.
- [x] Let authenticated users edit their own athlete profile from `/profile`.
- [x] Show internal ranking data in the profile without allowing manual ranking edits.
- [x] Show recent evolution history based on Elo changes from match history.
- [x] Preserve tenant isolation for all profile, ranking, and history reads.
- [x] Keep the existing name update behavior working.
- [x] Add focused validation and regression tests.

## Out Of Scope

| Feature | Reason |
| --- | --- |
| Equipment catalog | Free text is enough for the first version. |
| Uploading equipment photos | Not required for the requested fields. |
| Admin editing another athlete's profile | The request targets the player's own profile. |
| Manual ranking edits | Ranking is derived from matches and must remain read-only. |
| Elo recalculation | Existing ranking logic remains unchanged. |
| Advanced charts | A compact evolution list is enough for the first version. |
| Public athlete profile pages | This feature targets authenticated `/profile`. |

---

## User Stories

### P1: Athlete Can Edit Technical Profile

**User Story**: As an authenticated athlete, I want to record my technical level, grip, and playing style so that my player profile reflects how I play.

**Why P1**: These are core requested athlete-profile fields.

**Acceptance Criteria**:

1. WHEN an authenticated user opens `/profile` THEN the system SHALL show fields for technical level, grip, and playing style.
2. WHEN the user saves valid profile values THEN the system SHALL persist the values to their own athlete profile.
3. WHEN the user leaves athlete fields empty THEN the system SHALL save null values without blocking the name update.
4. WHEN the request includes an invalid grip value THEN the system SHALL return `400` and SHALL NOT persist the invalid value.
5. WHEN the request includes an invalid playing style value THEN the system SHALL return `400` and SHALL NOT persist the invalid value.
6. WHEN another user is authenticated THEN they SHALL NOT be able to update this user's athlete profile through the same API.

**Independent Test**: Submit valid and invalid `PATCH /api/auth/me` payloads and verify `AthleteProfile` is upserted only for the authenticated user.

---

### P1: Athlete Can Record Equipment

**User Story**: As an authenticated athlete, I want to record my blade and rubbers so that other club members and I can track the equipment I use.

**Why P1**: Equipment fields are explicitly requested.

**Acceptance Criteria**:

1. WHEN the user opens `/profile` THEN the system SHALL show equipment fields for blade, forehand rubber, backhand rubber, and optional notes.
2. WHEN the user saves equipment names within limits THEN the system SHALL persist trimmed strings.
3. WHEN an equipment string is blank after trim THEN the system SHALL persist it as null.
4. WHEN an equipment name exceeds 120 characters THEN the system SHALL return `400`.
5. WHEN equipment notes exceed 500 characters THEN the system SHALL return `400`.
6. WHEN long equipment values render THEN the page SHALL avoid horizontal overflow on mobile.

**Independent Test**: Save equipment values, reload `/profile`, and verify trimmed values render without affecting ranking data.

---

### P1: Profile Shows Internal Ranking

**User Story**: As an athlete, I want to see my internal ranking in my profile so that I understand my current position in the club.

**Why P1**: Internal ranking is a requested profile item and already exists as derived data.

**Acceptance Criteria**:

1. WHEN the user has a `PlayerRanking` row THEN `/profile` SHALL show Elo, wins, total matches, win rate, and internal position.
2. WHEN the user has no `PlayerRanking` row THEN `/profile` SHALL show default ranking values without failing.
3. WHEN ranking position is calculated THEN it SHALL be scoped to the user's tenant.
4. WHEN ranking data renders THEN it SHALL be read-only and not included as editable form inputs.
5. WHEN ranking ties occur THEN ordering SHALL match the public ranking ordering strategy.

**Independent Test**: Seed multiple users in the same tenant with rankings and verify the authenticated user's profile shows the expected position.

---

### P1: Profile Shows Evolution History

**User Story**: As an athlete, I want to see my recent Elo evolution so that I can understand how my results changed over time.

**Why P1**: Historical evolution is explicitly requested.

**Acceptance Criteria**:

1. WHEN the user has match history THEN `/profile` SHALL show the latest matches involving that user.
2. WHEN the user won a match THEN the evolution row SHALL use winner Elo fields.
3. WHEN the user lost a match THEN the evolution row SHALL use loser Elo fields.
4. WHEN the history includes rollback rows THEN the default evolution list SHALL exclude rollback rows.
5. WHEN match history belongs to another tenant THEN it SHALL NOT appear.
6. WHEN the user has no match history THEN the page SHALL show a compact empty state.

**Independent Test**: Seed win, loss, rollback, and cross-tenant history rows and verify only the correct tenant-scoped match rows render with correct Elo deltas.

---

### P1: Existing Profile Behavior Remains Stable

**User Story**: As a current user, I want existing profile name editing to keep working so that adding athlete fields does not regress account basics.

**Why P1**: `/profile` already has production behavior and API clients may depend on it.

**Acceptance Criteria**:

1. WHEN a valid name is submitted with no athlete fields THEN the system SHALL update the name as it does today.
2. WHEN the name is shorter than 2 characters THEN the system SHALL return the existing validation error.
3. WHEN the name is longer than 80 characters THEN the system SHALL return the existing validation error.
4. WHEN save succeeds THEN the client SHALL keep using the existing toast and authenticated-user mutation behavior.
5. WHEN save succeeds THEN the page SHALL refresh to show read-only ranking/evolution data.

**Independent Test**: Existing name-update tests pass after adding athlete profile support.

---

### P2: Profile UI Stays Usable And Accessible

**User Story**: As a keyboard or mobile user, I want the expanded profile page to remain easy to scan and operate.

**Why P2**: The form grows from one field to several fields, so layout and accessibility need guardrails.

**Acceptance Criteria**:

1. WHEN the page renders on mobile THEN controls SHALL stack without horizontal overflow.
2. WHEN labels render THEN each input/select/textarea SHALL have a visible associated label.
3. WHEN the save button is disabled THEN the disabled state SHALL be based on actual changes and valid required fields.
4. WHEN async save is pending THEN the button SHALL show pending state without layout shift.
5. WHEN read-only ranking and evolution sections render THEN they SHALL not look editable.

**Independent Test**: Review `/profile` at 375px and 1280px, tab through fields, and verify visible focus and no overflow.

---

## Current Evidence

| Surface | Evidence | Direction |
| --- | --- | --- |
| Profile page | [app/(app)/profile/page.tsx](/Users/juao/pong-ping/app/(app)/profile/page.tsx) has header, edit form, and validated data sections | Extend the same page rather than adding a new route |
| Profile form | [app/(app)/profile/profile-form.tsx](/Users/juao/pong-ping/app/(app)/profile/profile-form.tsx) submits only `name` to `/api/auth/me` | Add controlled fields and payload mapping |
| Profile API | [app/api/auth/me/route.ts](/Users/juao/pong-ping/app/api/auth/me/route.ts) updates `User.name` | Add validation and `AthleteProfile` upsert |
| User model | [prisma/schema.prisma](/Users/juao/pong-ping/prisma/schema.prisma) keeps auth/account fields in `User` | Add separate `AthleteProfile` model |
| Ranking model | `PlayerRanking` stores Elo, wins, total matches, and win rate | Read from existing source |
| Match history | `MatchHistory` stores old/new Elo per winner and loser | Build evolution history without schema changes |
| Public ranking | [lib/rankings/queries.ts](/Users/juao/pong-ping/lib/rankings/queries.ts) defines tenant ranking sort behavior | Reuse the same ranking semantics |

## Data And Permission Rules

| Actor State | Edit Athlete Fields | View Own Ranking | View Own Evolution | View Cross-Tenant Data |
| --- | --- | --- | --- | --- |
| Authenticated tenant user | Allowed for self | Allowed | Allowed | Denied |
| Tenant admin | Allowed for self only | Allowed for self | Allowed for self | Denied |
| Superadmin | Allowed for self only | Allowed for self | Allowed for self | Denied by default |
| Unauthenticated user | Denied | Denied | Denied | Denied |

## Edge Cases

- WHEN a user does not have an `AthleteProfile` row THEN `/profile` SHALL render empty athlete fields.
- WHEN a user saves athlete data for the first time THEN the API SHALL create the profile row.
- WHEN a user clears an optional athlete field THEN the API SHALL store null.
- WHEN a user has no ranking row THEN default ranking values SHALL render.
- WHEN two users tie on Elo and wins THEN position calculation SHALL use the same stable tie-breaker as public rankings.
- WHEN a match was rolled back THEN the rollback row SHALL not be shown as a normal evolution match.
- WHEN an old match has a deleted table THEN evolution SHALL still render from match history.
- WHEN opponent name is null THEN UI SHALL fall back to opponent email or `Sem nome`.
- WHEN tenant context is missing THEN profile writes SHALL fail rather than creating tenantless athlete data.
- WHEN long equipment text is saved THEN UI SHALL wrap or truncate intentionally.

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| AP-001 | Athlete Can Edit Technical Profile | Implemented |
| AP-002 | Athlete Can Record Equipment | Implemented |
| AP-003 | Profile Shows Internal Ranking | Implemented |
| AP-004 | Profile Shows Evolution History | Implemented |
| AP-005 | Existing Profile Behavior Remains Stable | Implemented |
| AP-006 | Profile UI Stays Usable And Accessible | Implemented |

Coverage: 6 total, 6 implemented, 0 planned.

## Success Criteria

- [x] `/profile` includes editable athlete fields and equipment fields.
- [x] `PATCH /api/auth/me` validates and persists athlete profile data.
- [x] Ranking shown in the profile is derived from `PlayerRanking`.
- [x] Evolution history shown in the profile is derived from `MatchHistory`.
- [x] No request can write or read cross-tenant athlete/ranking/history data.
- [x] Existing name update behavior remains compatible.
- [x] Focused tests cover API validation, profile upsert, ranking position, and evolution mapping.
- [x] `pnpm test`, `pnpm lint`, and `pnpm build` pass after implementation.
