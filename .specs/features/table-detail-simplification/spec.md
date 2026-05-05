# Table Detail Simplification Specification

## Problem Statement

The `/tables/[tableId]` page exposes the right table operations, but the workflow is harder than it needs to be. Current UI splits the same decision across many regions: current round, queue, table metadata, viewer participation, admin entry, invitation link, and recent rounds. It also blocks normal tenant users from joining a table queue unless an admin first adds them as table members or they use a table invite.

This feature simplifies the table detail page into a focused play workflow: understand the current round, take the next player action, scan the queue, and use secondary management/history only when needed. Any authenticated user in the same tenant should be able to join the table flow without admin pre-approval.

## Goals

- [x] Make the primary user path on `/tables/[tableId]` obvious: join queue, leave queue, open scoreboard/controls, or wait.
- [x] Reduce visible regions and remove low-value metadata from the default page view.
- [x] Allow any authenticated user in the table tenant to join a table queue directly.
- [x] Keep tenant isolation strict: cross-tenant users cannot view, join, mutate, or infer table state.
- [x] Preserve admin-only powers for match completion, rollback, and removing queued players.
- [x] Improve mobile ergonomics, keyboard access, focus states, and long-content handling.

## Out of Scope

| Feature                              | Reason                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Changing match rotation rules        | Winner-stays queue behavior already exists and is not part of this simplification.               |
| Changing Elo calculation             | Recent match scoring logic stays untouched.                                                      |
| Rebuilding scoreboard screens        | `/scoreboard` and `/scoreboard/controls` can receive clearer links but are separate experiences. |
| New role model                       | Tenant membership decides who may self-join; admin role still gates management actions.          |
| Public unauthenticated table joining | Join remains authenticated and tenant-scoped.                                                    |
| Real-time queue updates              | Current refresh-after-action behavior may stay unless separate realtime work is planned.         |
| Full table list redesign             | `/tables` may keep current list behavior; this spec targets `/tables/[tableId]`.                 |

---

## User Stories

### P1: Tenant User Can Join Table Directly ⭐ MVP

**User Story**: As an authenticated tenant user, I want to join any table in my tenant without admin setup so that playing does not depend on invite links or manual membership.

**Why P1**: This removes the biggest workflow gate and matches the requested access model.

**Acceptance Criteria**:

1. WHEN an authenticated user opens `/tables/[tableId]` for a table in their tenant THEN the system SHALL render the page even if no `PingPongTableMember` row exists for that user.
2. WHEN a same-tenant user clicks `Entrar na fila` and is not queued THEN the system SHALL create any required table membership and enqueue that user in one successful action.
3. WHEN a same-tenant user is already queued THEN the system SHALL keep the existing duplicate-queue guard and show a user-facing error or queued state.
4. WHEN a user from another tenant requests the table page or queue API THEN the system SHALL return the existing not-found/forbidden behavior without creating membership or participant records.
5. WHEN queue join succeeds THEN audit SHALL record the queue join and, if membership is auto-created, the membership creation or metadata SHALL make the auto-join path clear.

**Independent Test**: Seed a tenant user with no table membership, open `/tables/[tableId]`, click `Entrar na fila`, and verify membership plus participant records exist in that tenant only.

---

### P1: Single Primary Action Area

**User Story**: As a player, I want one clear action area that tells me what I can do next so that I do not scan separate participation and match sections.

**Why P1**: The current page separates status text from match actions and makes the next step compete with management/history content.

**Acceptance Criteria**:

1. WHEN the viewer is not queued and not playing THEN the page SHALL show one primary `Entrar na fila` action near the top of the page.
2. WHEN the viewer is queued but not playing THEN the same action area SHALL show their queue position and a secondary `Sair da fila` action.
3. WHEN the viewer is one of the current players THEN the action area SHALL prioritize `Controles` and explain that current players cannot leave until the round ends.
4. WHEN there are 2 current players THEN `Abrir placar` SHALL be visible as a navigation action without competing with `Encerrar rodada`.
5. WHEN an action starts THEN the triggering control SHALL show pending state without shifting layout or disabling unrelated navigation.

**Independent Test**: Review the page as not queued, queued, current player, and admin; each state has one obvious next action above secondary content.

---

### P1: Current Round First, Queue Second

**User Story**: As a player or spectator, I want the current round and next players to be the main content so that table state is understandable at a glance.

**Why P1**: Current round and queue determine what everyone needs to know; metadata and history are secondary.

**Acceptance Criteria**:

