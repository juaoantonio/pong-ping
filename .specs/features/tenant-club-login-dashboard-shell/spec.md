# Tenant Club Login And Dashboard Shell Specification

## Problem Statement

The Vite frontend currently supports only the system administrator surface at `/login` and `/admin/*`. Club users need a separate tenant-scoped entry point that starts tenant Google OAuth, verifies the tenant session, and lands authenticated users in a placeholder dashboard shell without using system-admin auth state or navigation.

This feature creates the first tenant/club frontend surface while deliberately keeping business dashboard widgets out of scope.

## Assumptions

- The implementation targets `apps/frontend`, the Vite React app.
- Tenant/club routes will use `/club/login` and `/club` to avoid colliding with the existing system-admin `/login` and `/admin/*` routes.
- Tenant auth calls must use the existing API tenant auth endpoints: `GET /auth/google`, `GET /auth/me`, and `POST /auth/logout`.
- The tenant API base URL must be tenant-host aware because the Nest API resolves tenant context from the request host, not from a client-supplied tenant ID.
- If OAuth callback redirection is not already configured for the tenant frontend, implementation must add the smallest backend support needed to redirect successful tenant login back to `/club`.

## Goals

- [x] Provide a tenant/club login page distinct from the system admin login.
- [x] Start tenant Google OAuth from the tenant login page.
- [x] Protect the placeholder club dashboard shell with tenant session validation.
- [x] Provide a minimal authenticated dashboard shell with tenant-user navigation and logout.
- [x] Preserve system-admin login, admin routes, query keys, and layout behavior.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Real dashboard metrics, schedules, tables, rankings, or match workflows | This feature is only the authenticated shell. |
| Email/password login | Existing identity auth uses Google OAuth. |
| Tenant switching inside the app | Tenant is derived from host/API base URL, not selected by the user in this slice. |
| System admin UI changes | Existing `/login` and `/admin/*` behavior must remain intact. |
| Membership management from the club shell | System admin already owns membership administration. |
| Custom tenant domains | Existing tenancy uses root-domain subdomains. |

---

## User Stories

### P1: Tenant Login Entry Point MVP

**User Story**: As a club member, I want a tenant-specific login page so that I can enter my club workspace without seeing system administrator language.

**Why P1**: Login is the entry point for all tenant dashboard access.

**Acceptance Criteria**:

1. WHEN an unauthenticated user visits `/club/login` THEN the frontend SHALL render a tenant/club login page that does not use system-admin copy or endpoints.
2. WHEN an authenticated tenant user visits `/club/login` THEN the frontend SHALL redirect to `/club`.
3. WHEN the login page is rendered THEN the primary action SHALL navigate the browser to the tenant API `GET /auth/google` URL.
4. WHEN the tenant API base URL is missing THEN the frontend SHALL use the existing local API default only if it is documented as tenant-host compatible; otherwise it SHALL fail visibly enough for local setup to be corrected.
5. WHEN the login page is viewed on mobile and desktop THEN text and controls SHALL not overlap or overflow.

**Independent Test**: Render `/club/login` with mocked `GET /auth/me` unauthenticated/authenticated responses and assert page content, login URL, and redirect behavior.

---

### P1: Protected Club Dashboard Shell MVP

**User Story**: As an authenticated club member, I want to land in a club dashboard shell so that future tenant workflows have a stable home.

**Why P1**: The shell is the route protection and layout foundation for all tenant features.

**Acceptance Criteria**:

1. WHEN an unauthenticated user visits `/club` THEN the frontend SHALL clear tenant auth cache and redirect to `/club/login` with a redirect search parameter.
2. WHEN an authenticated tenant user visits `/club` THEN the frontend SHALL render the dashboard shell.
3. WHEN tenant session validation succeeds THEN the dashboard shell SHALL use the tenant principal returned by `GET /auth/me`.
4. WHEN `GET /auth/me` returns unauthorized or forbidden THEN the frontend SHALL treat the user as unauthenticated.
5. WHEN the shell renders THEN it SHALL include a placeholder dashboard page, stable navigation, a skip link, and a logout control.

**Independent Test**: Load `/club` with mocked tenant auth success and failure, assert route access, redirect target, and shell landmarks.

---

### P1: Tenant Logout

**User Story**: As a club member, I want to log out of my tenant session so that shared devices do not keep me signed in.

**Why P1**: Any authenticated shell must include a way to end the session.

**Acceptance Criteria**:

1. WHEN the user activates logout THEN the frontend SHALL call `POST /auth/logout` with credentials.
2. WHEN logout succeeds THEN tenant auth queries SHALL be invalidated or removed and the user SHALL navigate to `/club/login`.
3. WHEN logout fails THEN the shell SHALL show a non-blocking error and keep the user on the current page.
4. WHEN system-admin auth cache exists THEN tenant logout SHALL NOT clear system-admin query keys.

**Independent Test**: Mock logout success/failure and assert API path, tenant query cache handling, navigation, and error presentation.

---

### P2: Tenant OAuth Callback Return

**User Story**: As a club member, I want Google OAuth to return me to the club dashboard so that login completes as a browser flow.

**Why P2**: The existing tenant API callback creates a session but currently returns JSON; browser login needs a usable return path if no deployment layer already handles it.

**Acceptance Criteria**:

1. WHEN Google OAuth callback succeeds for a tenant login THEN the browser SHALL end at the configured tenant frontend dashboard URL.
2. WHEN a redirect search parameter was provided before login THEN successful login SHOULD return to that safe same-origin path.
3. WHEN OAuth fails because the user lacks tenant membership THEN no session SHALL be created and the user SHALL receive a clear failure path.
4. WHEN backend configuration is added THEN existing API envelope behavior for non-browser tests SHALL remain covered or be intentionally updated in tests.

**Independent Test**: Controller or route test verifies successful tenant callback sets the session cookie and redirects to the tenant frontend URL or documented fallback.

---

## Edge Cases

- WHEN the API host resolves to the reserved system/API host THEN tenant auth SHALL fail rather than silently using system auth.
- WHEN the tenant session cookie is expired, revoked, missing, or from another tenant THEN `/club` SHALL redirect to `/club/login`.
- WHEN the tenant principal has `tenantId: null` THEN the dashboard shell SHALL reject it as invalid tenant auth.
- WHEN the user has tenant role `member` but not `admin` THEN the placeholder shell SHALL still render.
- WHEN long user IDs or future tenant names are shown THEN the shell SHALL truncate or wrap without layout overlap.
- WHEN `/club/login?redirect=/club/settings` is present before that route exists THEN login SHALL use only safe internal redirects and fall back to `/club`.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| CLUBAUTH-01 | P1: Tenant Login Entry Point MVP | Verified |
| CLUBAUTH-02 | P1: Protected Club Dashboard Shell MVP | Verified |
| CLUBAUTH-03 | P1: Tenant Logout | Verified |
| CLUBAUTH-04 | P2: Tenant OAuth Callback Return | Verified |

Coverage: 4 total, 4 mapped to tasks, 4 verified, 0 unmapped.

## Success Criteria

- [x] `/club/login` starts tenant Google OAuth without touching system-admin endpoints.
- [x] `/club` is guarded by tenant auth and redirects unauthenticated users to `/club/login`.
- [x] Authenticated tenant users see a placeholder dashboard shell with navigation and logout.
- [x] Tenant logout clears only tenant auth state.
- [x] Existing `/login` and `/admin/*` behavior remains unchanged.
- [x] `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build` pass.
