# Tenant Club Login And Dashboard Shell Tasks

**Design**: `.specs/features/tenant-club-login-dashboard-shell/design.md`
**Context**: `.specs/features/tenant-club-login-dashboard-shell/context.md`
**Status**: Completed

---

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| frontend-test | `pnpm --filter @pong-ping/frontend test` | Required for tenant auth API helper and route/page behavior tests. |
| frontend-build | `pnpm --filter @pong-ping/frontend build` | Required after route files are added so route tree/type generation is verified. |
| api-test | `pnpm --filter @pong-ping/api test` | Required only if tenant OAuth callback redirect support touches Nest API code. |
| api-build | `pnpm --filter @pong-ping/api build` | Required only if backend config/controller code changes. |
| full | `pnpm --filter @pong-ping/frontend test && pnpm --filter @pong-ping/frontend build` | Final frontend gate for the base feature. Add API gates if T6 is implemented. |

No `.specs/codebase/TESTING.md` exists, so test assignments follow package scripts and existing package conventions.

---

## Execution Plan

### Phase 1: Tenant Auth Foundation

```text
T1 -> T2
```

### Phase 2: Tenant Routes And UI

```text
T2 -> T3 -> T4 -> T5
```

### Phase 3: OAuth Return Gap, If Needed

```text
T5 -> T6
```

### Phase 4: Verification

```text
T5 -> T7
T6 -> T7
```

---

## Task Breakdown

### T1: Add Tenant Auth API Helpers

**What**: Create tenant-specific auth query keys, API functions, and tenant login URL helper.
**Where**: `apps/frontend/src/lib/api/tenant-auth.ts`, optional additions to `apps/frontend/src/lib/api/client.ts`
**Depends on**: None
**Reuses**: `apps/frontend/src/lib/api/client.ts`, `apps/frontend/src/lib/api/system-admin.ts`, `@pong-ping/contracts`, decisions in `.specs/features/tenant-club-login-dashboard-shell/context.md`
**Requirement**: CLUBAUTH-01, CLUBAUTH-02, CLUBAUTH-03

**Tools**:

- MCP: Context7 only if TanStack Query API usage becomes unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `tenantAuthKeys.me` is separate from system `authKeys.me`.
- [x] `tenantMeQueryOptions()` calls `GET /auth/me` with retry disabled.
- [x] `logoutTenantSession()` calls `POST /auth/logout`.
- [x] `getTenantLoginUrl()` builds the `GET /auth/google` browser URL and preserves only safe redirect input if supported.
- [x] Tenant principal validation rejects `tenantId: null`.
- [x] Unit tests cover endpoint paths, credentialed fetch behavior through `apiRequest`, and query key separation.
- [x] Gate check passes: `pnpm --filter @pong-ping/frontend test`.

**Tests**: unit
**Gate**: frontend-test
**Commit**: `feat(frontend): add tenant auth api helpers`

---

### T2: Create Club Login Page

**What**: Build the tenant-facing login page and authenticated-user redirect behavior.
**Where**: `apps/frontend/src/features/tenant-auth/club-login-page.tsx`, `apps/frontend/src/routes/club.login.tsx`
**Depends on**: T1
**Reuses**: `apps/frontend/src/features/auth/login-page.tsx`, `apps/frontend/src/components/ui/button.tsx`, existing design tokens
**Requirement**: CLUBAUTH-01

**Tools**:

- MCP: Context7 for TanStack Router search params only if adding typed `validateSearch`.
- Skill: `frontend-design` during implementation.

**Done when**:

- [x] `/club/login` route exists and renders the club login page.
- [x] Copy and labels are tenant/club-specific and do not mention system administration.
- [x] Authenticated tenant users are redirected to `/club` or a safe internal redirect path.
- [x] Login action uses `window.location.assign(getTenantLoginUrl(...))`.
- [x] The layout is responsive without text/control overlap at mobile and desktop widths.
- [x] Tests cover unauthenticated render, authenticated redirect, and login action URL.
- [x] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit/build
**Gate**: frontend-test, frontend-build
**Commit**: `feat(frontend): add club login page`

---

### T3: Add Protected Club Route Guard

