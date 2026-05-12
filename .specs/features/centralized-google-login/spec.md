# Centralized Google Login Specification

## Problem Statement

Tenant Google login currently starts from the tenant API host and depends on request tenant context during OAuth start and callback. That makes Google redirect URIs tenant-host dependent and pushes tenant identity into request host resolution at the exact point where the backend should use one stable OAuth callback.

This feature centralizes tenant Google OAuth on `auth.<ROOT_DOMAIN>` while preserving the existing identity model, session model, tenant membership checks, system admin OAuth flow, and tenant-scoped session validation.

## Goals

- [ ] Route tenant Google OAuth start and callback through the reserved auth host.
- [ ] Carry the selected tenant and final internal destination through a signed, expiring OAuth state payload.
- [ ] Create tenant-scoped sessions only for users with active membership in the tenant validated from state.
- [ ] Set session cookies that work across production subdomains and remain browser-compatible on localhost.
- [ ] Redirect the browser back to the validated tenant frontend host and internal return path.
- [ ] Update frontend login URL generation to use the central auth API host while keeping protected API calls tenant-host scoped.
- [ ] Preserve system admin OAuth behavior under `/v1/system/auth/google`.

## Out of Scope

| Feature                                        | Reason                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Multiple social providers                      | This step centralizes the existing Google flow only.                               |
| `identity_accounts` or provider account tables | The current `identity_users.googleSubject` model remains sufficient for this step. |
| Dedicated auth frontend                        | `auth.<ROOT_DOMAIN>` points to the NestJS backend/API.                             |
| Custom tenant domains                          | Existing tenant resolution remains based on subdomain and `ROOT_DOMAIN`.           |
| Database migrations                            | No schema changes are planned.                                                     |
| Rewriting auth/session architecture            | Existing `identity_sessions`, memberships, and opaque cookie sessions are reused.  |

---

## User Stories

### P1: Start Tenant Google Login From Central Auth Host

**User Story**: As a club user, I want the club login button to start Google OAuth through one central auth host so that login works without registering one Google callback per tenant.

**Why P1**: This is the entry point for the centralized flow and the Google Console needs one tenant-login redirect URI.

**Acceptance Criteria**:

1. WHEN the frontend is loaded on `tenant.localhost.test:5173/club/login` THEN it SHALL build a Google login URL on `api.localhost.test:3001/v1/auth/google`.
2. WHEN the login URL is built THEN it SHALL include `tenant=<slug>` extracted from the current frontend hostname.
3. WHEN the login URL is built with `returnTo=/club` or another internal path THEN it SHALL include `returnTo=<path>`.
4. WHEN the requested `returnTo` is absolute, protocol-relative, or external THEN the frontend SHALL omit or normalize it instead of sending it to the backend.
5. WHEN `GET /v1/auth/google?tenant=<slug>&returnTo=<path>` is called on the central auth host THEN the backend SHALL validate the auth host, tenant slug, tenant active status, and internal return path before redirecting to Google.
6. WHEN tenant is missing, unknown, inactive, or the request is not on the reserved auth host THEN the backend SHALL reject OAuth start.

**Independent Test**: Unit tests prove `getTenantLoginUrl()` builds a central API host URL from a tenant frontend host and OAuth start rejects missing, unknown, inactive, and non-auth-host requests.

---

### P1: Protect OAuth State

**User Story**: As a maintainer, I want tenant and return path carried in signed state so that callback handling never trusts mutable query strings or request host tenant context.

**Why P1**: State is the security boundary between OAuth start and callback.

**Acceptance Criteria**:

1. WHEN OAuth start succeeds THEN the backend SHALL generate a signed state payload using `SESSION_SECRET`.
2. WHEN state is generated THEN it SHALL include `tenantId`, `tenantSlug`, `returnTo`, `nonce`, `iat`, and `exp`.
3. WHEN callback receives state THEN the backend SHALL verify signature and expiration before using the payload.
4. WHEN state is invalid, expired, missing, or tampered THEN callback SHALL reject the request and SHALL NOT create a session.
5. WHEN state includes an absolute URL, protocol-relative URL, or external return target THEN callback SHALL reject the request.
6. WHEN state references a tenant that is missing or inactive THEN callback SHALL reject the request.

**Independent Test**: Unit tests generate valid state, validate it, then assert invalid signature, expired payload, modified payload, external return path, and inactive tenant cases fail.

---

### P1: Complete Tenant Login From Validated State

**User Story**: As a club user with an active membership, I want Google callback to create a session for the tenant I selected before OAuth so that I land in the right club.

**Why P1**: Session creation must remain tenant-scoped and must not depend on the callback host resolving as a tenant.

**Acceptance Criteria**:

1. WHEN Google callback succeeds with valid state THEN the backend SHALL load the tenant by `tenantId` from state.
2. WHEN Google callback succeeds THEN the backend SHALL upsert the Google user using existing `identity_users.googleSubject` behavior.
3. WHEN the user has active membership in the state tenant THEN the backend SHALL create an `identity_sessions` row with that `tenantId`.
4. WHEN the user lacks active membership in the state tenant THEN callback SHALL reject login and SHALL NOT create a session.
5. WHEN session validation later runs on tenant A with a session for tenant B THEN `SessionService.validateTenantSession()` SHALL continue rejecting it.

**Independent Test**: Callback service/controller tests mock a Google profile and assert session creation uses the state tenant, non-members are blocked, and existing tenant mismatch validation remains intact.

