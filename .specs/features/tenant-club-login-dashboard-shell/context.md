# Tenant Club Login And Dashboard Shell Context

**Gathered:** 2026-05-09
**Spec:** `.specs/features/tenant-club-login-dashboard-shell/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Create the first tenant/club frontend surface in `apps/frontend`: a tenant-specific login page, a protected placeholder dashboard shell, and tenant logout. This feature establishes route, auth, and layout foundations only; real dashboard workflows and metrics remain out of scope.

This context was captured from the user's request plus existing repository constraints. No separate user discussion round was held, so decisions below are implementation constraints and reasonable defaults rather than explicit visual preferences from the user.

---

## Implementation Decisions

### Route Shape

- Tenant/club routes use `/club/login` and `/club`.
- Existing system-admin routes stay unchanged: `/login` and `/admin/*`.
- `/club` is the protected dashboard shell entry point.
- `/club/login` is public and redirects authenticated tenant users back to `/club` or a safe internal redirect target.

### Auth Separation

- Tenant auth must use tenant endpoints: `GET /auth/google`, `GET /auth/me`, and `POST /auth/logout`.
- System-admin auth helpers, routes, labels, and query keys must not be reused as tenant state.
- Tenant auth gets separate query keys, expected as `["tenant-auth", "me"]`.
- Tenant logout clears only tenant auth state and must not remove system-admin auth cache.
- A principal with `tenantId: null` is invalid for the club shell even if another auth query succeeds.

### Tenant Host Constraint

- Tenant identity is resolved by the API from request host/subdomain, not from client-selected tenant state.
- Implementation must confirm the local tenant API URL strategy before coding the login flow.
- If the default API URL points at a reserved/system/API host, tenant auth should fail visibly instead of silently falling back to system auth.
- Local setup may require `VITE_API_BASE_URL` to point at a tenant host such as `http://acme.localhost:3001/v1`.

### Login Experience

- The tenant login page should be visually distinct from the system-admin login and avoid system-admin language.
- Primary action is Google login.
- The page should remain concise and operational, matching the product dashboard tone already used in `apps/frontend`.
- The layout must work on mobile and desktop without overlap or overflow.

### Dashboard Shell Experience

- The shell should mirror the existing admin layout pattern where useful: sidebar, header, skip link, main content region, and logout control.
- Labels and navigation must be tenant/club-specific.
- The placeholder dashboard should clearly show the user is in the club workspace but should not introduce real dashboard widgets, metrics, or workflows.
- The shell should support any active tenant role, including `member`; it should not require tenant admin.

### OAuth Callback Return

- The current tenant API callback appears to create a session and return JSON.
- Browser login needs a return path to the frontend; implementation must verify whether deployment/config already handles this.
- If not handled, add the smallest backend redirect support needed so successful tenant OAuth returns to `/club`.
- Safe redirect handling is required; arbitrary external redirect targets are out of scope and must not be introduced.

---

## Agent's Discretion

- Exact page copy, as long as it is tenant/club-specific and avoids system-admin terminology.
- Exact placeholder dashboard content, as long as it stays within shell-only scope.
- Whether to show a logout success toast, provided error handling remains non-blocking and consistent with existing UI.
- Whether to implement typed `validateSearch` for redirect search params immediately or keep redirect handling minimal.
- Whether to skip the backend OAuth redirect task until frontend flow verification proves it is necessary.

---

## Specific References

- Existing system-admin login: `apps/frontend/src/features/auth/login-page.tsx`
- Existing protected route guard: `apps/frontend/src/routes/admin.tsx`
- Existing admin layout pattern: `apps/frontend/src/components/layout/admin-layout.tsx`
- Existing page shell primitives: `apps/frontend/src/components/layout/page-shell.tsx`
- Existing tenant auth API endpoints: `apps/api/src/modules/identity/auth/auth.controller.ts`
- Existing system OAuth redirect pattern: `apps/api/src/modules/identity/system/system-auth.controller.ts`

---

## Deferred Ideas

- Real club dashboard metrics and widgets.
- Tenant navigation for tables, matches, rankings, schedules, or members.
- Tenant switching inside the frontend.
- Custom tenant domains.
- Email/password authentication.
- Tenant membership management from the club shell.