**What**: Add the `/club` parent route with tenant session validation and unauthenticated redirect.
**Where**: `apps/frontend/src/routes/club.tsx`
**Depends on**: T1
**Reuses**: `apps/frontend/src/routes/admin.tsx`, TanStack Router `beforeLoad` redirect pattern
**Requirement**: CLUBAUTH-02

**Tools**:

- MCP: Context7 for TanStack Router if guard/search behavior is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `/club` uses `beforeLoad` to `ensureQueryData(tenantMeQueryOptions())`.
- [x] 401/403 API errors remove tenant auth cache and redirect to `/club/login`.
- [x] Redirect search includes the attempted location.
- [x] Non-auth API errors are re-thrown instead of hidden.
- [x] System auth query keys are not read, written, or removed.
- [x] Route tests or focused component tests cover success and unauthenticated redirect behavior.
- [x] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit/build
**Gate**: frontend-test, frontend-build
**Commit**: `feat(frontend): protect club routes`

---

### T4: Create Club Dashboard Layout

**What**: Create the authenticated tenant dashboard shell with navigation, principal display, skip link, and logout.
**Where**: `apps/frontend/src/components/layout/club-layout.tsx`
**Depends on**: T1, T3
**Reuses**: `apps/frontend/src/components/layout/admin-layout.tsx`, shadcn Sidebar/Button/Separator, Sonner toast
**Requirement**: CLUBAUTH-02, CLUBAUTH-03

**Tools**:

- MCP: none expected.
- Skill: `frontend-design` during implementation.

**Done when**:

- [x] Layout renders `Outlet` for club child content.
- [x] Sidebar/header labels are tenant/club-specific and omit system-admin terminology.
- [x] Logout calls `logoutTenantSession()`.
- [x] Logout success removes only `tenantAuthKeys.me` and navigates to `/club/login`.
- [x] Logout failure shows a non-blocking toast and keeps current route.
- [x] Skip link and semantic main region are present.
- [x] Tests cover logout success/failure and query-key separation.
- [x] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit/build
**Gate**: frontend-test, frontend-build
**Commit**: `feat(frontend): add club dashboard layout`

---

### T5: Add Placeholder Dashboard Page

**What**: Add the `/club` index content as a placeholder dashboard page.
**Where**: `apps/frontend/src/features/club/dashboard-shell-page.tsx`, `apps/frontend/src/routes/club.index.tsx` or equivalent file-based index route
**Depends on**: T4
**Reuses**: `apps/frontend/src/components/layout/page-shell.tsx`, existing UI primitives and tokens
**Requirement**: CLUBAUTH-02

**Tools**:

- MCP: Context7 only if TanStack file-based index route naming is unclear.
- Skill: `frontend-design` during implementation.

**Done when**:

- [x] `/club` renders placeholder dashboard content inside `ClubLayout`.
- [x] Content clearly signals the user is in the club workspace without describing implementation details or future feature instructions.
- [x] Placeholder sections use stable dimensions and do not create nested cards.
- [x] Long identifiers truncate or wrap cleanly.
- [x] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit/build
**Gate**: frontend-test, frontend-build
**Commit**: `feat(frontend): add club dashboard shell`

---

### T6: Add Tenant OAuth Callback Redirect Support If Needed

**What**: Update tenant OAuth callback behavior so browser login returns to the club frontend after session creation.
**Where**: `apps/api/src/modules/identity/auth/auth.controller.ts`, `apps/api/src/common/config/config.module.ts`, related API tests/docs
**Depends on**: T5
**Reuses**: `apps/api/src/modules/identity/system/system-auth.controller.ts` redirect pattern, existing session cookie helpers
**Requirement**: CLUBAUTH-04

**Tools**:

- MCP: Context7 for NestJS only if controller response behavior is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [x] Current target environment is checked; task is skipped if callback redirect is already handled elsewhere.
- [x] Successful tenant callback sets the session cookie and redirects to the configured club frontend URL.
- [x] Redirect target is safe and does not allow arbitrary external redirects.
- [x] Existing tests are updated to expect the intentional callback behavior.
- [x] Gate checks pass: `pnpm --filter @pong-ping/api test` and `pnpm --filter @pong-ping/api build`.