---

### P1: Set Cross-Subdomain Session Cookies Safely

**User Story**: As a club user, I want the session created on `auth.<domain>` to be available to `tenant.<domain>` in production while local development keeps working in browsers.

**Why P1**: Cookie domain behavior differs between production domains and localhost.

**Acceptance Criteria**:

1. WHEN `NODE_ENV=production` and `ROOT_DOMAIN` is not `localhost` THEN session cookies SHALL include `Domain=.${ROOT_DOMAIN}`.
2. WHEN the app runs on `localhost` THEN session cookies SHALL NOT include a `Domain` attribute.
3. WHEN cookies are set or cleared THEN options SHALL keep `HttpOnly`, `Secure` in production, `SameSite=Lax`, and `Path=/`.
4. WHEN cookie clearing runs in production THEN it SHALL use the same domain option as cookie setting.

**Independent Test**: Cookie helper tests assert production domain inclusion, localhost domain omission, and clear/set option parity.

---

### P1: Redirect Back To Tenant Frontend

**User Story**: As a club user, I want to return to the tenant club page after Google login so that the login flow ends in the app I started from.

**Why P1**: Central auth callback runs on `auth.<domain>`, so the backend must intentionally construct the tenant frontend URL.

**Acceptance Criteria**:

1. WHEN callback succeeds THEN the backend SHALL construct the final URL from `TENANT_FRONTEND_URL` for protocol, port, and default path.
2. WHEN callback succeeds for tenant slug `tenant` THEN the final redirect host SHALL be `tenant.<ROOT_DOMAIN>` for subdomain-based environments.
3. WHEN development uses root `localhost` THEN the final redirect SHALL support `tenant.localhost:5173`.
4. WHEN state contains an internal `returnTo` THEN final redirect SHALL use that path.
5. WHEN state has no valid `returnTo` THEN final redirect SHALL default to `/club`.

**Independent Test**: Redirect builder tests cover localhost, production-like root domains, `returnTo=/club`, nested internal paths, and default path.

---

### P2: Preserve System Admin OAuth

**User Story**: As a system admin, I want `/v1/system/auth/google` to keep working so that tenant login changes do not regress admin access.

**Why P2**: The system flow shares Google strategy, session cookies, and users, but it uses different host constraints and session scoping.

**Acceptance Criteria**:

1. WHEN `/v1/system/auth/google` starts OAuth THEN it SHALL continue using the existing system host guard behavior.
2. WHEN `/v1/system/auth/google/callback` succeeds THEN it SHALL continue creating a system session with `tenantId=null`.
3. WHEN tenant Google state changes are added THEN they SHALL NOT require state payload validation for the system admin flow unless the existing system flow explicitly opts in.
4. WHEN system admin tests run THEN existing host guard, role, and callback behavior SHALL remain passing.

**Independent Test**: Existing system auth tests pass after the tenant centralization changes.

---

## Edge Cases

- WHEN `tenant` query contains an array, blank value, malformed slug, or reserved slug THEN OAuth start SHALL reject it.
- WHEN `returnTo` does not start with exactly one `/` THEN OAuth start or state validation SHALL reject it.
- WHEN `returnTo` parses to a URL with origin or hostname THEN it SHALL be rejected.
- WHEN the state payload is base64-valid but JSON-invalid THEN callback SHALL reject it.
- WHEN `SESSION_SECRET` changes between start and callback THEN callback SHALL reject state and SHALL NOT create a session.
- WHEN the callback request host is `auth.<ROOT_DOMAIN>` THEN callback SHALL not call `CurrentContextService.getTenantOrThrow()`.
- WHEN `RESERVED_TENANT_SUBDOMAINS` is unset THEN defaults SHALL include `auth`, `api`, and `www`.
- WHEN the Google Console is configured for tenant OAuth THEN it SHALL only need the central redirect URI: `auth.<ROOT_DOMAIN>/v1/auth/google/callback`.

---

## Requirement Traceability

| Requirement ID | Story                                                | Status   |
| -------------- | ---------------------------------------------------- | -------- |
| CGL-01         | P1: Start Tenant Google Login From Central Auth Host | Verified |
| CGL-02         | P1: Protect OAuth State                              | Verified |
| CGL-03         | P1: Complete Tenant Login From Validated State       | Verified |
| CGL-04         | P1: Set Cross-Subdomain Session Cookies Safely       | Verified |
| CGL-05         | P1: Redirect Back To Tenant Frontend                 | Verified |
| CGL-06         | P2: Preserve System Admin OAuth                      | Verified |

Coverage: 6 total, 6 mapped to tasks, 6 verified, 0 unmapped.

## Success Criteria

- [ ] `tenant.localhost.test:5173/club/login` starts Google login at `api.localhost.test:3001/v1/auth/google?tenant=tenant&returnTo=/club`.
- [ ] Google tenant callback creates an `identity_sessions` row scoped to the tenant from signed state.
- [ ] Users without active membership in the state tenant remain blocked.
- [ ] Production cookies include `Domain=.${ROOT_DOMAIN}` and localhost cookies omit `Domain`.
- [ ] Final tenant redirect uses the validated tenant slug and internal `returnTo`.
- [ ] System admin auth tests still pass.
- [ ] `pnpm --filter @pong-ping/api test`, `pnpm --filter @pong-ping/frontend test`, and relevant builds pass.
