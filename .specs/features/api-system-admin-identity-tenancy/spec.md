# API System Admin Identity Tenancy Specification

## Problem Statement

The Nest API identity module can authenticate tenant users, resolve tenant subdomains, enforce tenant roles, and default undecorated routes to `system_admin`. It does not yet provide a tenant-independent administration surface for platform operators to create tenants and grant initial access. System administrators need a reserved-host API that manages identity tenants and memberships without relying on a tenant context or invite links.

## Goals

- [ ] Add reserved-host system authentication that creates tenant-independent sessions only for `system_admin` users.
- [ ] Add a system administration API for managing tenants and tenant access from outside tenant subdomains.
- [ ] Bootstrap new tenants with a required owner/admin email and associated subdomain slug.
- [ ] Support pending identity users by email so first Google login can link the Google subject later.
- [ ] Keep existing tenant-scoped OAuth, sessions, RBAC, and tenant isolation behavior intact.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Invite links or token claim flows | User explicitly removed invites from the plan. |
| Sports/core tenant data management | v1 system admin scope is identity tenancy only. |
| Frontend system administration UI | This feature covers Nest API and tests only. |
| Email/password authentication | Existing locked decision is Google OAuth only. |
| ABAC or fine-grained permissions | Existing locked decision is RBAC only. |
| Database migrations | Existing identity-tenancy spec keeps TypeORM entities only for now. |
| Custom domains | Tenant association remains the configured root-domain subdomain slug. |

---

## User Stories

### P1: Reserved-Host System OAuth Session

**User Story**: As a platform operator, I want to sign in on a reserved/root host so that I can administer tenants without being inside any tenant.

**Why P1**: Tenant-independent administration cannot work with the current tenant-bound session validation path.

**Acceptance Criteria**:

1. WHEN `GET /system/auth/google` is called from the root domain or a configured reserved subdomain THEN the system SHALL start Google OAuth without requiring tenant context.
2. WHEN the system OAuth callback succeeds for a user with `system_admin` THEN the system SHALL create a server-side session with no tenant association and set the existing HTTP-only session cookie.
3. WHEN the callback succeeds for a user without `system_admin` THEN the system SHALL reject login and SHALL NOT create a system session.
4. WHEN a system session is used on tenant-role routes THEN the system SHALL reject the request because tenant context and tenant membership are absent.
5. WHEN a tenant-bound session is used on `/system/**` routes THEN the system SHALL reject the request unless it represents a `system_admin` principal and passes system-route host checks.

**Independent Test**: Mock Google profile login on `api.{ROOT_DOMAIN}`, seed a system role assignment, assert a session with `tenantId: null` is persisted, `/system/auth/me` returns a system principal, and a non-system user is denied.

---

### P1: Tenant Creation With Owner/Admin Email

**User Story**: As a system administrator, I want to create a tenant with its subdomain and initial owner/admin email so that the tenant can be accessed without an invite link.

**Why P1**: This is the primary tenant bootstrap workflow requested by the user.

**Acceptance Criteria**:

1. WHEN a `system_admin` posts a valid tenant name, slug, and owner/admin email to `/system/admin/tenants` from a reserved/root host THEN the system SHALL create the tenant using that slug.
2. WHEN tenant creation succeeds THEN the system SHALL create or reuse an identity user for the normalized email.
3. WHEN tenant creation succeeds THEN the system SHALL create an active tenant membership for that user with role `owner` by default or `admin` when explicitly requested.
4. WHEN the slug is invalid, reserved, or already used THEN the system SHALL return a validation or conflict response and SHALL NOT create partial tenant access.
5. WHEN the owner/admin email is invalid THEN the system SHALL reject the request before writing tenant or membership data.

**Independent Test**: Call `POST /system/admin/tenants` as a system admin, then verify tenant, pending user, and owner membership rows exist and no invite row or token is created.

---

### P1: Tenant Access Management

**User Story**: As a system administrator, I want to manage tenant memberships and tenant roles so that I can grant, update, or remove access across tenants.

