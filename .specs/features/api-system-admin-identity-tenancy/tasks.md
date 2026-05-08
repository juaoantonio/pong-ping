# API System Admin Identity Tenancy Tasks

**Design**: `.specs/features/api-system-admin-identity-tenancy/design.md`
**Status**: Draft

---

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| unit | `pnpm --filter @pong-ping/api test` | Use for service, guard, entity, and middleware behavior. |
| e2e | `pnpm --filter @pong-ping/api test:e2e` | Use for request-level `/system/**` behavior if DB services are available. |
| build | `pnpm --filter @pong-ping/api build` | Required after module wiring and DTO/controller changes. |

No `.specs/codebase/TESTING.md` exists, so task test assignments follow existing API package scripts and identity test placement conventions.

## Execution Plan

### Phase 1: Persistence And Session Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: System Authentication

```text
T3 -> T4 -> T5 -> T6
```

### Phase 3: System Administration API

```text
T6 -> T7 -> T8 -> T9
```

### Phase 4: Integration Verification

```text
T9 -> T10 -> T11
```

---

## Task Breakdown

### T1: Support Pending Identity Users

**What**: Make identity users provisionable by email before first Google login.
**Where**: `apps/api/src/modules/identity/entities/identity-user.entity.ts`, `apps/api/src/modules/identity/auth/auth.service.ts`
**Depends on**: None
**Reuses**: Existing `AuthService.upsertGoogleUser` and identity entity tests.
**Requirement**: SYSADM-02, SYSADM-03

**Tools**:

- MCP: Context7 for TypeORM only if decorator/index usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `googleSubject` accepts `null` for pending users.
- [ ] Unique Google subject behavior remains enforced for non-null subjects.
- [ ] Google login links a pending same-email user when `googleSubject` is null.
- [ ] Google login still rejects same-email users linked to a different Google subject.
- [ ] Unit tests cover pending user linking and conflict handling.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): support pending identity users`

---

### T2: Add System-Scoped Session Support

**What**: Allow sessions with no tenant and add separate validation for tenant and system session paths.
**Where**: `apps/api/src/modules/identity/session/`, `apps/api/src/common/context/request-context.types.ts`
**Depends on**: T1
**Reuses**: Existing session hashing, revocation, cookie helpers, and `SessionService` tests.
**Requirement**: SYSADM-01

**Tools**:

- MCP: Context7 for TypeORM only if nullable relation behavior is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `IdentitySessionEntity.tenantId` and tenant relation allow `null`.
- [ ] `IdentityPrincipal.tenantId` is `string | null`.
- [ ] Tenant validation still requires tenant ID, active tenant, and active membership.
- [ ] System validation requires active user and `system_admin`, and does not require tenant or membership.
- [ ] Revocation by ID and token works for both session types.
- [ ] Unit tests cover system session success, missing system role, tenant route rejection for system sessions, and existing tenant validations.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add system scoped sessions`

---

### T3: Route Session Middleware By Host Context

