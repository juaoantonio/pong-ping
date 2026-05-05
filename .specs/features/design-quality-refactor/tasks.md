# Design Quality Audit & Refactor Tasks

**Design**: `.specs/features/design-quality-refactor/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Audit Foundation (Sequential)

```
T1 -> T2 -> T3
```

### Phase 2: Shared Foundations (Sequential)

```
T3 -> T4 -> T5 -> T6
```

### Phase 3: Core User Flows (Parallel After T6)

```
       ┌-> T7 ─┐
T6 ----├-> T8 ─┼-> T11
       └-> T9 ─┘
```

### Phase 4: Secondary Flows and Verification

```
T11 -> T10 -> T12 -> T13
```

---

## Task Breakdown

### T1: Create Design Audit Report Template

**What**: Create `.specs/features/design-quality-refactor/audit.md` with finding schema, route inventory, severity model, and requirement mapping table.
**Where**: `.specs/features/design-quality-refactor/audit.md`
**Depends on**: None
**Reuses**: `.specs/features/design-quality-refactor/spec.md`
**Requirement**: DQR-01

**Tools**:

- MCP: filesystem
- Skill: `web-design-guidelines`

**Done when**:

- [ ] Report has sections for accessibility, layout, responsive, visual identity, interaction, content, and performance-sensitive UI.
- [ ] Report includes route checklist for `/`, `/tables`, table detail, scoreboard, scoreboard controls, admin, login, and invites.
- [ ] Report includes fields for severity, viewport, file/line, evidence, and recommended fix.

**Commit**: `docs(design): add design audit report template`

---

### T2: Run Code-Level Web Interface Audit

**What**: Review UI files against Web Interface Guidelines and record findings with file/line references.
**Where**: `app/**/*.tsx`, `components/**/*.tsx`, `.specs/features/design-quality-refactor/audit.md`
**Depends on**: T1
**Reuses**: `/home/stage3/.codex/skills/web-design-guidelines/references/guideline.md`
**Requirement**: DQR-01

**Tools**:

- MCP: filesystem
- Skill: `web-design-guidelines`

**Done when**:

- [ ] Findings identify guideline violations and likely UX risks.
- [ ] Duplicate issues are grouped by root cause.
- [ ] P1 findings are mapped to DQR requirements.

**Commit**: `docs(design): record interface guideline audit`

---

### T3: Run Browser Visual Audit

**What**: Start the app, inspect key routes at desktop and mobile widths, and add visual findings to the audit.
**Where**: `.specs/features/design-quality-refactor/audit.md`
**Depends on**: T2
**Reuses**: Existing routes and seeded/dev data
**Requirement**: DQR-01

**Tools**:

- MCP: filesystem/browser tooling available in session
- Skill: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] `/`, `/tables`, table detail, scoreboard, scoreboard controls, `/admin/users`, `/login`, and invite pages are visually checked or explicitly marked blocked.
- [ ] Mobile and desktop findings are separated where behavior differs.
- [ ] Screenshots or reproducible route/viewport notes exist for visual-only findings.

**Commit**: `docs(design): record browser visual audit`

---

### T4: Refactor Global Tokens

**What**: Update global design tokens for color, radius, shadow, typography hierarchy support, safe tap behavior, and dark-mode metadata without breaking shadcn variables.
**Where**: `app/globals.css`, `app/layout.tsx`
**Depends on**: T3
**Reuses**: Existing Tailwind 4 CSS variable setup
**Requirement**: DQR-02, DQR-08

**Tools**:

- MCP: filesystem, Context7 if implementation needs current Tailwind/shadcn API details
- Skill: `frontend-design`

**Done when**:

- [ ] Tokens support a cohesive sport-console palette with accessible contrast.
- [ ] `color-scheme` and theme color behavior are handled.
- [ ] Generic shadow/radius usage is reduced or made intentional.
- [ ] No component primitive contract breaks.

**Commit**: `style(ui): refresh global design tokens`

---

### T5: Add Shared Page Shell and Accessibility Baseline

**What**: Add or refactor shared shell patterns for skip link, main region, page headers, action placement, and consistent content gutters.
**Where**: `components/app-layout.tsx`, optional `components/page-shell.tsx`, affected pages using the shell
**Depends on**: T4
**Reuses**: `AppLayout`, `AppBreadcrumbs`, `SidebarProvider`, shadcn primitives
**Requirement**: DQR-02

**Tools**:

- MCP: filesystem
- Skill: `web-design-guidelines`

**Done when**:

- [ ] Authenticated pages have a clear main landmark and skip path.
- [ ] Page title/action structure is reusable and responsive.
- [ ] Existing sidebar/auth behavior is preserved.
- [ ] Keyboard focus remains visible through layout controls.

**Commit**: `feat(ui): add shared page shell baseline`

---

### T6: Normalize Shared Data and Empty-State Patterns

**What**: Create reusable patterns for empty states, stat rows, action groups, table/list responsive wrappers, and destructive action styling.
**Where**: `components/*`, `components/tables/*`, `components/ui/*` as needed
**Depends on**: T5
**Reuses**: `Card`, `Table`, `Button`, `Badge`, `PaginationControls`
**Requirement**: DQR-02, DQR-04, DQR-06

**Tools**:

- MCP: filesystem
- Skill: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] Empty states share tone and layout.
- [ ] Destructive actions use consistent destructive styling and confirmation strategy.
- [ ] Long text has `min-w-0`, truncate, wrap, or break behavior where needed.
- [ ] Reusable patterns reduce route-level duplication.

**Commit**: `feat(ui): standardize shared data states`

---

### T7: Refactor Public Ranking

**What**: Improve `/` ranking presentation with clearer hierarchy, responsive ranking rows/cards, tenant identity, empty state, and preserved pagination.
**Where**: `app/page.tsx`, optional `components/rankings/*`, `components/pagination-controls.tsx` if needed
**Depends on**: T6
**Reuses**: `getPublicRankings`, `PaginationControls`, `Badge`, `UserAvatar`
**Requirement**: DQR-03, DQR-08

**Tools**:

- MCP: filesystem
- Skill: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] Ranking is readable at 375px without horizontal overflow.
- [ ] Desktop hierarchy makes top players and ranking metrics easier to scan.
- [ ] Empty state has useful next-step copy.
- [ ] URL pagination behavior is unchanged.

**Commit**: `feat(ranking): improve public ranking layout`

---

### T8: Refactor Tables List and Detail Flow

**What**: Rework table list/detail structure around current match, queue, participation, admin entry, and history regions.
**Where**: `components/tables/table-list.tsx`, `components/tables/table-detail.tsx`, optional extracted table subcomponents
**Depends on**: T6
**Reuses**: Current API handlers, table DTOs, `UserAvatar`, `InvitationSettingsControls`
**Requirement**: DQR-04

**Tools**:

- MCP: filesystem
- Skill: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] Table list primary actions and current players are visually clear.
- [ ] Table detail avoids equal-weight card stacking for unrelated workflows.
- [ ] Admin actions are separated from player actions.
- [ ] Long names/emails/invite URLs do not overflow.
- [ ] Existing table tests still pass or are updated only for intentional markup changes.

**Commit**: `feat(tables): clarify table workflow layout`

---

### T9: Refactor Scoreboard and Player Controls

**What**: Improve display scoreboard and mobile controls while preserving realtime state and scoring functions.
**Where**: `components/scoreboard/realtime-scoreboard.tsx`, `components/scoreboard/scoreboard-controls.tsx`
**Depends on**: T6
**Reuses**: `lib/contexts/scoreboard`, Firebase transaction flow, existing tests
**Requirement**: DQR-05, DQR-08

**Tools**:

- MCP: filesystem
- Skill: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] Display scoreboard is readable on desktop/shared-screen dimensions.
- [ ] Player controls have large, stable touch targets on phone widths.
- [ ] Loading/disabled/fullscreen states are clear.
- [ ] Scoreboard unit/component tests pass.

**Commit**: `feat(scoreboard): improve match display and controls`

---

### T10: Refactor Admin and Onboarding Screens

**What**: Apply shared patterns to admin data screens, login, and invitation flows.
**Where**: `app/admin/**/*.tsx`, `app/login/page.tsx`, `app/invite/[token]/*`, `app/table-invite/[token]/*`
**Depends on**: T7, T8, T9
**Reuses**: Shared shell/data/empty-state patterns
**Requirement**: DQR-06, DQR-07

**Tools**:

- MCP: filesystem
- Skill: `frontend-design`, `web-design-guidelines`

**Done when**:

- [ ] Admin row actions and pending states are clear and safe.
- [ ] Login/invite forms have labels, autocomplete/name metadata, accessible error recovery, and polished copy.
- [ ] Admin tables remain usable on mobile or degrade into a deliberate responsive pattern.

**Commit**: `feat(admin): refine admin and access screens`

---

### T11: Update Tests for Intentional Markup Changes

**What**: Update or add focused tests that assert behavior and accessibility affordances affected by the refactor.
**Where**: `__tests__/unit/**/*.test.tsx`
**Depends on**: T7, T8, T9
**Reuses**: Existing React Testing Library and Jest setup
**Requirement**: DQR-02, DQR-03, DQR-04, DQR-05

**Tools**:

- MCP: filesystem
- Skill: `web-design-guidelines`

**Done when**:

- [ ] Tests cover pagination behavior after ranking/table refactor.
- [ ] Tests cover scoreboard controls after presentation refactor.
- [ ] Tests avoid brittle snapshot-only assertions.
- [ ] `pnpm test` passes.

**Commit**: `test(ui): cover refactored design behavior`

---

### T12: Full Verification Pass

**What**: Run static, unit, build, keyboard, and responsive browser verification; record results.
**Where**: `.specs/features/design-quality-refactor/implementation-summary.md`
**Depends on**: T10, T11
**Reuses**: Existing scripts in `package.json`
**Requirement**: DQR-01 through DQR-08

**Tools**:

- MCP: filesystem/browser tooling available in session
- Skill: `web-design-guidelines`

**Done when**:

- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] Mobile and desktop browser checks are recorded.
- [ ] Remaining known issues are documented with severity and rationale.

**Commit**: `docs(design): record refactor verification`

---

### T13: Final Requirement Traceability Update

**What**: Update spec statuses, audit mappings, task completion, and implementation summary.
**Where**: `.specs/features/design-quality-refactor/*.md`
**Depends on**: T12
**Reuses**: Existing spec workflow
**Requirement**: DQR-01 through DQR-08

**Tools**:

- MCP: filesystem
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Requirement table statuses reflect completed/remaining work.
- [ ] Every completed task maps to audit findings and DQR IDs.
- [ ] Deferred work is explicit and not hidden as complete.

**Commit**: `docs(design): close design refactor plan`

---

## Parallel Execution Map

```
Phase 1:
  T1 -> T2 -> T3

Phase 2:
  T4 -> T5 -> T6

Phase 3:
  T6 complete, then:
    ├── T7 Public Ranking [P]
    ├── T8 Tables Flow [P]
    └── T9 Scoreboard [P]

Phase 4:
  T7/T8/T9 -> T11
  T11 -> T10 -> T12 -> T13
```

## Task Granularity Check

- Each implementation task owns a bounded surface or shared pattern.
- T7, T8, and T9 can be parallelized after shared foundations because they touch mostly disjoint files.
- T10 waits until core patterns settle to avoid repeating admin/onboarding work.
- T12 and T13 are verification/documentation only.

## Tooling Note Before Execution

Before implementation, confirm which browser verification tool is available in the session. Context7 should be used only if implementation needs current documentation for Next.js, Tailwind, shadcn/Radix, Firebase, or related library APIs.
