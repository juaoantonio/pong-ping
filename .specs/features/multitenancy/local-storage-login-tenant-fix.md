# Local Storage Login Tenant Fix Plan

**Feature**: `.specs/features/multitenancy`
**Related implementation**: `.specs/features/login-tenant-query-param`
**Status**: Implemented on 2026-05-05
**Scope**: Medium, because the login page is a Server Component and localStorage requires a Client Component boundary.

## Current Findings

- Multitenancy is implemented with tenant context treated as trusted server-side state after login.
- `/login` already accepts `searchParams.tenant`, normalizes it with `normalizeLoginTenantSlug`, looks up the tenant, and binds the resolved slug into `signInWithGoogle`.
- `signInWithGoogle` validates the tenant on the server, sets the signed HttpOnly pending tenant cookie, and starts Google OAuth.
- There is no localStorage usage today. A user who returns to `/login` without `?tenant=` always gets the `default` tenant.
- Because `app/login/page.tsx` is a Server Component, it cannot read localStorage directly. Next.js docs require browser APIs such as localStorage to live in a Client Component.

## Required Behavior

1. When a user reaches `/login?tenant=alpha`, the query param remains the explicit override for that request.
2. When a valid query tenant is present, store that normalized slug in user localStorage as the current login tenant.
3. When a user reaches `/login` without a tenant query and localStorage has a current login tenant, redirect/replace the URL to `/login?tenant={storedSlug}`.
4. When neither query param nor localStorage has a tenant, preserve the existing `default` fallback.
5. Server-side security remains unchanged: localStorage only chooses the login entry context; the server action still validates the tenant and writes the trusted pending tenant cookie.

## Proposed Implementation

### 1. Add a Client Component for login tenant persistence

Create a small client-only component, for example `components/auth/login-tenant-memory.tsx`.

Responsibilities:

- Read `window.location.search` in an effect.
- If there is exactly one non-empty `tenant` query value, normalize it and write it to localStorage.
- If there is no `tenant` query value, read the stored slug.
- If a stored slug exists and is not `default`, call `router.replace()` with the same path plus `tenant={storedSlug}`, preserving existing non-tenant query params such as `error`.
- Avoid using stored values for authorization or direct OAuth calls.

Suggested storage key:

```text
pong_ping_current_login_tenant
```

### 2. Mount it inside `/login`

Update `app/login/page.tsx` to render the Client Component near the top of `<main>`.

Keep the existing server flow intact:

- `searchParams.tenant` remains the only server-rendered tenant input.
- `normalizeLoginTenantSlug(params.tenant)` remains the value bound into `signInWithGoogle`.
- Tenant display still comes from the database lookup.

Expected UX:

- First paint may briefly show the default tenant when the URL lacks `tenant` and localStorage contains another slug, then the Client Component replaces the URL and the server-rendered login page refreshes with the stored tenant.
- This is acceptable for the minimal fix. Avoid converting the login page to a Client Component because it would move database/auth work out of the established server boundary.

### 3. Optionally sync authenticated tenant back to localStorage

Add a tiny client component under `components/auth/current-tenant-memory.tsx` and mount it from `components/app-layout.tsx` with `user.tenant?.slug`.

This makes the remembered tenant follow the authenticated user's current tenant after successful login.

Important limitation:

- localStorage is origin-scoped. If production uses separate auth and tenant subdomains, localStorage written on one subdomain is not readable on another. Query-param login links remain the reliable cross-origin handoff.

### 4. Tests

Add focused unit tests with jsdom:

- `/login?tenant=alpha` stores `alpha`.
- `/login` with stored `alpha` calls `router.replace("/login?tenant=alpha")`.
- `/login?error=tenant_context_required` with stored `alpha` preserves the error query while adding tenant.
- `/login` with no stored tenant does not redirect and keeps default fallback.
- malformed or repeated query values do not poison localStorage.

Keep existing tests:

- `__tests__/unit/login-page.test.tsx`
- `__tests__/unit/login-tenant.test.ts`
- `__tests__/unit/auth-actions.test.ts`

Gate:

```bash
pnpm test -- __tests__/unit/login-tenant.test.ts __tests__/unit/auth-actions.test.ts __tests__/unit/login-page.test.tsx
pnpm lint
```

## Risk Notes

- Do not let localStorage bypass `signInWithGoogle` tenant validation.
- Do not add hidden tenant inputs; the previous query-param fix intentionally removed editable form state.
- Do not use localStorage as authenticated tenant context. Protected app routes must continue using `session.user.tenantId`.
- Be explicit in tests that localStorage only feeds the `tenant` query param entry point.

## Implementation Summary

- Added a login Client Component that stores explicit `?tenant=` values and restores stored tenants by replacing `/login` with `/login?tenant={slug}`.
- Added an authenticated-layout Client Component that records the current session tenant slug after login.
- Kept query param override and server-side tenant validation unchanged.
- Cleared stale stored tenant state when `/login?error=tenant_not_found` is reached without an explicit tenant query.

## Verification

- `pnpm test -- __tests__/unit/login-tenant.test.ts __tests__/unit/auth-actions.test.ts __tests__/unit/login-page.test.tsx __tests__/unit/login-tenant-memory.test.tsx __tests__/unit/current-tenant-memory.test.tsx` passed: 5 suites, 25 tests.
- `pnpm lint` passed.
- `pnpm test` passed: 31 suites, 133 tests.
- `pnpm build` passed.
