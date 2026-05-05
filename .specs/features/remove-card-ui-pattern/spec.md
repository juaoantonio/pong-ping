# Remove Card-Based UI Pattern Specification

## Problem Statement

The frontend still uses card-as-section composition across public ranking, app pages, admin screens, auth/invite flows, skeletons, and table workflows. This makes unrelated page regions look equal, creates nested visual boxes, and keeps the product close to a default shadcn/admin-template look. The app needs a deliberate no-card-first layout system: full-width sections, bands, rows, lists, tables, and tool surfaces should replace generic cards while preserving current behavior.

## Goals

- [x] Remove `Card` imports and `Card*` composition from primary route/page implementations.
- [x] Replace card-as-section layouts with page regions, split panes, bands, data rows, list items, and tool surfaces.
- [x] Keep cards only where they are the right semantic pattern: repeated item previews, modal/dialog content, compact tools, and intentionally framed widgets.
- [x] Remove nested card-like boxes and generic `rounded-lg border bg-card shadow-*` section wrappers from high-traffic UI.
- [x] Preserve existing routes, permissions, data loading, auth, pagination, table actions, and realtime scoreboard behavior.
- [ ] Verify desktop/mobile layouts with no text overflow, no incoherent overlaps, and no hidden critical actions.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Business logic changes | This feature changes presentation patterns only. |
| Database or API contract changes | UI composition can change without persistence changes. |
| Full brand redesign | This removes card dependency; broader color/type identity belongs to design-quality work. |
| Replacing Radix/shadcn primitives globally | Accessible primitives should stay; only card-driven composition is targeted. |
| Removing all borders or all rounded corners | Borders can still define tables, forms, separators, controls, and compact tools. |
| Modal/dialog redesign | Dialogs may remain framed surfaces because that is their expected pattern. |

---

## User Stories

### P1: Shared No-Card Layout Foundation ⭐ MVP

**User Story**: As a maintainer, I want a shared no-card page composition system so that route refactors do not re-create one-off wrappers.

**Why P1**: The current `Card` component is used as the default layout building block. A shared replacement must land first or every page will invent its own section style.

**Acceptance Criteria**:

1. WHEN a route needs a top-level content region THEN the system SHALL use `PageShell`, section headers, separators, bands, grids, or flow layouts instead of `Card`.
2. WHEN a section needs visual grouping THEN the system SHALL prefer spacing, headings, dividers, background bands, table/list structure, or inline toolbars over `rounded-lg border bg-card shadow-*`.
3. WHEN a repeated item or compact tool truly needs containment THEN the system SHALL document that use as an allowed exception and avoid nesting another framed surface inside it.
4. WHEN skeleton/loading states render THEN they SHALL mirror the new no-card layout instead of using `CardTableSkeleton` or card stacks.
5. WHEN implementation is complete THEN `components/ui/card.tsx` SHALL have no imports from primary route/page code unless each use is listed as an exception.

**Independent Test**: Code search for `from "@/components/ui/card"` and `rounded-lg border bg-card` shows no unapproved primary page usage.

---

### P1: Public Ranking Without Cards

**User Story**: As a public viewer, I want ranking content to read as a scoreboard/list experience instead of a stack of generic cards so that standings feel authoritative and easy to scan.

**Why P1**: `/` is the first public screen and currently uses card-like podium items, a card-wrapped table, and mobile mini-cards.

**Acceptance Criteria**:

1. WHEN `/` renders rankings THEN podium/top players SHALL use a ranking band, leaderboard strip, or list-row treatment instead of separate card boxes.
2. WHEN desktop ranking table renders THEN the table SHALL sit in the page flow with a header/toolbar and separators, not inside `rounded-lg border bg-card shadow-sm`.
3. WHEN mobile ranking renders THEN each player SHALL appear as stable list rows or divided groups, not miniature bordered cards.
4. WHEN rankings are empty THEN `EmptyState` SHALL avoid card-like framing unless it is restyled as a dashed/inline state consistent with no-card layout.
5. WHEN pagination renders THEN it SHALL remain URL-addressable, keyboard reachable, and visually attached to the ranking flow.

**Independent Test**: Visual review of `/` at 375px and 1280px confirms no card grid/table wrapper pattern and no horizontal overflow.