1. WHEN the page loads THEN the first content region SHALL combine table name, round state, current players, and viewer action into one hero/workflow area.
2. WHEN there are fewer than 2 participants THEN the current-round state SHALL use concise waiting copy and keep `Entrar na fila` available for eligible tenant users.
3. WHEN the queue has waiting players THEN the queue SHALL render as a compact ordered list with position, player identity, and optional admin remove action.
4. WHEN the queue is empty THEN the empty state SHALL not duplicate join instructions already present in the primary action area.
5. WHEN long player names, emails, or table names render THEN rows and controls SHALL truncate, wrap, or break intentionally with `min-w-0` where needed.

**Independent Test**: View empty, one-player, two-player, and long-queue states at 375px and 1280px with no horizontal overflow or unclear action hierarchy.

---

### P1: Remove Low-Value Default Content

**User Story**: As a player, I want table pages to hide operational clutter until needed so that the page is fast to scan during play.

**Why P1**: The existing metadata band, admin entry block, invitation controls, and history table all appear as equal-weight page content.

**Acceptance Criteria**:

1. WHEN table metadata is shown THEN it SHALL be limited to information that supports the immediate workflow; creator and created date SHALL move out of the default high-priority area or be removed.
2. WHEN recent matches exist THEN the page SHALL show a compact recent result summary by default and MAY provide a secondary expansion or lower-priority history table.
3. WHEN there are no recent matches THEN the page SHALL avoid a large empty history region.
4. WHEN admin-only round controls render THEN they SHALL stay attached to the current round or recent result they affect.
5. WHEN table entry controls are considered THEN manual add and invite generation SHALL be absent from table detail because same-tenant users can self-join.

**Independent Test**: On a populated table, the first viewport shows current round, queue status, and next player action before creator metadata or full history; no manual add or invite controls render.

---

### P2: Easier Admin Controls

**User Story**: As an admin, I want management controls to stay available but less distracting so that player workflow remains clear while admin work remains efficient.

**Why P2**: Admins still need finish, rollback, and remove actions, but entry management is no longer needed after direct tenant self-join.

**Acceptance Criteria**:

1. WHEN an admin views an active round THEN `Encerrar rodada` SHALL remain near current players but use clear destructive/confirming flow for irreversible score changes.
2. WHEN choosing a winner THEN the dialog SHALL show both player identities, rankings, and a clear consequence that Elo and queue order will change.
3. WHEN an admin removes a queued participant THEN the control SHALL identify the affected row and avoid accidental taps on mobile.
4. WHEN a same-tenant user needs to enter a table THEN admins SHALL NOT need manual add or invite controls on this page.
5. WHEN invitation or membership management is needed for another workflow THEN it SHALL live outside the table play page.

**Independent Test**: Admin can finish a match, remove a waiting player, and rollback a result; manual add and invite controls are not present on table detail.

---

### P2: Navigation And Secondary Views

**User Story**: As a user, I want clear navigation back to table list and forward to scoreboard views so that moving through table workflows feels predictable.

**Why P2**: The current page relies mostly on route context and buttons inside regions; navigation can be clearer.

**Acceptance Criteria**:

1. WHEN a user opens table detail THEN there SHALL be an obvious route back to `/tables`.
2. WHEN `Abrir placar` or `Controles` are shown THEN they SHALL use `Link` navigation and preserve browser open-in-new-tab behavior.
3. WHEN secondary content uses disclosure, tabs, or segmented controls THEN state SHALL be URL-addressable if the state meaningfully changes the view.
4. WHEN mobile layout stacks navigation and actions THEN primary queue action SHALL remain reachable without scrolling through history or round-admin controls.

**Independent Test**: Keyboard and touch navigation can move from table list to detail, join queue, open scoreboard, return to list, and revisit via browser history.

---

### P2: Accessibility And Visual Quality Guardrails

**User Story**: As a keyboard, screen-reader, or mobile user, I want the simplified page to remain accessible and robust so that simplification does not remove essential affordances.

**Why P2**: Removing content and reshaping controls can easily damage labels, focus order, or responsive layout.

**Acceptance Criteria**:

1. WHEN icon-only controls are introduced THEN they SHALL include `aria-label`; decorative icons SHALL use `aria-hidden="true"`.
2. WHEN round-admin controls remain THEN each control SHALL use native buttons or dialogs with accessible labels.
3. WHEN buttons, links, selects, and dialog triggers receive keyboard focus THEN visible focus states SHALL be present.
4. WHEN async results occur THEN success and error messages SHALL be announced through existing toast behavior and controls SHALL expose pending state.
5. WHEN layout animates or transitions THEN it SHALL avoid `transition: all` and honor reduced-motion patterns already used in the app.

**Independent Test**: Web design review of touched files reports no missing labels, icon-button labels, hidden focus, text overflow, or action/navigation semantic violations.

---

## Current Evidence

