# Design Quality Audit & Refactor Specification

## Problem Statement

The current app is functional, but the interface is visually generic and operationally uneven across public ranking, authenticated table management, admin screens, and live scoreboard flows. The app needs an evidence-based design audit followed by a focused refactor plan that improves usability, accessibility, responsive behavior, and visual cohesion without changing business behavior.

This feature creates the plan for analyzing design flaws and implementing the refactor in traceable phases.

## Goals

- [ ] Produce a page-by-page design flaw audit with file/line evidence and severity.
- [ ] Define a cohesive product design direction for a table-tennis ranking and match-management app.
- [ ] Refactor shared layout, tokens, and UI patterns before touching individual pages.
- [ ] Improve the high-traffic surfaces: public ranking, tables list/detail, scoreboard, login/invite, and admin tables.
- [ ] Preserve current routes, permissions, API contracts, pagination behavior, and realtime scoreboard behavior.
- [ ] Verify the refactor with automated checks and visual/browser review on desktop and mobile.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Business logic changes | This is a design and interaction refactor, not a domain behavior change. |
| Database schema changes | No persistence model change is needed for UI quality. |
| Authentication provider changes | Login UX can be improved without changing NextAuth/Google behavior. |
| Full design system package extraction | Reusable patterns should stay inside the app until duplication proves package extraction worthwhile. |
| Marketing landing page | The first screen should remain the actual ranking/product experience, not a marketing page. |
| New realtime scoreboard rules | Scoreboard interaction quality can improve while point/set logic remains unchanged. |

---

## User Stories

### P1: Evidence-Based Design Flaw Audit ⭐ MVP

**User Story**: As a maintainer, I want a structured design audit so that refactor work targets verified flaws instead of subjective preference.

**Why P1**: Refactoring without an audit risks polishing isolated screens while leaving systemic usability and accessibility issues intact.

**Acceptance Criteria**:

1. WHEN the audit is run THEN the system SHALL review public, authenticated, admin, invite/login, and scoreboard flows.
2. WHEN a flaw is recorded THEN it SHALL include file path, line number when available, severity, affected viewport, guideline category, and recommended fix direction.
3. WHEN a flaw is visual rather than code-local THEN it SHALL include screenshot evidence or a reproducible viewport/route note.
4. WHEN duplicate issues share a root cause THEN the audit SHALL group them under a reusable pattern or token concern.
5. WHEN the audit is complete THEN every P1 implementation task SHALL map to at least one audit finding.

**Independent Test**: An audit report exists with prioritized findings and clear mappings from flaws to refactor tasks.

---

### P1: Shared Layout & Navigation Baseline

**User Story**: As an authenticated user, I want app navigation, page structure, focus behavior, and spacing to feel consistent so that moving between ranking, tables, profile, and admin screens does not require relearning the interface.

**Why P1**: Shared layout flaws multiply across nearly every authenticated page.

**Acceptance Criteria**:

1. WHEN a user opens any app route THEN the page SHALL expose one logical main region and a skip-link/focus path.
2. WHEN a user navigates with keyboard THEN sidebar, breadcrumbs, page actions, and content controls SHALL have visible focus states.
3. WHEN the viewport changes from mobile to desktop THEN layout density SHALL adapt without hidden critical functionality.
4. WHEN shared spacing, radius, color, and typography are used THEN they SHALL come from a small set of documented tokens or utility patterns.
5. WHEN pages render loading or empty states THEN the states SHALL use consistent structure, tone, and action hierarchy.

**Independent Test**: Keyboard navigation and responsive smoke tests pass on `/`, `/tables`, one table detail route, and one admin route.

---

### P1: Public Ranking Refactor

**User Story**: As a public viewer, I want the ranking screen to be scannable, credible, and responsive so that I can understand player standings quickly.

**Why P1**: `/` is the app's public first impression and current ranking presentation is table-only, plain, and vulnerable to mobile overflow.

**Acceptance Criteria**:

1. WHEN rankings exist THEN the screen SHALL communicate tenant identity, ranking hierarchy, and primary stats without relying only on a dense table.
2. WHEN rankings are empty THEN the empty state SHALL explain the next useful action without looking broken.
3. WHEN viewed on mobile THEN ranking content SHALL remain readable without horizontal overflow.
4. WHEN ranking numbers, win rates, and dates are shown THEN formatting SHALL use locale-aware utilities and tabular numeric alignment where useful.
5. WHEN pagination is present THEN it SHALL remain URL-addressable and keyboard accessible.

**Independent Test**: `/` is visually reviewed at mobile and desktop widths with populated and empty ranking states.

---

### P1: Table Management Flow Refactor

**User Story**: As a player or admin, I want table list/detail screens to clearly show current match, queue state, available actions, and recent history so that I can act without scanning repeated cards.

**Why P1**: Table workflows are the core authenticated experience and currently have dense nested cards, repeated labels, and mixed action hierarchy.

**Acceptance Criteria**:

1. WHEN a table list is shown THEN current players, queue depth, latest match, and primary action SHALL be visually prioritized.
2. WHEN a table detail is shown THEN current match, viewer participation, queue, match history, and admin actions SHALL have distinct layout regions.
3. WHEN destructive actions are available THEN they SHALL use destructive styling and confirmation/undo behavior appropriate to risk.
4. WHEN user names/emails are long THEN cards, rows, and action groups SHALL not overflow or resize unpredictably.
5. WHEN the viewer has limited permissions THEN unavailable controls SHALL be absent or clearly disabled with accessible explanation.

