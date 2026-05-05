# Multitenancy Specification

## Problem Statement

The application has a partial multitenancy data model: `Tenant` exists and many tenant-owned tables already have `tenantId`, but runtime behavior still acts as single-tenant. Authentication does not load tenant context, Auth.js still expects globally unique user email and provider accounts, admin/read queries are mostly unscoped, and domain use cases can create or fetch tenant-owned records without a tenant boundary.

Tenant isolation is a security requirement. A user in one tenant must not be able to read, mutate, join, invite into, rank against, or audit data from another tenant.

## Goals

- [ ] Use shared tables with `tenantId` as the v1 isolation model.
- [ ] Resolve tenant identity from trusted server-side state, not client-supplied `tenant_id`.
- [ ] Support the same email address in different tenants.
- [ ] Require tenant selection or invite-derived tenant context before Google OAuth sign-in.
- [ ] Include tenant context in authenticated server sessions and current-user helpers.
- [ ] Scope all tenant-owned reads, writes, invitations, rankings, matches, tables, queues, users, access allowlists, and audit records.
- [ ] Resolve public tenant pages from trusted tenant subdomains while keeping auth pages outside tenant subdomains.
- [ ] Add full tenant management UI for superadmins and tenant-scoped administration for tenant admins.
- [ ] Add regression tests that prove cross-tenant data access fails.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Database per tenant | v1 uses shared tables with `tenantId`. |
| Schema per tenant | Adds migration/runtime complexity that is not needed for this app size. |
| PostgreSQL Row-Level Security | Valuable hardening layer, but v1 will first centralize app-level tenant scoping and tests. |
| Billing and plans | Tenant settings can be added later after isolation is correct. |
| Rate limits per tenant | Important operational feature, but not required to prevent data leakage in v1. |
| Custom domains | Tenant subdomains are supported in v1; arbitrary custom domains can be added later. |

---

## Requirements

### MT-001: Trusted Tenant Context

**User Story**: As a platform operator, I want the tenant to come from trusted server-side state so users cannot switch tenants by editing request parameters.

**Acceptance Criteria**:

1. WHEN an authenticated request needs tenant context THEN the system SHALL derive it from the authenticated user/session.
2. WHEN a login starts from a tenant slug or invitation THEN the system SHALL store only short-lived server-trusted pending tenant context for OAuth completion.
3. WHEN request query, body, or headers contain a tenant identifier THEN tenant-owned authorization SHALL NOT trust that value by itself.
4. WHEN no trusted tenant can be resolved THEN protected tenant routes SHALL reject the request.

**Independent Test**: A route test sends a mismatched tenant identifier in the body or query and still operates only against the authenticated user's tenant.

### MT-002: Tenant-Aware Authentication and Session

**User Story**: As a user, I want to sign in to a specific tenant with Google so my account and permissions are correct for that tenant.

**Acceptance Criteria**:

1. WHEN a user starts login THEN they SHALL select a tenant slug or arrive through an invitation that identifies a tenant.
2. WHEN Google OAuth completes THEN Auth.js SHALL find or create the user within the selected tenant.
3. WHEN the same email signs into two different tenants THEN each tenant SHALL have its own user record and account association.
4. WHEN `auth()` or `getCurrentUser()` returns a user THEN it SHALL include `tenantId`, tenant slug, tenant name, user id, role, and profile fields.
5. WHEN tenant context is missing or expired during OAuth completion THEN sign-in SHALL fail with a safe login error.

**Independent Test**: Adapter/session tests create two tenants with the same email and assert each login resolves the correct tenant-scoped user.

### MT-003: Tenant-Scoped Data Access

**User Story**: As a tenant user, I want every table, queue, match, ranking, invitation, and admin view to show only my tenant's data.

**Acceptance Criteria**:

1. WHEN querying tenant-owned lists THEN queries SHALL include `tenantId`.
2. WHEN querying tenant-owned records by id or token THEN queries SHALL validate the record belongs to the current tenant unless the token itself is the trusted entry point.
3. WHEN creating tenant-owned records THEN writes SHALL set `tenantId` from the actor or trusted invitation context.
4. WHEN updating or deleting tenant-owned records THEN mutations SHALL include tenant ownership validation.
5. WHEN a user requests another tenant's resource id THEN the system SHALL return `404` for resource lookup failure.

**Independent Test**: Tenant B cannot fetch, join, update, delete, finish a match, or rollback a match for Tenant A's table.

### MT-004: Tenant-Scoped Identity Constraints

**User Story**: As a platform operator, I want identity uniqueness to reflect tenant boundaries so separate organizations can invite the same email independently.

**Acceptance Criteria**:

1. WHEN a user email is stored THEN uniqueness SHALL be scoped by `(tenantId, email)`.
2. WHEN a Google provider account is stored THEN uniqueness SHALL be scoped by `(tenantId, provider, providerAccountId)`.
3. WHEN an allowed email is stored THEN uniqueness SHALL be scoped by `(tenantId, email)`.
4. WHEN existing single-tenant data is migrated THEN it SHALL be assigned to the default tenant.

