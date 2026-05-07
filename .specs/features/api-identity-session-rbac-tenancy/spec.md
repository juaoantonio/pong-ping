# API Identity Session RBAC Tenancy Specification

## Problem Statement

`apps/api/src/modules/identity` currently models identity as a pure domain concept, but authentication, sessions, tenant membership, and access control are generic platform concerns that should be close to NestJS and TypeORM. The API also needs a secure default authorization posture: an endpoint without explicit authorization metadata must not accidentally become available to tenant users.

This feature rebuilds identity as a framework-coupled module with Google OAuth, in-house server-side sessions, tenant resolution from subdomain, centralized tenant scoping, and RBAC separated between system and tenant roles. The core sports domain remains framework-free and receives identity information only through translation adapters.

## Goals

- [ ] Replace the current pure `identity/domain` model with a NestJS/TypeORM identity module.
- [ ] Authenticate users through Google OAuth and create an in-house session using an opaque HTTP-only cookie.
- [ ] Resolve tenant context from the request host subdomain and store it in CLS.
- [ ] Enforce secure-by-default authorization: no decorator means `system_admin` required.
- [ ] Support separate system roles and tenant roles.
- [ ] Validate tenant membership before allowing tenant-scoped actions.
- [ ] Centralize tenant scoping for shared-table business data.
- [ ] Keep core domain free of authentication, tenant, NestJS, Passport, CLS, and TypeORM terms.

## Out of Scope

| Feature | Reason |
| --- | --- |
| ABAC enforcement | User explicitly requested RBAC only for now. |
| Email/password login | Google OAuth is the selected authentication surface. |
| `express-session` or session libraries | User explicitly requested no library for session-based auth. |
| `passport.session()` serializer/deserializer | Session persistence is owned by the app, not Passport. |
| Database migrations | TypeORM entities only for now. |
| PostgreSQL Row-Level Security | Tenant scoping is centralized at application/repository level in v1. |
| Custom tenant domains | v1 tenant source is first host subdomain slug. |
| Frontend login UI | This spec covers the API module and contracts only. |

---

## User Stories

### P1: Google OAuth With In-House Session

**User Story**: As a user, I want to authenticate with Google so that the API can establish a secure server-side session for my tenant.

**Why P1**: Authentication is the entry point for all protected behavior.

**Acceptance Criteria**:

1. WHEN `GET /auth/google` is called on a tenant subdomain THEN the system SHALL resolve the tenant and start Google OAuth.
2. WHEN Google OAuth callback succeeds THEN the system SHALL create or update the identity user from the Google profile.
3. WHEN callback succeeds for a user with active tenant membership THEN the system SHALL create a server-side session row and set an opaque HTTP-only cookie.
4. WHEN callback succeeds for a user without active membership in the current tenant THEN the system SHALL reject login and SHALL NOT create a session.
5. WHEN `POST /auth/logout` is called with a valid session THEN the system SHALL revoke that session and clear the cookie.
6. WHEN a request contains an expired, revoked, missing, or unknown session token THEN the system SHALL treat the request as unauthenticated.

**Independent Test**: Mock the Google strategy profile, complete callback, assert a hashed session is persisted, cookie is set, `/auth/me` resolves the user, and logout revokes the session.

---

### P1: Tenant Resolution Through CLS

**User Story**: As a platform operator, I want tenant context resolved from subdomain and stored in request context so handlers cannot trust client-supplied tenant IDs.

**Why P1**: Tenant isolation is a security boundary.

**Acceptance Criteria**:

1. WHEN a request host is `{slug}.{rootDomain}` THEN the system SHALL resolve `{slug}` against active tenants.
2. WHEN the subdomain is missing, reserved, inactive, or unknown THEN tenant-protected routes SHALL reject the request.
3. WHEN tenant resolution succeeds THEN the system SHALL store `tenantId` and `tenantSlug` in CLS.
4. WHEN request body, query, or headers contain tenant identifiers THEN authorization and tenant scope SHALL NOT trust those values.
5. WHEN code needs tenant context outside controllers THEN it SHALL read the typed CLS context instead of passing tenant IDs manually.

**Independent Test**: Middleware tests exercise valid subdomain, missing subdomain, reserved subdomain, inactive tenant, and mismatched client-supplied tenant ID.

---

### P1: Secure-By-Default RBAC

**User Story**: As a maintainer, I want every protected endpoint to require `system_admin` unless a route explicitly declares a different authorization rule.

**Why P1**: Safe defaults prevent accidental exposure when new endpoints are added.

**Acceptance Criteria**:

1. WHEN a route has no authorization decorator THEN the global authorization guard SHALL require an authenticated user with `system_admin`.
2. WHEN a route uses `@RequireSystemRoles(...)` THEN the guard SHALL require one of those explicit system roles instead of the default.
3. WHEN a route uses `@RequireTenantRoles(...)` THEN the guard SHALL require active membership in the current tenant and one of those explicit tenant roles.
4. WHEN a route uses `@Public()` THEN the guard SHALL bypass authentication and RBAC only for that route.
5. WHEN an authenticated user lacks the required role THEN the system SHALL return a forbidden response.