| Surface              | Evidence                                                                                                                                                            | Direction                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Table page wrapper   | `app/(app)/tables/[tableId]/page.tsx` describes many concerns at once: round, queue, invites, history                                                               | Narrow page description to the table play workflow                                                                |
| Table detail UI      | `components/tables/table-detail.tsx` renders current round, queue, metadata stats, viewer participation, admin entry, invite link, and history as separate sections | Collapse into primary workflow plus secondary management/history                                                  |
| Join API             | `app/api/tables/[tableId]/queue/route.ts` calls `enqueueUserInTable` and returns `user_not_in_table` for non-members                                                | Auto-create membership for same-tenant users before enqueue or change domain use case to allow direct tenant join |
| Domain guard         | `lib/contexts/table-play/index.ts` requires an existing `PingPongTableMember` before queue insert                                                                   | Preserve tenant/table validation but remove manual membership prerequisite for queue join                         |
| Detail query         | `lib/tables/queries.ts` computes `viewerIsMember` separately from `viewerIsQueued`                                                                                  | Update UI types/state so tenant eligibility is not confused with table membership                                 |
| Existing design spec | `.specs/features/remove-card-ui-pattern/spec.md` already rejects card stacks and nested framed page regions                                                         | Keep no-card layout and avoid replacing removed content with new generic panels                                   |

## Data And Permission Rules

| Actor State                                      | Page Access                   | Join Queue                            | Leave Queue                              | Admin Controls      |
| ------------------------------------------------ | ----------------------------- | ------------------------------------- | ---------------------------------------- | ------------------- |
| Same-tenant authenticated user, not table member | Allowed                       | Allowed; creates membership if needed | Not applicable until queued              | Hidden              |
| Same-tenant table member                         | Allowed                       | Allowed if not queued                 | Allowed if queued and not current player | Hidden unless admin |
| Same-tenant admin                                | Allowed                       | Same as user                          | Same as user                             | Visible             |
| Cross-tenant authenticated user                  | Not found/forbidden           | Denied                                | Denied                                   | Hidden/denied       |
| Unauthenticated user                             | Redirect/login or 401 for API | 401                                   | 401                                      | Hidden/denied       |

## Edge Cases

- WHEN the first tenant user joins an empty table THEN they SHALL become queue position `#1` and the current round SHALL still show waiting for one more player.
- WHEN a second tenant user joins THEN the current round SHALL become active without requiring admin intervention.
- WHEN current players try to leave queue THEN existing `current_player_cannot_leave_queue` behavior SHALL remain.
- WHEN legacy admin membership exists before this change THEN duplicate membership SHALL not fail the join path.
- WHEN a user is already queued THEN duplicate participant guard SHALL remain.
- WHEN invite link is used by an already authenticated same-tenant user THEN behavior SHALL remain compatible with direct join/membership rules.
- WHEN invitation link is used by a different-tenant user THEN tenant isolation rules SHALL reject the join.
- WHEN queue has many users THEN list density SHALL remain usable; consider truncating default display and linking/disclosing full queue if needed.
- WHEN recent match history has many entries THEN default detail page SHALL not push primary queue controls below a long table.
- WHEN names/emails/URLs are very long THEN layout SHALL avoid horizontal scroll except inside intentional data-table overflow containers.
- WHEN admin actions fail due to stale state THEN copy SHALL tell the user to refresh or show current state after `router.refresh()`.

## Requirement Traceability

| Requirement ID | Story                                           | Status           |
| -------------- | ----------------------------------------------- | ---------------- |
| TDS-01         | P1: Tenant User Can Join Table Directly         | Implemented      |
| TDS-02         | P1: Single Primary Action Area                  | Implemented (UI) |
| TDS-03         | P1: Current Round First, Queue Second           | Implemented (UI) |
| TDS-04         | P1: Remove Low-Value Default Content            | Implemented (UI) |
| TDS-05         | P2: Easier Admin Controls                       | Implemented (UI) |
| TDS-06         | P2: Navigation And Secondary Views              | Implemented (UI) |
| TDS-07         | P2: Accessibility And Visual Quality Guardrails | Implemented (UI) |

Coverage: 7 total, 7 implemented, 0 unmapped.

## Success Criteria

- [x] Same-tenant user with no existing table membership can open `/tables/[tableId]` and join queue.
- [x] Cross-tenant attempts to read or join a table still fail.
- [x] First viewport on desktop and mobile prioritizes current round, queue state, and one next action.
- [x] Creator/date metadata and full history no longer compete with player workflow; invite controls and manual add are absent from table detail.
- [x] Admin can still finish rounds, rollback matches, and remove queued users.
- [x] Touched UI passes keyboard, focus, mobile overflow, and long-content review.
- [x] Unit/route tests cover direct tenant join, duplicate queue join, cross-tenant denial, and current-player leave denial.
- [x] `pnpm test`, `pnpm lint`, and `pnpm build` pass after implementation.