---

### P1: Table Management Workflow Without Card Stacks

**User Story**: As a player or admin, I want table pages to show current match, queue, participation, invites, and history as distinct workflow regions so that I do not scan many equal-weight cards.

**Why P1**: `components/tables/table-list.tsx` and `components/tables/table-detail.tsx` are core app surfaces and currently use many `Card` sections plus nested bordered panels.

**Acceptance Criteria**:

1. WHEN `/tables` renders THEN table summaries SHALL use a dense list, split row, or board layout with clear primary action hierarchy instead of one card per table.
2. WHEN `/tables/[tableId]` renders THEN current match, queue, viewer participation, admin entry, and recent rounds SHALL be arranged as workflow regions with headings and dividers rather than stacked cards.
3. WHEN a table region needs local grouping THEN it SHALL use inline grouping, table/list rows, fieldsets, or a purpose-built tool surface with no card nesting.
4. WHEN long names, emails, or table names render THEN text SHALL truncate, wrap, or break intentionally without expanding controls or overlapping nearby content.
5. WHEN destructive or admin-only actions render THEN action hierarchy SHALL remain clearer after card removal.

**Independent Test**: `/tables` and one table detail route pass mobile/desktop visual review for member, admin, empty queue, and active match states.

---

### P1: Auth, Invite, Profile, and Admin Page Migration

**User Story**: As a user moving through secondary flows, I want auth, invite, profile, and admin pages to share the same no-card design language so that the app feels coherent.

**Why P1**: These routes still import `Card` for simple page bodies and would make the product feel partially migrated.

**Acceptance Criteria**:

1. WHEN `/login`, `/invite/[token]`, `/table-invite/[token]`, `/unauthorized`, and `/profile` render THEN page body content SHALL not be centered generic cards.
2. WHEN `/admin/users`, `/admin/access`, `/admin/tenants`, and `/admin/rounds` render THEN admin data controls SHALL use page headers, toolbars, tables, forms, and empty states without a card wrapper.
3. WHEN forms need grouping THEN the system SHALL use form sections, fieldsets, labels, helper text, and separators rather than card containers.
4. WHEN access denied or invite error states render THEN they SHALL use clear inline states with action recovery, not a card shell.
5. WHEN routes are loading THEN loading skeletons SHALL match final region/table/list structure.

**Independent Test**: Code search and browser review confirm listed routes render without `Card` imports or generic card wrappers.

---

### P2: Card Component De-Emphasis and Exceptions

**User Story**: As a maintainer, I want the codebase to make card use intentionally rare so future UI work does not regress into card-first design.

**Why P2**: Removing existing uses is not enough if the primitive remains the path of least resistance.

**Acceptance Criteria**:

1. WHEN card exceptions remain THEN they SHALL be documented in this spec or a follow-up design note with route, purpose, and reason.
2. WHEN `components/ui/card.tsx` remains in the codebase THEN it SHALL be treated as a low-level primitive, not exported or used from broad layout patterns.
3. WHEN new no-card wrappers are needed THEN they SHALL be named by purpose (`Leaderboard`, `WorkflowRegion`, `AdminToolbar`, `FormSection`) instead of generic `Panel`/`Card` naming.
4. WHEN lint/code review runs manually THEN reviewers SHALL search for `Card`, `bg-card`, `shadow-sm`, and repeated `rounded-lg border` page sections.

**Independent Test**: A short exception list exists and all remaining card-like uses map to allowed purposes.

---

### P2: Visual Quality Guardrails

**User Story**: As a product owner, I want the new layout language to avoid generic AI UI patterns while staying practical for a sports operations app.

**Why P2**: Card removal can expose weak spacing or lead to different generic boxes unless visual rules are explicit.

**Acceptance Criteria**:

1. WHEN a new layout is implemented THEN it SHALL use visual rhythm through spacing, dividers, bands, table density, and asymmetric alignment instead of repeated equal boxes.
2. WHEN page sections are adjacent THEN headings, separators, and whitespace SHALL make hierarchy obvious without wrapping each section.
3. WHEN icons are used THEN they SHALL support actions/status and not appear as decorative icon stacks above headings.
4. WHEN colors are used THEN they SHALL come from existing tokens unless a design-quality spec explicitly changes them.
5. WHEN responsive layouts adapt THEN they SHALL preserve critical actions and avoid hiding functionality on mobile.