**Independent Test**: E2E or guard tests define throwaway controllers for undecorated, public, system-role, and tenant-role routes and assert the expected allow/deny matrix.

---

### P1: Centralized Tenant-Scoped Data Access

**User Story**: As a maintainer, I want tenant filtering centralized so business code cannot forget `tenant_id` filters.

**Why P1**: Manual tenant filters across services are brittle and create cross-tenant leakage risk.

**Acceptance Criteria**:

1. WHEN a business TypeORM entity is tenant-owned THEN it SHALL include `tenant_id`.
2. WHEN a tenant-scoped repository reads data THEN it SHALL apply the current CLS `tenantId`.
3. WHEN a tenant-scoped repository creates data THEN it SHALL set `tenant_id` from CLS.
4. WHEN a save/update tries to use a different `tenant_id` than CLS THEN the system SHALL reject the operation.
5. WHEN tenant context is missing for tenant-scoped access THEN the system SHALL reject the operation before querying.

**Independent Test**: Repository tests create records for two tenants and prove tenant A cannot read, save, or update tenant B data through the tenant-scoped repository.

---

### P1: Core Identity Translation Boundary

**User Story**: As a core-domain maintainer, I want core modules to speak in sports-domain terms and avoid authentication terms.

**Why P1**: Core is the differentiating domain and must remain independent from generic identity infrastructure.

**Acceptance Criteria**:

1. WHEN core domain files need an actor/user reference THEN they SHALL use a core-owned ID type, not `identity/domain`.
2. WHEN identity principal data is passed into core use cases THEN a translation adapter SHALL convert it outside the domain layer.
3. WHEN `framework-independence` tests run THEN core domain files SHALL remain free of NestJS, TypeORM, Passport, and CLS imports.
4. WHEN the new identity module uses TypeORM or NestJS decorators THEN those files SHALL NOT live under a path covered as core domain.

**Independent Test**: Static domain-independence tests pass after removing core imports from `identity/domain`.

---

### P2: Identity Administration Seeds and Entities

**User Story**: As a platform operator, I want identity entities and role assignments represented explicitly so bootstrap/admin flows can manage access later.

**Why P2**: The module needs durable storage for users, tenants, memberships, roles, and sessions before full admin UI exists.

**Acceptance Criteria**:

1. WHEN identity entities are registered THEN TypeORM SHALL know tenants, users, memberships, system role assignments, and sessions.
2. WHEN tenant roles are stored THEN they SHALL be distinct from system role assignments.
3. WHEN system roles are stored THEN they SHALL not require a tenant.
4. WHEN sessions are stored THEN raw cookie tokens SHALL never be persisted; only a hash SHALL be stored.

**Independent Test**: Entity metadata tests or repository tests verify relations, uniqueness constraints, and session token hashing behavior.

---

## Edge Cases

- WHEN a tenant slug is unknown THEN the request SHALL fail without falling back to a default tenant.
- WHEN the host is `api`, `www`, or another reserved subdomain THEN tenant middleware SHALL not treat it as tenant context.
- WHEN Google returns an email already linked to another Google subject THEN the login SHALL be rejected unless the existing linked identity matches.
- WHEN a session token is valid but belongs to a different tenant than the current host THEN the request SHALL be rejected.
- WHEN a user has system roles but no tenant membership THEN system-role routes MAY pass, but tenant-role routes SHALL fail.
- WHEN an endpoint should be accessible to authenticated tenant users THEN it MUST use an explicit tenant role decorator.
- WHEN an implementer adds a controller without decorators THEN only `system_admin` SHALL be able to call it.
- WHEN `DB_SYNCHRONIZE` is false THEN no migration is generated by this feature.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| IDR-01 | P1: Google OAuth With In-House Session | In Tasks |
| IDR-02 | P1: Tenant Resolution Through CLS | In Tasks |
| IDR-03 | P1: Secure-By-Default RBAC | In Tasks |
| IDR-04 | P1: Centralized Tenant-Scoped Data Access | In Tasks |
| IDR-05 | P1: Core Identity Translation Boundary | In Tasks |
| IDR-06 | P2: Identity Administration Seeds and Entities | In Tasks |

Coverage: 6 total, 6 mapped to tasks, 0 verified, 0 unmapped.

## Success Criteria

- [ ] API compiles with a framework-coupled identity module and no pure `identity/domain` dependency from core.
- [ ] Google OAuth creates in-house sessions without session libraries.
- [ ] Undecorated protected routes require `system_admin`.
- [ ] Tenant-role routes require active tenant membership and explicit tenant role.
- [ ] Tenant-scoped repositories prevent cross-tenant reads and writes.
- [ ] `pnpm --filter @pong-ping/api test` passes with existing tests preserved and new security tests added.
- [ ] `pnpm --filter @pong-ping/api build` passes.
