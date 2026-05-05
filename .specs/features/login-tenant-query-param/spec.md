# Login Tenant Query Param Specification

## Problem Statement

Multitenancy is implemented, but `/login` still exposes a required `Tenant` form field. Current code parses `searchParams.tenant` in `app/login/page.tsx`, yet `signInWithGoogle` still requires `tenantSlug` from posted form data. This keeps tenant selection editable in the form and conflicts with the desired URL-driven login entry point.

Tenant selection for login should come from `/login?tenant={slug}` with a default fallback when the query param is absent. The selected tenant must still be validated server-side before setting the pending tenant cookie. Query params choose login context only; authenticated authorization continues to use session tenant context.

## Goals

- [ ] Remove the visible `Tenant` field from the login form.
- [ ] Resolve login tenant from the `tenant` query param.
- [ ] Use a default tenant fallback when `tenant` is absent, blank, or malformed.
- [ ] Validate the resolved tenant slug server-side before Google OAuth starts.
- [ ] Preserve pending tenant cookie behavior used by the tenant-aware Auth.js adapter.
- [ ] Preserve existing login error redirects and tenant subdomain post-login redirect.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Tenant switcher UI | Tenant must come from URL/default for this change. |
| Auth.js adapter rewrite | Multitenancy adapter is already implemented. |
| Tenant authorization from query params | Query param is only pre-auth login context. |
| Custom domain routing | Existing tenant host resolver remains unchanged. |

---

## Requirements

### LTQP-001: URL-Resolved Login Tenant

**User Story**: As a user arriving at a tenant login link, I want the tenant to be selected from the URL so I do not type an organization slug manually.

**Acceptance Criteria**:

1. WHEN `/login?tenant=alpha` is requested THEN login SHALL attempt Google sign-in for tenant slug `alpha`.
2. WHEN `/login` is requested without `tenant` THEN login SHALL use default tenant slug `default`.
3. WHEN `tenant` is blank, repeated, or not a string THEN login SHALL use default tenant slug `default`.
4. WHEN a query tenant is provided THEN it SHALL be normalized with existing slug rules before lookup.
5. WHEN the user is already authenticated THEN current redirect behavior SHALL remain unchanged.

**Independent Test**: A login page/action test proves `/login?tenant=alpha` starts OAuth for `alpha`, while `/login` starts OAuth for `default`.

### LTQP-002: Remove Tenant Form Field

**User Story**: As a user, I want login to have one clear action so tenant selection does not feel like an internal technical setting.

**Acceptance Criteria**:

1. WHEN the login page renders THEN there SHALL be no visible input labeled `Tenant`.
2. WHEN the login form submits THEN tenant context SHALL NOT depend on user-editable `tenantSlug` form data.
3. WHEN the selected tenant is known THEN the page MAY display tenant name/slug as read-only context.
4. WHEN JavaScript is disabled THEN the form SHALL still submit through a Server Action.

**Independent Test**: Rendering `/login?tenant=alpha` contains no `tenantSlug` text input and the server action still receives the resolved tenant slug.

### LTQP-003: Server-Side Tenant Validation

**User Story**: As a maintainer, I want URL tenant selection validated on the server so invalid links fail safely.

**Acceptance Criteria**:

1. WHEN resolved tenant slug exists THEN `setPendingTenantCookie` SHALL receive tenant id, slug, and name from the database row.
2. WHEN resolved tenant slug does not exist THEN login SHALL redirect to `/login?error=tenant_not_found` or render an equivalent safe error.
3. WHEN tenant validation fails THEN Google OAuth SHALL NOT start.
4. WHEN pending tenant cookie is set THEN existing OAuth callback/session behavior SHALL remain unchanged.

**Independent Test**: Server action test mocks missing tenant and asserts `signIn("google")` is not called.

### LTQP-004: Preserve Multitenancy Security Boundary

**User Story**: As a platform operator, I want URL tenant login to preserve the trusted multitenancy boundary.

**Acceptance Criteria**:

1. WHEN query param tenant differs from an authenticated session tenant THEN authenticated redirect SHALL still use session tenant.
2. WHEN OAuth completes THEN tenant context SHALL come from signed pending tenant cookie, not query params.
3. WHEN protected app routes run THEN they SHALL continue using authenticated session tenant context.

**Independent Test**: Existing tenant-aware adapter tests remain green; new tests only cover login entry-point resolution.

---

## Implementation Notes

Current implementation evidence:

| File | Current Behavior |
| --- | --- |
| `app/login/page.tsx` | Reads `searchParams.tenant`, pre-fills visible `Tenant` input, posts `tenantSlug`. |
| `app/actions/auth.ts` | `signInWithGoogle(formData)` reads `formData.get("tenantSlug")` and redirects `tenant_required` when absent. |
| `lib/auth/pending-tenant.ts` | Signs short-lived HttpOnly pending tenant cookie consumed by OAuth callback/adapter. |
| `.specs/features/multitenancy/implementation-summary.md` | Confirms tenant-aware auth/session and tenant subdomain redirect are already implemented. |

Recommended implementation shape:

- Add a small shared resolver such as `normalizeLoginTenantSlug(value)` with fallback `default`.
- Change `signInWithGoogle` to accept a server-provided tenant slug argument, not tenant slug from visible form input.
- In `app/login/page.tsx`, resolve `params.tenant`, bind or wrap the Server Action with that slug, and render only Google sign-in plus optional read-only tenant context.
- Keep all tenant lookup and pending cookie writes inside the server action.

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| `/login?tenant=Alpha%20Club` | Normalize consistently; if invalid slug after normalization, use fallback or fail as defined by helper. |
| `/login?tenant=` | Use `default`. |
| `/login?tenant=a&tenant=b` | Use `default`. |
| Default tenant missing | Show `tenant_not_found`; do not start OAuth. |
| Expired pending tenant during OAuth | Existing `tenant_context_required` behavior remains. |

## Requirement Traceability

| Requirement | Primary Areas |
| --- | --- |
| LTQP-001 | `app/login/page.tsx`, tenant slug resolver |
| LTQP-002 | `app/login/page.tsx` |
| LTQP-003 | `app/actions/auth.ts`, `lib/auth/pending-tenant.ts` |
| LTQP-004 | `auth.ts`, existing tenant adapter/session tests |

## Success Criteria

- [ ] No visible `Tenant` input on `/login`.
- [ ] `/login?tenant={slug}` selects tenant for OAuth.
- [ ] `/login` falls back to `default`.
- [ ] Invalid/missing tenant does not start OAuth.
- [ ] Existing multitenancy tests pass.
