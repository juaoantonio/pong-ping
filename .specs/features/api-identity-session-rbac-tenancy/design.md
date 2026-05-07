# API Identity Session RBAC Tenancy Design

**Spec**: `.specs/features/api-identity-session-rbac-tenancy/spec.md`
**Context**: `.specs/features/api-identity-session-rbac-tenancy/context.md`
**Status**: Draft

---

## Architecture Overview

The identity module becomes a NestJS feature module with TypeORM entities, guards, middleware, decorators, and services. Passport is used only to run the Google OAuth strategy. After OAuth callback, application code creates its own opaque server-side session and stores only the token hash in PostgreSQL.

Request flow:

```text
HTTP request
  -> ClsModule middleware opens request context
  -> TenantMiddleware resolves host subdomain and sets CLS tenant
  -> SessionMiddleware reads signed cookie value, validates session hash, sets CLS principal
  -> GlobalAuthorizationGuard applies @Public / explicit roles / default system_admin
  -> Controller/service uses typed CLS context and tenant-scoped repositories
```

OAuth flow:

```text
GET /auth/google on {tenant}.domain
  -> tenant resolved
  -> Passport google guard redirects to Google
GET /auth/google/callback on tenant host
  -> Passport validates Google profile
  -> AuthService upserts/links user
  -> membership in CLS tenant is required
  -> SessionService creates opaque session
  -> cookie is set
```

## Code Reuse Analysis

| Existing Component | Location | How to Use |
| --- | --- | --- |
| Config validation | `apps/api/src/common/config/config.module.ts` | Add auth/session/tenant env schema using current Joi pattern. |
| Database setup | `apps/api/src/common/database/database.module.ts` | Keep `autoLoadEntities`; identity module registers entities with `TypeOrmModule.forFeature`. |
| Audit base entity | `apps/api/src/common/shared/entities/base-audit.entity.ts` | Extend for identity/session/tenant entities. |
| App bootstrap | `apps/api/src/app.module.ts`, `apps/api/src/configure-app.ts` | Register identity module, CLS, and global guard without changing response envelope behavior. |
| Exception handling | `apps/api/src/common/shared/errors`, `global-exception.filter.ts` | Throw existing `AppException`/Nest exceptions consistently so error envelope remains stable. |
| Domain independence test | `apps/api/test/domain/framework-independence.spec.ts` | Keep core framework-free; update scan scope if new identity framework code is outside `domain`. |

No `codenavi` or `mermaid-studio` skill was found locally, so repository exploration used built-in tools and diagrams are plain text.

## Components

### IdentityModule

- **Purpose**: Own authentication, identity persistence, sessions, role assignment, tenant membership, and guards.
- **Location**: `apps/api/src/modules/identity/`
- **Imports**: `TypeOrmModule.forFeature([...identity entities...])`, `PassportModule`, config.
- **Exports**: `IdentityAccessService`, `CurrentIdentityContext`, role decorators/guards as needed by other modules.
- **Reuses**: Nest module patterns already used by `HealthModule`, `DatabaseModule`, and shared config.

### ClsContextModule

- **Purpose**: Configure typed request context globally.
- **Location**: `apps/api/src/common/context/`
- **Interfaces**:
  - `IdentityRequestContext` with `requestId`, `tenant`, `principal`.
  - `CurrentContextService.getTenantOrThrow()`.
  - `CurrentContextService.getPrincipalOrThrow()`.
- **Dependencies**: `nestjs-cls`.
- **Reuses**: existing request-id middleware can continue to set request IDs; CLS stores the identity/tenant context.

### TenantMiddleware and TenantResolver

- **Purpose**: Resolve tenant from the first host subdomain and store it in CLS.
- **Location**: `apps/api/src/modules/identity/tenancy/`
- **Interfaces**:
  - `resolveHost(host: string): TenantHostResolution`.
  - `TenantResolver.resolveActiveTenantBySlug(slug: string): Promise<TenantEntity>`.
  - `TenantMiddleware.use(req, res, next)`.
- **Dependencies**: `TenantEntity` repository, config `ROOT_DOMAIN`, reserved subdomain list.
- **Behavior**: Does not trust tenant ID from query/body/header; only host-derived slug.

### SessionService and SessionMiddleware

- **Purpose**: Implement server-side sessions without session libraries.
- **Location**: `apps/api/src/modules/identity/session/`
- **Interfaces**:
  - `createSession(input: { userId: string; tenantId: string; userAgent?: string; ip?: string }): Promise<SessionToken>`.
  - `validateSession(rawToken: string, tenantId: string): Promise<IdentityPrincipal | null>`.
  - `revokeSession(sessionId: string): Promise<void>`.
  - `clearExpiredSessions(now: Date): Promise<number>`.
- **Dependencies**: `crypto.randomBytes`, HMAC/SHA-256 token hashing, session repository, user/membership/role repositories.
- **Cookie**: HTTP-only, `sameSite: "lax"`, `secure` in production, configurable name and TTL.
- **Security**: raw token exists only in the cookie and request memory; database stores token hash.

### GoogleOAuthStrategy and AuthController