**Independent Test**: The same email can be allowed and used in two tenants without unique constraint conflicts.

### MT-005: Tenant Admin UI

**User Story**: As a superadmin, I want to create and manage tenants from the app so tenant onboarding does not require manual database edits.

**Acceptance Criteria**:

1. WHEN a superadmin opens tenant administration THEN they SHALL see tenant list and creation controls.
2. WHEN a tenant is created THEN the system SHALL create a unique slug and display name.
3. WHEN an admin opens existing admin pages THEN users, access, tables, rounds, and invitations SHALL be scoped to their tenant.
4. WHEN a non-superadmin tries to access global tenant administration THEN the system SHALL deny access.

**Independent Test**: Superadmin can create a tenant, and tenant admins cannot access global tenant management.

### MT-006: Tenant-Scoped Invitations and Access

**User Story**: As an admin, I want invitations and allowed emails to belong to a tenant so access grants cannot leak across organizations.

**Acceptance Criteria**:

1. WHEN an access invitation is created THEN it SHALL store the creator tenant.
2. WHEN an access invitation is claimed THEN `AllowedEmail` SHALL be created or reused only inside that invitation tenant.
3. WHEN a table invitation is created THEN it SHALL store the table tenant.
4. WHEN a table invitation is claimed THEN membership SHALL be created only if the user belongs to the same tenant.
5. WHEN an invitation is expired or already used THEN existing user-facing error behavior SHALL remain equivalent.

**Independent Test**: Tenant B cannot use Tenant A's table invitation to join a Tenant A table.

### MT-007: Tenant-Aware Audit

**User Story**: As an admin, I want audit logs tied to tenants so support and security review can be tenant-specific.

**Acceptance Criteria**:

1. WHEN a domain or admin action records audit THEN it SHALL include `tenantId`.
2. WHEN an action is denied before a tenant is known THEN metadata SHALL make the missing tenant context explicit.
3. WHEN tenant audit records are listed or queried later THEN the schema SHALL support efficient filtering by tenant and time.

**Independent Test**: Audit unit tests assert tenant id is written for table creation, queue join/leave, invitation use, match finish, rollback, and admin denial.

### MT-008: Cross-Tenant Security Regression Tests

**User Story**: As a maintainer, I want explicit tests for tenant leakage so future changes cannot accidentally remove tenant filters.

**Acceptance Criteria**:

1. WHEN test fixtures create Tenant A and Tenant B data THEN every sensitive route/use case SHALL be tested against cross-tenant access.
2. WHEN a query facade is added for tenant-owned data THEN it SHALL have a tenant-scoping test.
3. WHEN a mutation touches tenant-owned data THEN it SHALL test same-tenant success and cross-tenant failure.

**Independent Test**: The full unit suite includes cross-tenant tests for auth, admin access, tables, queues, matches, rankings, invitations, and audit.

### MT-009: Tenant Subdomain Routing

**User Story**: As a tenant visitor, I want public pages to resolve tenant context from the host subdomain so links like rankings can be shared without requiring login.

**Acceptance Criteria**:

1. WHEN a public page is requested on `{tenant}.<root-domain>` THEN the system SHALL resolve `{tenant}` as the tenant slug and scope public tenant data to that tenant.
2. WHEN a user starts Google login for a tenant THEN the OAuth callback SHALL stay on the current auth host and the final post-auth app redirect SHALL move to that tenant subdomain.
3. WHEN a redirect target is outside the current origin THEN Auth.js SHALL only allow URLs that match configured tenant subdomain rules.
4. WHEN a request is for auth pages or reserved subdomains such as `auth`, `api`, or `www` THEN it SHALL NOT be treated as tenant context.

**Independent Test**: Host utility tests parse valid tenant subdomains, ignore reserved/auth hosts, and allow only tenant-subdomain post-auth redirects.

---

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Pending tenant cookie expires during OAuth | Redirect to login with a tenant-context error. |
| Tenant slug does not exist | Login start fails without starting OAuth. |
| Same email exists in two tenants | Login resolves by pending tenant, not by global email. |
| Superadmin has no tenant context | Global tenant admin is allowed; tenant-scoped pages require selecting or belonging to a tenant. |
| Tenant admin tries to manage another tenant | Return 403 for global admin pages and 404 for tenant-owned resources. |
| Invitation token is valid but user's tenant differs | Reject claim or membership creation with no cross-tenant write. |
| Existing data has no tenant | Migration backfills to default tenant before enforcing non-null constraints. |

## Requirement Traceability

| Requirement | Primary Areas |
| --- | --- |
| MT-001 | auth flow, session helpers, route guards |
| MT-002 | Auth.js adapter, login page/action, session types |
| MT-003 | query facades, routes, domain use cases |
| MT-004 | Prisma schema and migration |
| MT-005 | admin UI and superadmin routes |
| MT-006 | invitations context, access admin |
| MT-007 | audit context |
| MT-008 | unit and route regression tests |
| MT-009 | tenant host resolver, public rankings, auth-safe tenant redirects |
