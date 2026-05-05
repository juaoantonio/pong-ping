# Login Page Design Refresh Tasks

**Spec**: `.specs/features/login-page-design-refresh/spec.md`
**Status**: Implemented

---

## Execution Plan

```text
T1 -> T2 -> T3 -> T4
```

## Task Breakdown

### T1: Align With Tenant Query Param Change

**What**: Use the login tenant query-param resolver from the companion spec and remove tenant editing from the design surface.
**Where**: `app/login/page.tsx`, `app/actions/auth.ts`
**Depends on**: `.specs/features/login-tenant-query-param/tasks.md`
**Requirement**: LPDR-001, LPDR-004

**Done when**:

- [x] Login page receives resolved tenant context from URL/default.
- [x] Tenant is displayed read-only or omitted when unavailable.
- [x] No duplicate tenant state exists between UI and Server Action.

**Gate**: companion spec tests pass

### T2: Redesign Login Composition

**What**: Replace generic centered card with a responsive auth composition using existing tokens and concise tenant-aware copy.
**Where**: `app/login/page.tsx`
**Depends on**: T1
**Requirement**: LPDR-001, LPDR-003

**Done when**:

- [x] Desktop layout has clear hierarchy and avoids nested cards.
- [x] Mobile layout remains single-column with stable spacing.
- [x] Typography uses existing `font-display`/`font-sans` tokens.
- [x] Palette uses existing court-green/ink/accent tokens.
- [x] No purple gradients, glassmorphism, decorative orb backgrounds, or oversized marketing hero.

**Gate**: visual review at 375px and 1280px

### T3: Improve Error and Action States

**What**: Make error messages actionable and ensure the Google sign-in action has accessible focus/pending behavior.
**Where**: `app/login/page.tsx`, optional small client submit button component
**Depends on**: T2
**Requirement**: LPDR-001, LPDR-002, LPDR-004

**Done when**:

- [x] Errors stay near the action and use `aria-live="polite"`.
- [x] Copy tells user what to do next.
- [x] Button focus is visible.
- [x] Loading/pending state does not shift layout if client enhancement is used.
- [x] Form still works as progressive-enhancement Server Action.

**Gate**: Web Interface Guidelines audit for `/login`

### T4: Verify Design and Auth Regression

**What**: Run automated checks and manual visual/accessibility pass.
**Where**: `/login`, tests
**Depends on**: T3
**Requirement**: LPDR-001 through LPDR-004

**Done when**:

- [x] `/login`, `/login?tenant=default`, `/login?tenant=missing`, and error states are checked.
- [x] 375px, 768px, and 1280px viewports have no overflow.
- [x] Keyboard tab order reaches the login button and visible focus appears.
- [x] Existing auth and multitenancy tests pass.

**Gate**: `pnpm lint`, `pnpm test`, `pnpm build`
