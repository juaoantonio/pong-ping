# Context Boundaries Specification

## Problem Statement

The current application has clear business contexts, but important rules are coupled through a few broad modules. The highest-impact coupling sits around table matches: queue rotation, Elo updates, match history, rollback, and audit logging are orchestrated from `lib/tables/service.ts`.

This feature will reorganize the monolith into explicit internal contexts so future changes to table play, competition, invitations, access, scoreboard, and audit can evolve with less cascading impact.

## Goals

- [x] Define explicit module boundaries for table play, competition, identity/access, invitations, audit, and scoreboard.
- [x] Move match finalization and rollback orchestration out of the table service into a competition use-case layer.
- [x] Replace stringly typed domain errors with typed internal contracts.
- [x] Centralize invitation claim rules without merging access invitations and table invitations into a single model.
- [x] Preserve current user-facing behavior unless a task explicitly documents an intentional API/internal contract break.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Database schema redesign | The first implementation should reduce code coupling before changing persistence shape. |
| Microservice extraction | The target architecture remains a modular monolith. |
| UI redesign | The work is architectural; UI changes should be limited to import/contract adjustments. |
| New ranking algorithm | Elo behavior should remain unchanged. |
| Firebase replacement | Scoreboard storage can be wrapped, but not replaced in this feature. |
| `apps/` and `packages/` cleanup | Existing untracked directories are outside this feature. |

---

## User Stories

### P1: Explicit Table Play Boundary

**User Story**: As a maintainer, I want table membership and queue rules isolated so that table-play changes do not require editing competition/ranking code.

**Why P1**: Table queue rules are core to the app and currently share a service with match/ranking orchestration.

**Acceptance Criteria**:

1. WHEN table membership is ensured THEN the system SHALL use a table-play module contract.
2. WHEN a user joins or leaves a queue THEN the system SHALL keep queue validation and reordering inside table play.
3. WHEN a match needs current players THEN competition SHALL consume a table-play contract rather than reading queue implementation details directly.
4. WHEN queue behavior is tested THEN tests SHALL target table-play rules without requiring ranking or audit setup.

**Independent Test**: Unit tests for queue rotation, membership, enqueue, dequeue, and current-player selection pass without importing competition use cases.

---

### P1: Competition Use Cases Own Match Finalization

**User Story**: As a maintainer, I want match finalization and rollback owned by competition so that Elo, match history, and rollback rules evolve together.

**Why P1**: This is the strongest functional coupling found in the codebase.

**Acceptance Criteria**:

1. WHEN an admin finishes a match THEN the system SHALL execute a competition use case that coordinates table play, ranking, match history, and audit.
2. WHEN a rollback is requested THEN the system SHALL execute a competition rollback use case.
3. WHEN Elo is recalculated THEN the existing `calculateElo`, `calculateWinRate`, `MATCH_ELO_K`, and `DEFAULT_PLAYER_ELO` behavior SHALL remain equivalent.
4. WHEN match history is created THEN it SHALL preserve the existing winner/loser old/new Elo and diff fields.
5. WHEN queue rotation is applied after a match THEN the table-play module SHALL own the queue update.

**Independent Test**: A unit test can finish a match and assert ranking updates, match history values, audit event, and queue rotation through the new competition use case.

---

### P1: Typed Domain Errors

**User Story**: As a maintainer, I want typed domain errors so that routes do not depend on raw string messages from services.

**Why P1**: Current routes branch on `error.message`, creating connascence of meaning across modules.

**Acceptance Criteria**:

1. WHEN a domain rule fails THEN use cases SHALL return or throw a typed domain error with a stable code.
2. WHEN a route receives a domain error THEN it SHALL translate the typed code to the same HTTP status and user message currently expected.
3. WHEN adding a new error code THEN TypeScript SHALL make unmapped route translation visible during implementation.

**Independent Test**: Route tests cover at least one table-play error and one competition error without checking generic `Error.message` strings.

---

### P1: Shared Invitation Policy

**User Story**: As a maintainer, I want invitation claim rules centralized so that access and table invitations cannot drift.

**Why P1**: Access and table invitations duplicate expiration, one-time-use, and claim logic.

**Acceptance Criteria**:

