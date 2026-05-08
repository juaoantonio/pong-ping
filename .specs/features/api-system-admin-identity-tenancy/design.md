# API System Admin Identity Tenancy Design

**Spec**: `.specs/features/api-system-admin-identity-tenancy/spec.md`
**Context**: `.specs/features/api-system-admin-identity-tenancy/context.md`
**Status**: Draft

---

## Architecture Overview

Add a separate system administration surface inside the identity module. Tenant routes continue to use host-resolved tenant context and tenant-bound sessions. System routes run only on root/reserved hosts, authenticate through Google OAuth, and create sessions whose `tenantId` is `null`.

```mermaid
flowchart TD
  A[Reserved/root host request] --> B[SystemHostGuard]
  B --> C[System Google OAuth]
  C --> D[AuthService links or creates identity user]
  D --> E{Has system_admin?}
  E -->|yes| F[SessionService creates system session tenantId null]
  E -->|no| G[403 no session]
  F --> H[/system/admin controllers]
  H --> I[SystemAdminService]
  I --> J[identity_tenants]
  I --> K[identity_users]
  I --> L[identity_tenant_memberships]
```

Tenant request flow remains:

```text
tenant host -> TenantMiddleware sets CLS tenant -> SessionMiddleware validates tenant session -> tenant role guard
```

System request flow becomes:

```text
reserved/root host -> TenantMiddleware leaves tenant empty -> System session middleware path validates cookie -> system role guard
```

## Code Reuse Analysis

| Existing Component | Location | How to Use |
| --- | --- | --- |
| Identity entities | `apps/api/src/modules/identity/entities/` | Extend users/sessions for pending users and system sessions; reuse tenant and membership models. |
| `TenantResolver.parseHost` | `apps/api/src/modules/identity/tenancy/tenant.resolver.ts` | Build reserved/root-host validation without duplicating root-domain parsing rules. |
| Session cookie helpers | `apps/api/src/modules/identity/session/cookies.ts` | Use the same opaque HTTP-only cookie for system auth. |
| `SessionService` | `apps/api/src/modules/identity/session/session.service.ts` | Add tenant and system validation methods while preserving hashing/revocation. |
| `AuthService` | `apps/api/src/modules/identity/auth/auth.service.ts` | Add pending-user linking and system login completion. |
| RBAC decorators/guard | `apps/api/src/modules/identity/authorization/` | Use `@RequireSystemRoles("system_admin")` on system controllers. |
| Validation pipe and exception envelope | `apps/api/src/common/shared/validation`, `filters` | Use class-validator DTOs and existing Nest exceptions for consistent API responses. |

No `.specs/codebase/CONCERNS.md` exists. No `codenavi` or `mermaid-studio` skill is installed in the provided skill list, so code exploration used built-in tools and diagrams are inline Mermaid.

## Components

### SystemAuthController

- **Purpose**: Start and complete reserved-host Google OAuth for system administrators.
- **Location**: `apps/api/src/modules/identity/system/system-auth.controller.ts`
- **Interfaces**:
  - `GET /system/auth/google`
  - `GET /system/auth/google/callback`
  - `POST /system/auth/logout`
  - `GET /system/auth/me`
- **Dependencies**: `GoogleOAuthGuard`, `AuthService`, `SessionService`, `CurrentContextService`, session cookie helpers.
- **Reuses**: Existing OAuth strategy and cookie behavior.

### SystemHostGuard

- **Purpose**: Ensure `/system/**` routes are reachable only from root or reserved hosts.
- **Location**: `apps/api/src/modules/identity/system/system-host.guard.ts`
- **Interfaces**:
  - `canActivate(context: ExecutionContext): boolean`
  - `isSystemHost(host: string | undefined): boolean`
- **Dependencies**: `TenantResolver.parseHost`, request host headers.
- **Behavior**: Allows `missing` for root domain and `reserved`; rejects `resolved`, `unknown`, `inactive`, and `invalid_root`.

### SystemAdminController

- **Purpose**: Expose tenant and membership administration endpoints.
- **Location**: `apps/api/src/modules/identity/system/system-admin.controller.ts`
- **Interfaces**:
  - `GET /system/admin/tenants`
  - `POST /system/admin/tenants`
  - `PATCH /system/admin/tenants/:tenantId`
  - `GET /system/admin/tenants/:tenantId/memberships`
  - `POST /system/admin/tenants/:tenantId/memberships`
  - `PATCH /system/admin/tenants/:tenantId/memberships/:membershipId`
  - `DELETE /system/admin/tenants/:tenantId/memberships/:membershipId`
