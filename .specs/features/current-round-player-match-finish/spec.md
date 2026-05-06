# Current Round Player Match Finish Specification

## Problem Statement

Finishing a table match is currently coupled to the admin API surface. The table detail UI only shows `Encerrar rodada` when `canManage` is true, and `POST /api/admin/tables/[tableId]/matches` calls `requireAdmin` before invoking the competition use case. This blocks the two players currently in the round from finishing their own match unless they are admin or superadmin.

## Goals

- [ ] Allow either current round player to finish the active match without requiring admin or superadmin role.
- [ ] Keep match completion tenant-scoped and reject users who are not in the current round unless they have admin access.
- [ ] Preserve existing Elo, match history, audit, and queue rotation behavior.
- [ ] Keep rollback and queue management admin-only.
- [ ] Keep the table detail UI clear: current players see finish controls; other users do not.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Changing Elo calculation | The scoring model already exists and is not part of the permission refactor. |
| Changing winner-stays queue rotation | Existing table-play behavior stays unchanged. |
| Letting spectators finish matches | Only current players and admins should finish a match. |
| Letting players rollback matches | Rollback remains an admin/superadmin operation. |
| Rebuilding scoreboard controls | This refactor targets table detail match completion, not live point tracking. |
| Adding multi-party confirmation | A single current player finishing a match is the requested workflow. |

---

## User Stories

### P1: Current Player Can Finish Active Match ⭐ MVP

**User Story**: As a current round player, I want to select the winner and finish the match so that play can continue without waiting for an admin.

**Why P1**: This is the requested capability and removes the role bottleneck from the normal player workflow.

**Acceptance Criteria**:

1. WHEN an authenticated tenant user is one of the first two queued participants for a table THEN the system SHALL allow that user to finish the active match.
2. WHEN that current player submits either current participant as the winner THEN the system SHALL create match history, update player rankings, record audit, and rotate the queue exactly as the existing admin finish flow does.
3. WHEN match finish succeeds THEN the response SHALL include the finished match DTO and the UI SHALL refresh table state.
4. WHEN the actor is a current player with role `user` THEN the system SHALL not require `admin` or `superadmin`.

**Independent Test**: Sign in as either current player with role `user`, open `/tables/[tableId]`, choose a winner, and verify the match is recorded and the queue rotates.

---

### P1: Non-Participants Cannot Finish Matches

**User Story**: As a table member or queued spectator, I should not be able to finish someone else's match so that match results stay controlled by the active round.

**Why P1**: Removing the admin route gate must not allow arbitrary tenant users to submit match results.

**Acceptance Criteria**:

1. WHEN an authenticated tenant user is not one of the first two queued participants and does not have admin access THEN the system SHALL reject match finish with `403`.
2. WHEN a same-tenant queued user outside the current round submits a current participant as winner THEN the system SHALL reject the request before creating match history, ranking updates, audit, or queue rotation.
3. WHEN a cross-tenant user submits a request THEN the system SHALL preserve existing tenant isolation and return not found or forbidden without leaking table state.
4. WHEN an unauthenticated user submits a request THEN the system SHALL return `401`.

**Independent Test**: Call the match finish API as a queued third participant and as a non-queued tenant user; both receive `403` and no writes occur.

---

### P1: Admin Finish Flow Still Works

**User Story**: As an admin, I want the existing finish control to keep working so that admins can still resolve matches when needed.

**Why P1**: The refactor expands permissions for current players; it should not regress existing admin workflows.

**Acceptance Criteria**:

1. WHEN an admin or superadmin finishes an active match THEN the existing match behavior SHALL remain successful even if the admin is not one of the current players.
2. WHEN the winner participant is not in the current match THEN the system SHALL keep the existing `winner_not_in_current_match` behavior.
3. WHEN there are fewer than two current players THEN the system SHALL keep the existing `not_enough_players` behavior.
4. WHEN route tests mock admin actors THEN they SHALL still pass through the finish use case with admin bypass enabled.

**Independent Test**: Existing competition route tests for admin match finish still pass after the endpoint/auth refactor.

---

### P2: UI Shows Finish Control To Eligible Actors

**User Story**: As a current player, I want the table page to show the finish button for me so that I do not need to discover an admin-only route or ask for help.

**Why P2**: Backend permission alone does not complete the user workflow.

**Acceptance Criteria**:

1. WHEN `roundIsActive` and `table.viewerIsPlaying` are true THEN `Encerrar rodada` SHALL be visible even when `canManage` is false.
2. WHEN `roundIsActive` and `canManage` is true THEN `Encerrar rodada` SHALL remain visible.
3. WHEN the viewer is neither a current player nor admin THEN finish controls SHALL not render.
4. WHEN a current player finishes a match THEN the UI SHALL call the tenant-authenticated match finish endpoint, show the existing success/error toast pattern, and refresh the page.
5. WHEN rollback buttons render THEN they SHALL remain gated by `canManage` only.

**Independent Test**: Render `TableDetail` for a current player with `canManage=false`; the finish dialog is available. Render for a waiting player with `canManage=false`; it is hidden.

---

## Edge Cases

- WHEN both current players have role `user` THEN either player may finish the match.
- WHEN a current player picks the opponent as winner THEN the request is valid because the winner is still in the active round.
- WHEN the current round changes between page render and submit THEN the backend SHALL validate against current persisted queue state and reject stale winner/actor combinations.
- WHEN the actor has no tenant context THEN the route SHALL return forbidden before calling the competition use case.
- WHEN a non-admin current player finishes a match THEN audit `actorUserId` SHALL be that player.
- WHEN an admin who is also a current player finishes a match THEN the admin bypass and participant eligibility both allow the operation; behavior remains a single match write.
- WHEN old clients call the admin finish endpoint THEN either it SHALL continue to work or intentionally delegate to the new endpoint/use case without changing response shape.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| CPF-01 | P1: Current Player Can Finish Active Match | Verified |
| CPF-02 | P1: Non-Participants Cannot Finish Matches | Verified |
| CPF-03 | P1: Admin Finish Flow Still Works | Verified |
| CPF-04 | P2: UI Shows Finish Control To Eligible Actors | Verified |

Coverage: 4 total, 4 implemented, 4 verified.

## Success Criteria

- [x] A role `user` who is currently playing can finish the match from `/tables/[tableId]`.
- [x] Same-tenant non-current users receive `403` and no competition writes occur.
- [x] Cross-tenant and unauthenticated requests remain denied.
- [x] Existing admin finish, rollback, Elo, audit, and queue rotation tests still pass.
- [x] Targeted route and UI checks cover the new permission matrix.