1. WHEN claiming an invitation THEN the system SHALL evaluate expiration and one-time-use through a shared invitation policy.
2. WHEN claiming an access invitation THEN the system SHALL still update `AuthInvitation` and `AllowedEmail`.
3. WHEN claiming a table invitation THEN the system SHALL still update `PingPongTableInvitation` and ensure table membership.
4. WHEN an invitation is unavailable THEN both flows SHALL return context-specific user messages.

**Independent Test**: Access invitation and table invitation route tests cover expired, used one-time, reusable, and successful claim scenarios.

---

### P2: Audit Port

**User Story**: As a maintainer, I want audit logging behind a small port so that domain use cases do not write `AuditLog` records directly.

**Why P2**: Audit is currently repeated as persistence detail across routes and services.

**Acceptance Criteria**:

1. WHEN a domain action needs audit logging THEN it SHALL call an audit module function with a typed event.
2. WHEN audit persistence changes THEN domain use cases SHALL not need to know the `AuditLog` Prisma shape.
3. WHEN denied admin actions are logged THEN existing metadata semantics SHALL remain equivalent.

**Independent Test**: Audit unit tests assert event-to-record mapping for match finished, rollback, table queue joined/left, invitation used, and admin denied.

---

### P2: Read Models Hide Prisma Details From Pages

**User Story**: As a maintainer, I want admin/read pages to consume query facades so that Prisma filter and relation shapes do not leak into UI modules.

**Why P2**: `app/admin/rounds/page.tsx` currently builds `Prisma.MatchHistoryWhereInput` directly.

**Acceptance Criteria**:

1. WHEN the rounds admin page lists history THEN it SHALL call a competition query function.
2. WHEN filters are parsed THEN Prisma-specific filter construction SHALL live outside the page component.
3. WHEN table detail/list pages render THEN they SHALL continue consuming DTOs rather than raw Prisma models.

**Independent Test**: Existing pagination/admin route tests continue to pass, and new tests cover round filter query behavior.

---

### P3: Scoreboard Storage Boundary

**User Story**: As a maintainer, I want scoreboard Firebase details isolated so future scoreboard rules can evolve behind a stable state contract.

**Why P3**: Scoreboard coupling is lower risk today, but the Firebase path and state shape are embedded in UI components.

**Acceptance Criteria**:

1. WHEN scoreboard components read/write live state THEN Firebase path construction SHALL be isolated in a scoreboard adapter.
2. WHEN state is initialized THEN existing `ScoreboardState` semantics SHALL remain unchanged.
3. WHEN a future version is introduced THEN the adapter SHALL provide a clear place to version path/schema behavior.

**Independent Test**: Existing scoreboard component and state tests continue to pass.

---

## Edge Cases

- WHEN a match has fewer than two current players THEN competition SHALL return a typed `not_enough_players` style domain error.
- WHEN the winner participant is not in the current match THEN competition SHALL return a typed winner validation error.
- WHEN rollback targets a rollback record THEN competition SHALL reject it.
- WHEN rollback targets a match already rolled back THEN competition SHALL reject it.
- WHEN ranking records are missing during rollback THEN competition SHALL surface a typed conflict error.
- WHEN invitation claim races occur THEN the claim operation SHALL remain atomic through existing `updateMany` count semantics.
- WHEN audit logging is requested inside an existing transaction THEN the audit module SHALL support using the active transaction client.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| CTX-01 | P1: Explicit Table Play Boundary | Complete |
| CTX-02 | P1: Competition Use Cases Own Match Finalization | Complete |
| CTX-03 | P1: Typed Domain Errors | Complete |
| CTX-04 | P1: Shared Invitation Policy | Complete |
| CTX-05 | P2: Audit Port | Complete |
| CTX-06 | P2: Read Models Hide Prisma Details From Pages | Complete |
| CTX-07 | P3: Scoreboard Storage Boundary | Complete |

Coverage: 7 total, 7 mapped to tasks, 0 unmapped.

## Success Criteria

- [x] `lib/tables/service.ts` no longer owns Elo updates, match history creation, rollback, or audit writes.
- [x] Routes no longer branch on raw `Error.message` for table-play and competition failures.
- [x] Competition tests prove finish-match and rollback behavior equivalent to the existing behavior.
- [x] Invitation policy tests cover both access and table invitation flows.
- [x] `pnpm test`, `pnpm lint`, and `pnpm build` pass.