**Independent Test**: `/tables` and `/tables/[tableId]` are reviewed for member, admin, and empty/low-participant states.

---

### P1: Scoreboard Experience Refactor

**User Story**: As a player or spectator, I want the live scoreboard and player controls to be readable at a distance and reliable under touch interaction so that match scoring feels intentional.

**Why P1**: Scoreboard screens are high-visibility, likely used on phones or shared displays, and have different visual rules than admin dashboards.

**Acceptance Criteria**:

1. WHEN the scoreboard opens with 2 players THEN player names, points, sets, and match state SHALL be readable from a shared-display distance.
2. WHEN the scoreboard has fewer than 2 players THEN the waiting state SHALL clearly explain the condition and preserve branded context.
3. WHEN a player uses controls on a phone THEN primary point actions SHALL be large, stable, and touch-safe.
4. WHEN controls are disabled/loading THEN the disabled state SHALL be visually obvious without layout shift.
5. WHEN fullscreen is toggled THEN state and controls SHALL remain accessible and not hide critical content.

**Independent Test**: Scoreboard and controls are reviewed on mobile portrait, desktop, and fullscreen-capable desktop.

---

### P2: Admin Data Screen Refactor

**User Story**: As an admin, I want user/access/tenant/round screens to support scanning, filtering context, and safe actions so that repeated maintenance work is efficient.

**Why P2**: Admin screens matter, but they can follow after the core public/table flows have a shared foundation.

**Acceptance Criteria**:

1. WHEN admin tables render many rows THEN columns SHALL stay readable and controls SHALL remain reachable on mobile.
2. WHEN role or access changes are pending THEN the affected row SHALL expose pending state without blocking unrelated rows unnecessarily.
3. WHEN destructive admin actions are present THEN confirmations SHALL name the target and consequence.
4. WHEN dates and counts render THEN they SHALL use shared locale formatting.

**Independent Test**: At least `/admin/users`, `/admin/access`, `/admin/tenants`, and `/admin/rounds` pass visual and keyboard review.

---

### P2: Form, Invite, and Login Polish

**User Story**: As a new or invited user, I want login and invitation flows to be clear, trustworthy, and recoverable so that access failures do not feel like dead ends.

**Why P2**: These flows are lower volume than tables, but they shape onboarding trust.

**Acceptance Criteria**:

1. WHEN a form field is shown THEN it SHALL have a meaningful label, name, autocomplete/input mode when applicable, and useful inline error copy.
2. WHEN an invitation link is copied THEN success/failure SHALL be announced accessibly.
3. WHEN login fails THEN the screen SHALL explain the next step in user-facing language.
4. WHEN the viewport is mobile THEN form controls SHALL remain comfortable and not be hidden by browser UI or safe-area constraints.

**Independent Test**: `/login`, `/invite/[token]`, and `/table-invite/[token]` are reviewed across success and error states.

---

### P3: Distinctive Visual Direction

**User Story**: As a product owner, I want the app to have a clear table-tennis identity so that it no longer feels like a default admin template.

**Why P3**: Distinctive polish matters, but it should follow structural accessibility and workflow fixes.

**Acceptance Criteria**:

1. WHEN visual tokens are updated THEN the palette SHALL avoid one-note neutral/orange repetition while preserving contrast.
2. WHEN typography is updated THEN the hierarchy SHALL remain readable and not depend on viewport-width font scaling.
3. WHEN decorative details are introduced THEN they SHALL reinforce table-tennis/ranking context and not impair density or scanning.
4. WHEN cards are used THEN they SHALL frame repeated items or tools, not every page section.

**Independent Test**: A before/after visual review shows a coherent product identity across ranking, tables, admin, and scoreboard.

---

## Edge Cases

- WHEN there are no rankings, no tables, no users, or no matches THEN empty states SHALL avoid broken spacing and provide the next meaningful action.
- WHEN names, emails, tenant names, or invitation URLs are unusually long THEN text SHALL truncate, wrap, or break intentionally.
- WHEN the user is keyboard-only THEN all actions SHALL be reachable and visible.
- WHEN the user prefers reduced motion THEN transitions SHALL be disabled or reduced.
- WHEN a route is viewed on a small phone width THEN critical actions SHALL remain available.
- WHEN realtime scoreboard updates arrive while controls are tapped THEN UI SHALL avoid layout shift and stale disabled states.
- WHEN admin permissions differ by role THEN action hierarchy SHALL not imply unavailable capabilities.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| DQR-01 | P1: Evidence-Based Design Flaw Audit | Pending |
| DQR-02 | P1: Shared Layout & Navigation Baseline | Pending |
| DQR-03 | P1: Public Ranking Refactor | Pending |
| DQR-04 | P1: Table Management Flow Refactor | Pending |
| DQR-05 | P1: Scoreboard Experience Refactor | Pending |
| DQR-06 | P2: Admin Data Screen Refactor | Pending |
| DQR-07 | P2: Form, Invite, and Login Polish | Pending |
| DQR-08 | P3: Distinctive Visual Direction | Pending |

Coverage: 8 total, 8 mapped to planned tasks, 0 unmapped.

## Success Criteria

- [ ] Audit report identifies concrete flaws with severity and route/file evidence.
- [ ] Refactor tasks map back to audit findings and requirement IDs.
- [ ] Shared layout and token changes land before route-specific polish.
- [ ] Public ranking, tables, and scoreboard flows pass desktop/mobile visual review.
- [ ] Admin and onboarding flows pass accessibility and responsive review.
- [ ] `pnpm lint`, `pnpm test`, and `pnpm build` pass after implementation.