**What**: Teach session middleware to validate system sessions on reserved/root hosts and tenant sessions on tenant hosts.
**Where**: `apps/api/src/modules/identity/session/session.middleware.ts`, `apps/api/src/modules/identity/tenancy/`
**Depends on**: T2
**Reuses**: `TenantResolver.parseHost`, `CurrentContextService`, existing middleware tests.
**Requirement**: SYSADM-01

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Tenant host with tenant context calls tenant session validation.
- [ ] Root/reserved host with cookie calls system session validation.
- [ ] Requests with no cookie remain unauthenticated without error.
- [ ] Invalid system session returns unauthorized consistently.
- [ ] Tenant-scoped routes still fail through tenant role guard when tenant context is missing.
- [ ] Unit tests cover tenant-host and reserved-host middleware branches.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): validate sessions by host context`

---

### T4: Add System Host Guard

**What**: Add a guard that restricts `/system/**` routes to root or reserved subdomains.
**Where**: `apps/api/src/modules/identity/system/system-host.guard.ts`
**Depends on**: T3
**Reuses**: `TenantResolver.parseHost` and Nest guard patterns from authorization tests.
**Requirement**: SYSADM-01

**Tools**:

- MCP: Context7 for Nest guards only if API usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Root domain is accepted.
- [ ] Configured reserved subdomains are accepted.
- [ ] Tenant subdomains are rejected.
- [ ] Unknown, inactive, and invalid-root hosts are rejected.
- [ ] Guard tests cover host matrix and forwarded host handling.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): guard system admin hosts`

---

### T5: Implement System OAuth Controller

**What**: Add reserved-host system OAuth endpoints and system login service path.
**Where**: `apps/api/src/modules/identity/system/system-auth.controller.ts`, `apps/api/src/modules/identity/auth/auth.service.ts`
**Depends on**: T4
**Reuses**: `GoogleOAuthGuard`, existing `AuthController`, session cookie helpers.
**Requirement**: SYSADM-01

**Tools**:

- MCP: Context7 for Nest Passport only if controller/guard usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `GET /system/auth/google` starts OAuth on allowed system hosts.
- [ ] `GET /system/auth/google/callback` links/creates user and creates a system session only for `system_admin`.
- [ ] `POST /system/auth/logout` revokes the system session and clears the cookie.
- [ ] `GET /system/auth/me` returns the current system principal.
- [ ] Unit tests cover system login success, no system role rejection, and logout.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add system admin oauth`

---

### T6: Wire System Controllers And Providers

**What**: Register system auth/admin providers and controllers in `IdentityModule`.
**Where**: `apps/api/src/modules/identity/identity.module.ts`, `apps/api/src/modules/identity/system/index.ts`
**Depends on**: T5
**Reuses**: Existing `IdentityModule` TypeORM registration and provider style.
**Requirement**: SYSADM-01

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] System controllers are registered.
- [ ] System guard/service providers are registered.
- [ ] Existing `/auth/**` controller remains registered and unchanged for tenant routes.
- [ ] API build succeeds after wiring.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api build`.

**Tests**: build
**Gate**: build
**Commit**: `feat(api): wire system identity module`

---

### T7: Add System Admin DTOs And Slug/Email Validation

**What**: Add request DTOs and validation helpers for tenant and membership management.
**Where**: `apps/api/src/modules/identity/system/dtos/`, `apps/api/src/modules/identity/system/system-admin.validation.ts`
**Depends on**: T6
**Reuses**: Existing role constants, global validation pipe, and tenant host reserved-subdomain config.
**Requirement**: SYSADM-02, SYSADM-03, SYSADM-04

**Tools**:

- MCP: Context7 for class-validator only if decorator behavior is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Create tenant DTO requires `name`, `slug`, and `ownerEmail`.
- [ ] Create tenant DTO accepts optional `ownerRole` limited to `owner` or `admin`.
- [ ] Membership DTOs validate email, roles, and active status.
- [ ] Slug helper rejects invalid and reserved slugs.
- [ ] Unit tests cover valid payloads and invalid email, role, slug, and reserved slug cases.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add system admin validation`

---

### T8: Implement System Admin Tenant Service

**What**: Add transactional tenant create/list/update behavior with owner/admin email bootstrap.
**Where**: `apps/api/src/modules/identity/system/system-admin.service.ts`
**Depends on**: T7
**Reuses**: Identity repositories, `DataSource.transaction`, pending user linking helper behavior.
**Requirement**: SYSADM-02, SYSADM-04

**Tools**:

- MCP: Context7 for TypeORM transactions only if API usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Tenant create writes tenant, pending/reused user, and active owner/admin membership in one transaction.
- [ ] Duplicate or reserved slug is rejected without partial writes.
- [ ] Tenant list returns active membership count and owner/admin emails.
- [ ] Tenant update validates name, slug, and active status.
- [ ] Deactivated tenants continue to appear in system listing.
- [ ] Unit tests cover create success, rollback on membership failure, duplicate slug, list mapping, and deactivation.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): manage tenants from system api`

---

### T9: Implement System Admin Membership Service

**What**: Add tenant membership list/create/update/deactivate behavior.
**Where**: `apps/api/src/modules/identity/system/system-admin.service.ts`
**Depends on**: T8
**Reuses**: `TenantMembershipEntity`, pending user helper, role constants.
**Requirement**: SYSADM-03

**Tools**:

- MCP: Context7 for TypeORM only if relation query usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Membership list scopes by target tenant ID only.
- [ ] Membership create creates/reuses pending user and creates or reactivates tenant membership.
- [ ] Membership update replaces tenant roles and active status without touching system roles.
- [ ] Deactivate/delete path makes future tenant login fail through existing membership validation.
- [ ] Service prevents leaving tenant without at least one active `owner` or `admin`.
- [ ] Unit tests cover create, reactivation, role replacement, deactivation, not found, and last admin/owner guard.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): manage tenant memberships from system api`

---

### T10: Add System Admin HTTP Endpoints

**What**: Add controller endpoints that expose tenant and membership service behavior.
**Where**: `apps/api/src/modules/identity/system/system-admin.controller.ts`
**Depends on**: T9
**Reuses**: DTOs, `SystemHostGuard`, `@RequireSystemRoles("system_admin")`, success envelope.
**Requirement**: SYSADM-02, SYSADM-03, SYSADM-04

**Tools**:

- MCP: Context7 for Nest controllers only if decorator behavior is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] All `/system/admin/tenants` and membership endpoints are implemented.
- [ ] Endpoints require system host and `system_admin`.
- [ ] Responses expose only identity admin DTO fields, not raw token hashes or internals.
- [ ] Controller tests or e2e tests cover allowed host, tenant-host rejection, forbidden non-system user, validation errors, and success responses.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit/e2e
**Gate**: unit
**Commit**: `feat(api): expose system tenant admin endpoints`

---

### T11: Final Regression Verification

**What**: Run full API verification and fix only issues directly caused by this feature.
**Where**: `apps/api`
**Depends on**: T10
**Reuses**: Package scripts and existing test helpers.
**Requirement**: SYSADM-01, SYSADM-02, SYSADM-03, SYSADM-04

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `pnpm --filter @pong-ping/api test` passes.
- [ ] `pnpm --filter @pong-ping/api build` passes.
- [ ] `pnpm --filter @pong-ping/api test:e2e` passes or any external DB prerequisite is documented.
- [ ] No invite routes/entities/token claim flows were added.
- [ ] No `express-session`, `connect-pg-simple`, `passport.session()`, serializer, or deserializer was added.

**Tests**: full regression
**Gate**: build
**Commit**: `chore(api): verify system admin identity tenancy`

---

## Parallel Execution Map

```text
Phase 1:
  T1 -> T2 -> T3

Phase 2:
  T3 -> T4 -> T5 -> T6

Phase 3:
  T6 -> T7 -> T8 -> T9

Phase 4:
  T9 -> T10 -> T11
```

No tasks are marked `[P]` initially because this feature changes shared identity entities, session validation, module wiring, and cross-cutting auth behavior. Parallelism can be introduced after T6 only if workers own disjoint files and coordinate around `SystemAdminService`.

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Pending user entity/auth linking | OK |
| T2 | System session model/service path | OK |
| T3 | Middleware host-based session validation | OK |
| T4 | System host guard | OK |
| T5 | System OAuth controller/service path | OK |
| T6 | Module wiring | OK |
| T7 | DTOs and validation helpers | OK |
| T8 | Tenant service behavior | OK |
| T9 | Membership service behavior | OK |
| T10 | HTTP endpoint exposure | OK |
| T11 | Final verification | OK |

## Diagram-Definition Cross-Check

| Task | Depends On | Execution Plan Shows | Status |
| --- | --- | --- | --- |
| T1 | None | T1 starts Phase 1 | Match |
| T2 | T1 | T1 -> T2 | Match |
| T3 | T2 | T2 -> T3 | Match |
| T4 | T3 | T3 -> T4 | Match |
| T5 | T4 | T4 -> T5 | Match |
| T6 | T5 | T5 -> T6 | Match |
| T7 | T6 | T6 -> T7 | Match |
| T8 | T7 | T7 -> T8 | Match |
| T9 | T8 | T8 -> T9 | Match |
| T10 | T9 | T9 -> T10 | Match |
| T11 | T10 | T10 -> T11 | Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Source | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Entity/auth service | No TESTING.md; existing identity unit tests | unit | OK |
| T2 | Entity/session service/context type | No TESTING.md; existing session unit tests | unit | OK |
| T3 | Middleware | No TESTING.md; existing middleware unit tests | unit | OK |
| T4 | Guard | No TESTING.md; existing guard unit tests | unit | OK |
| T5 | Controller/auth service | No TESTING.md; existing auth unit tests | unit | OK |
| T6 | Module wiring | No TESTING.md; build validates wiring | build | OK |
| T7 | DTOs/validation | No TESTING.md; unit validation tests | unit | OK |
| T8 | Service persistence behavior | No TESTING.md; unit service tests | unit | OK |
| T9 | Service persistence behavior | No TESTING.md; unit service tests | unit | OK |
| T10 | HTTP controllers | No TESTING.md; unit or e2e request behavior | unit/e2e | OK |
| T11 | Regression | Package scripts | full regression | OK |

## Implementation Notes For Executor

- Use Context7 before changing Nest, TypeORM, Passport, `class-validator`, or `nestjs-cls` API usage.
- Keep `/auth/**` tenant behavior backward compatible.
- Do not add invite routes, invite entities, token hashes for invites, or claim flows.
- Keep all system role assignment changes separate from tenant membership role changes.
- Prefer transactions for tenant creation and membership bootstrap.