- **Dependencies**: `SystemAdminService`, DTOs, `@RequireSystemRoles("system_admin")`, `SystemHostGuard`.
- **Reuses**: Existing global response envelope and validation pipe.

### SystemAdminService

- **Purpose**: Coordinate tenant lifecycle and access changes transactionally.
- **Location**: `apps/api/src/modules/identity/system/system-admin.service.ts`
- **Interfaces**:
  - `listTenants(): Promise<SystemTenantDto[]>`
  - `createTenant(input: CreateSystemTenantInput): Promise<SystemTenantDto>`
  - `updateTenant(id: string, input: UpdateSystemTenantInput): Promise<SystemTenantDto>`
  - `listMemberships(tenantId: string): Promise<SystemMembershipDto[]>`
  - `upsertMembership(tenantId: string, input: UpsertSystemMembershipInput): Promise<SystemMembershipDto>`
  - `updateMembership(tenantId: string, membershipId: string, input: UpdateSystemMembershipInput): Promise<SystemMembershipDto>`
  - `deactivateMembership(tenantId: string, membershipId: string): Promise<void>`
- **Dependencies**: TypeORM repositories and `DataSource.transaction`.
- **Reuses**: Identity entities and role constants.

### IdentityUser Linking

- **Purpose**: Support pending email users created before first Google login.
- **Location**: `apps/api/src/modules/identity/auth/auth.service.ts`
- **Interfaces**:
  - `completeGoogleLogin(...)` links pending users before tenant membership check.
  - `completeSystemGoogleLogin(...)` links pending users and requires `system_admin`.
  - `findOrCreatePendingUserByEmail(email: string): Promise<IdentityUserEntity>` can live in `SystemAdminService` or a small private helper.
- **Dependencies**: `IdentityUserEntity`, `SystemRoleAssignmentEntity`, `TenantMembershipEntity`.

### SessionService System Path

- **Purpose**: Distinguish tenant-bound and system-scoped session validation.
- **Location**: `apps/api/src/modules/identity/session/session.service.ts`
- **Interfaces**:
  - `createTenantSession(input: { userId; tenantId; ... })` or preserve `createSession` for tenant path.
  - `createSystemSession(input: { userId; ... })`
  - `validateTenantSession(rawToken, tenantId): Promise<IdentityPrincipal>`
  - `validateSystemSession(rawToken): Promise<IdentityPrincipal>`
- **Dependencies**: Existing token hashing, user repository, role repositories.
- **Behavior**: System validation requires active user and `system_admin`, does not require tenant or membership.

## Data Models

### IdentityUserEntity Changes

```typescript
type IdentityUserEntity = {
  id: string;
  googleSubject: string | null;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

**Relationships**: Pending users have email and active status, but `googleSubject` is null until first Google login.

### IdentitySessionEntity Changes

```typescript
type IdentitySessionEntity = {
  id: string;
  tokenHash: string;
  userId: string;
  tenantId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
};
```

**Relationships**: Tenant relationship is nullable. `tenantId: null` means system-scoped session.

### Tenant Membership

No new entity is needed. The existing `TenantMembershipEntity` remains authoritative for tenant access.

```typescript
type TenantMembershipEntity = {
  id: string;
  tenantId: string;
  userId: string;
  roles: TenantRole[];
  active: boolean;
};
```

## Error Handling Strategy

| Error Scenario | Handling | HTTP Impact |
| --- | --- | --- |
| System route on tenant subdomain | `ForbiddenException` from `SystemHostGuard` | 403 |
| System OAuth user lacks `system_admin` | `ForbiddenException`; no session is saved | 403 |
| Invalid email, slug, or role payload | DTO validation or service validation | 400 |
| Duplicate tenant slug | Conflict exception or mapped unique violation | 409 |
| Tenant or membership not found | `NotFoundException` | 404 |
| Pending user email conflicts with another Google subject | `ConflictException` | 409 |
| Deactivating tenant | Existing tenant session validation fails on later requests | 401 |
| Empty owner/admin coverage in tenant | Reject if update would leave no active owner/admin | 400 |

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| System session shape | Nullable `tenantId` on session | Reuses opaque session storage while representing tenant-independent auth clearly. |
| Pending user support | Nullable `googleSubject` | Allows access provisioning by email before first Google login. |
| Host protection | Dedicated system-host guard | Keeps route-level intent explicit and avoids weakening tenant middleware. |
| Invites | No invite model or route | Matches user decision and reduces identity scope. |
| Tenant bootstrap role | Default `owner`, optionally `admin` | Creates usable tenant access while preserving role separation. |