**Tests**: unit/build
**Gate**: api-test, api-build
**Commit**: `feat(api): redirect tenant login callbacks`

---

### T7: Verify Integration And Regressions

**What**: Run final package gates and manually inspect route behavior.
**Where**: `apps/frontend`, optional `apps/api` if T6 ran
**Depends on**: T5; T6 if implemented
**Reuses**: Existing package scripts and Vite dev server
**Requirement**: CLUBAUTH-01, CLUBAUTH-02, CLUBAUTH-03, CLUBAUTH-04

**Tools**:

- MCP: none expected.
- Skill: `tlc-spec-driven`

**Done when**:

- [x] `pnpm --filter @pong-ping/frontend test` passes.
- [x] `pnpm --filter @pong-ping/frontend build` passes.
- [x] If T6 ran, `pnpm --filter @pong-ping/api test` passes.
- [x] If T6 ran, `pnpm --filter @pong-ping/api build` passes.
- [x] `/login` and `/admin/tenants` behavior is spot-checked for system-admin regression.
- [x] `/club/login` and `/club` behavior is spot-checked for tenant login/guard shell behavior.
- [x] Any tenant-host local setup caveat is documented in the implementation summary.

**Tests**: full
**Gate**: full plus API gates if needed
**Commit**: `test(frontend): verify club auth shell`

---

## Parallel Execution Map

```text
Phase 1:
  T1 -> T2
  T1 -> T3

Phase 2:
  T3 -> T4 -> T5

Phase 3:
  T5 -> T6 (conditional)

Phase 4:
  T5/T6 -> T7
```

T2 and T3 can be implemented in parallel after T1 if their write sets stay separate.

---

## Pre-Approval Checks

### Task Granularity

| Task | Atomic Deliverable | Result |
| --- | --- | --- |
| T1 | One tenant auth API helper module plus focused tests | Pass |
| T2 | One login page route/screen | Pass |
| T3 | One protected route guard | Pass |
| T4 | One authenticated layout shell | Pass |
| T5 | One placeholder dashboard page | Pass |
| T6 | One conditional backend OAuth redirect adjustment | Pass |
| T7 | Verification only | Pass |

### Diagram-Definition Cross-Check

| Task | Depends on field | Execution map dependency | Result |
| --- | --- | --- | --- |
| T1 | None | Starts Phase 1 | Pass |
| T2 | T1 | T1 -> T2 | Pass |
| T3 | T1 | T1 -> T3 | Pass |
| T4 | T1, T3 | T3 -> T4 and T1 foundation | Pass |
| T5 | T4 | T4 -> T5 | Pass |
| T6 | T5 | T5 -> T6 | Pass |
| T7 | T5; T6 if implemented | T5/T6 -> T7 | Pass |

### Test Co-Location Validation

| Task | Code Layer | Tests Field | Required Co-Located Test Work | Result |
| --- | --- | --- | --- | --- |
| T1 | Frontend API helper | unit | Unit tests in same task | Pass |
| T2 | Frontend route/page | unit/build | Route/page tests in same task | Pass |
| T3 | Frontend route guard | unit/build | Guard redirect tests in same task | Pass |
| T4 | Frontend layout/logout | unit/build | Layout/logout tests in same task | Pass |
| T5 | Frontend page | unit/build | Render/build verification in same task | Pass |
| T6 | API controller/config | unit/build | API controller/config tests in same task | Pass |
| T7 | Verification | full | No new code; gate execution only | Pass |

---

## Requirement Coverage

| Requirement ID | Tasks | Status |
| --- | --- | --- |
| CLUBAUTH-01 | T1, T2, T7 | Verified |
| CLUBAUTH-02 | T1, T3, T4, T5, T7 | Verified |
| CLUBAUTH-03 | T1, T4, T7 | Verified |
| CLUBAUTH-04 | T6, T7 | Verified |

Coverage: 4 total, 4 mapped to tasks, 4 verified, 0 unmapped.

## Tooling Question Before Execute

Before implementation, confirm whether to use sub-agents for parallel tasks and whether T6 should be included immediately or only after frontend login flow verification proves the OAuth callback redirect gap.