**Independent Test**: Visual review rejects any page that still reads as repeated card grid, card-in-card, or generic rounded rectangle UI.

---

## Current Evidence

| Surface | Evidence | Migration Direction |
| --- | --- | --- |
| Public ranking | `app/page.tsx` uses `rounded-lg border bg-card shadow-sm` for podium/table/mobile rows | Replace with leaderboard band, table flow, and divided mobile list |
| Table list | `components/tables/table-list.tsx` imports `Card`, `CardHeader`, `CardContent`, `CardAction` | Replace with table-board/list rows and inline action zones |
| Table detail | `components/tables/table-detail.tsx` imports all card parts and stacks many sections | Replace with workflow regions and current-match-first layout |
| Skeletons | `components/page-skeletons.tsx` imports `Card` and creates card stacks | Create region/table/list skeletons matching new layouts |
| Auth/invite/error | `app/invite/[token]/page.tsx`, `app/table-invite/[token]/page.tsx`, `app/unauthorized/page.tsx` use centered cards | Replace with focused inline auth/invite states |
| Profile | `app/(app)/profile/page.tsx` uses two cards for edit/profile info | Replace with form/info sections under one page flow |
| Admin routes | `app/admin/*/page.tsx` wrap admin content in cards | Replace with admin headers, toolbars, data regions, and empty states |
| Primitive | `components/ui/card.tsx` defines default `rounded-xl border bg-card shadow-sm` look | Keep only as explicit exception or remove after migration |

## Allowed Card-Like Exceptions

| Exception | Allowed Use | Constraints |
| --- | --- | --- |
| Dialog/modal surface | Radix dialog content and destructive confirmations | Not used as page layout |
| Compact interactive tool | Score controls, invite copy tool, focused form control group | Must be purpose-built, not named/generic Card |
| Repeated item preview | Optional for truly standalone repeated items | No nested framed child boxes; must justify why row/table/list is worse |
| Toast/popover/dropdown | Overlay surfaces | Existing component semantics stay |

## Edge Cases

- WHEN a page has only one small message THEN it SHALL still avoid a centered generic card and use inline empty/error state composition.
- WHEN a list has one item THEN it SHALL keep list/row styling rather than switching to a card.
- WHEN a mobile view stacks regions THEN spacing and separators SHALL keep regions distinct without card borders.
- WHEN old and new layouts coexist during implementation THEN touched routes SHALL not mix card and no-card patterns in the same hierarchy.
- WHEN text is long or translated labels grow THEN no region SHALL rely on fixed card widths that cause overflow.
- WHEN dark mode renders THEN section hierarchy SHALL remain clear without shadows as the main separator.
- WHEN the scoreboard uses strong panel styling THEN it SHALL be evaluated separately as a display/control tool, not automatically treated as a banned generic card.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| NCUI-01 | P1: Shared No-Card Layout Foundation | Execute | Verified |
| NCUI-02 | P1: Public Ranking Without Cards | Execute | Verified |
| NCUI-03 | P1: Table Management Workflow Without Card Stacks | Execute | Verified |
| NCUI-04 | P1: Auth, Invite, Profile, and Admin Page Migration | Execute | Verified |
| NCUI-05 | P2: Card Component De-Emphasis and Exceptions | Execute | Verified |
| NCUI-06 | P2: Visual Quality Guardrails | Execute | Verified |

Coverage: 6 total, 6 implemented, 0 unmapped.

## Success Criteria

- [x] `rg 'from "@/components/ui/card"' app components` returns no unapproved route/page imports.
- [x] `rg 'rounded-(md|lg|xl).*border.*bg-card|bg-card.*border|shadow-sm' app components` returns no unapproved card-as-section wrappers.
- [ ] Primary routes (`/`, `/tables`, one table detail, `/login`, `/profile`, one admin route, invite/error routes) pass desktop and mobile visual review.
- [x] No page uses cards inside cards or repeated equal card grids for workflow content.
- [x] Loading, empty, error, and permission states match the new no-card structure.
- [x] `pnpm lint`, `pnpm test`, and `pnpm build` pass after implementation.