- **Purpose**: Start and complete Google OAuth, then create application-owned session.
- **Location**: `apps/api/src/modules/identity/auth/`
- **Interfaces**:
  - `GET /auth/google`.
  - `GET /auth/google/callback`.
  - `POST /auth/logout`.
  - `GET /auth/me`.
- **Dependencies**: `@nestjs/passport`, `passport-google-oauth20`, `AuthService`, `SessionService`.
- **Notes**: Do not configure Passport sessions or serializers.

### Authorization Decorators and Global Guard

- **Purpose**: Enforce secure-by-default authorization.
- **Location**: `apps/api/src/modules/identity/authorization/`
- **Interfaces**:
  - `@Public()`.
  - `@RequireSystemRoles(...roles: SystemRole[])`.
  - `@RequireTenantRoles(...roles: TenantRole[])`.
  - `IdentityAuthorizationGuard.canActivate(context)`.
- **Default Rule**: If no authorization metadata exists, require authenticated `system_admin`.
- **Tenant Rule**: Tenant role requirements also require active membership in current tenant.
- **Dependencies**: Nest `Reflector`, CLS context, identity role services.

### TenantScopedRepository

- **Purpose**: Centralize tenant filtering for shared-table business entities.
- **Location**: `apps/api/src/common/database/tenancy/`
- **Interfaces**:
  - `find(options?)`.
  - `findOne(options?)`.
  - `create(data)`.
  - `save(entity)`.
  - `createQueryBuilder(alias)`.
- **Dependencies**: TypeORM `Repository<T>`, CLS context.
- **Behavior**: Adds `tenant_id = currentTenantId` automatically and rejects missing/mismatched tenant.

### CoreIdentityTranslator

- **Purpose**: Convert identity principal data into core-owned terms outside the pure domain layer.
- **Location**: `apps/api/src/modules/core/application/identity/` or equivalent application adapter path.
- **Interfaces**:
  - `toActorId(principal: IdentityPrincipal): ActorId`.
  - `toTenantClubId(contextTenant: TenantContext): ClubId` only if the application explicitly maps tenant to club.
- **Constraint**: No core `domain` file imports identity module paths.

## Data Models

### TenantEntity

```typescript
type TenantEntity = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

**Relationships**: Owns memberships and sessions; is the source of tenant context.

### IdentityUserEntity

```typescript
type IdentityUserEntity = {
  id: string;
  googleSubject: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

**Relationships**: Has tenant memberships, system role assignments, and sessions.

### TenantMembershipEntity

```typescript
type TenantMembershipEntity = {
  id: string;
  tenantId: string;
  userId: string;
  roles: TenantRole[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

**Relationships**: Connects a user to one tenant and stores tenant roles only.

### SystemRoleAssignmentEntity

```typescript
type SystemRoleAssignmentEntity = {
  id: string;
  userId: string;
  role: SystemRole;
  createdAt: Date;
};
```

**Relationships**: User-level platform role assignment, independent of tenant.

### SessionEntity

```typescript
type SessionEntity = {
  id: string;
  tokenHash: string;
  userId: string;
  tenantId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

**Relationships**: Belongs to one user and one tenant. Validation requires active user, active tenant, active membership for that tenant, not expired, not revoked.

### TenantScopedEntity

```typescript
type TenantScopedEntity = {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Relationships**: Base for future business TypeORM entities in shared-table tenancy.

## Error Handling Strategy

| Error Scenario | Handling | HTTP Impact |
| --- | --- | --- |
| Missing/invalid session | Throw unauthorized exception | 401 |
| Missing tenant for tenant route | Throw forbidden or not found exception | 403 or 404 depending route type |
| Unknown/inactive tenant host | Throw forbidden exception for protected routes | 403 |
| Undecorated route without `system_admin` | Throw forbidden exception | 403 |
| Tenant role route without membership | Throw forbidden exception | 403 |
| Session tenant differs from host tenant | Revoke or reject session; no CLS principal | 401 |
| Token hash not found | Treat as unauthenticated | 401 |
| Mismatched tenant save/update | Throw application exception before write | 403/422 depending existing error conventions |

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Identity layering | Nest/TypeORM-first module | Generic auth domain benefits from framework integration and should not force DDD purity. |
| Session storage | App-owned opaque sessions in Postgres | Satisfies session-based auth without a session library and supports revocation. |
| OAuth | Passport Google strategy only | Reuses supported Nest Passport strategy for provider protocol while keeping sessions app-owned. |
| Authorization default | `system_admin` required | Secure-by-default behavior prevents accidental exposure. |
| Tenant context | Subdomain + CLS | Centralizes trusted request context without passing tenant IDs through every method. |
| Tenant filtering | Tenant-scoped repository + subscriber validation | Prevents scattered manual filters and catches mismatched writes. |
| ABAC | Not implemented | User explicitly narrowed v1 to RBAC. |
| Migrations | None | User requested TypeORM entities without migrations for now. |

## Open Implementation Notes

- Cookie signing can be implemented with HMAC over the random token or by using a random token with only hashed persistence; either way the database token hash is authoritative.
- Session cleanup can be synchronous on validation for expired sessions plus a later scheduled job; no scheduler is required for v1.
- If current domain-independence test scans every folder named `domain`, the new identity module should avoid `identity/domain` entirely or the test should be narrowed to `core/**/domain`.