**Why P1**: Tenant access must be manageable after bootstrap, including fixing incorrect owner/admin assignment.

**Acceptance Criteria**:

1. WHEN a `system_admin` lists memberships for a tenant THEN the system SHALL return users, normalized emails, active status, tenant roles, and creation dates for that tenant only.
2. WHEN a `system_admin` creates membership for an email THEN the system SHALL create or reuse a pending identity user and create or reactivate membership for the target tenant.
3. WHEN a `system_admin` updates membership roles THEN the system SHALL replace tenant roles only and SHALL NOT change system role assignments.
4. WHEN a `system_admin` deactivates or deletes membership THEN future tenant login for that membership SHALL fail unless access is restored.
5. WHEN a requested tenant or membership ID does not exist THEN the system SHALL return not found without leaking other tenant data.

**Independent Test**: Create membership for a second tenant, update roles, deactivate it, and assert tenant OAuth rejects the user while system role assignments are unchanged.

---

### P1: Tenant Listing And Lifecycle Management

**User Story**: As a system administrator, I want to list and update tenants so that I can operate tenant access and disable tenants when needed.

**Why P1**: Operators need visibility and lifecycle control for the tenants they create.

**Acceptance Criteria**:

1. WHEN a `system_admin` lists tenants THEN the system SHALL return tenant ID, name, slug, active status, created date, active membership count, and owner/admin emails.
2. WHEN a `system_admin` updates tenant name or slug THEN the system SHALL validate the new values and preserve slug uniqueness.
3. WHEN a `system_admin` deactivates a tenant THEN tenant-scoped session validation and tenant login for that tenant SHALL fail.
4. WHEN a tenant is reactivated THEN active memberships SHALL be eligible for tenant OAuth login again.
5. WHEN a non-system user calls tenant lifecycle endpoints THEN the system SHALL return forbidden.

**Independent Test**: Toggle a tenant inactive and assert existing tenant session validation fails with inactive tenant, while system admin listing still shows the tenant.

---

## Edge Cases

- WHEN `/system/**` is called from a tenant subdomain THEN the system SHALL reject the request before tenant-specific behavior is used.
- WHEN the host is outside `ROOT_DOMAIN` THEN the system SHALL reject system administration requests.
- WHEN Google returns an email matching a pending user with no Google subject THEN the system SHALL link that user to the Google subject on first login.
- WHEN Google returns an email matching a user linked to a different Google subject THEN the system SHALL reject login.
- WHEN a tenant is created and membership creation fails THEN the system SHALL roll back the tenant creation.
- WHEN an email already has membership in a tenant THEN create membership SHALL be idempotent by reactivating/updating roles rather than creating duplicates.
- WHEN membership roles are empty or include values outside `TENANT_ROLES` THEN the system SHALL reject the request.
- WHEN `owner` is removed from the last active membership THEN the system SHALL allow it in v1 only if another active `admin` or `owner` remains.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| SYSADM-01 | P1: Reserved-Host System OAuth Session | In Tasks |
| SYSADM-02 | P1: Tenant Creation With Owner/Admin Email | In Tasks |
| SYSADM-03 | P1: Tenant Access Management | In Tasks |
| SYSADM-04 | P1: Tenant Listing And Lifecycle Management | In Tasks |

Coverage: 4 total, 4 mapped to tasks, 0 verified, 0 unmapped.

## Success Criteria

- [ ] System admins can log in from reserved/root hosts and receive a tenant-independent session.
- [ ] System admin routes do not require tenant CLS context and are rejected from tenant subdomains.
- [ ] Tenant creation requires `name`, `slug`, and owner/admin email, and creates initial access without invites.
- [ ] Pending identity users can be linked to Google on first login without allowing conflicting Google subjects.
- [ ] Tenant membership and lifecycle changes affect tenant login/session validation as expected.
- [ ] `pnpm --filter @pong-ping/api test` passes.
- [ ] `pnpm --filter @pong-ping/api build` passes.
