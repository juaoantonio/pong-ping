# API Identity Session RBAC Tenancy Tasks

**Design**: `.specs/features/api-identity-session-rbac-tenancy/design.md`
**Status**: Draft

---

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| unit | `pnpm --filter @pong-ping/api test` | Baseline static count: 44 tests discovered; actual run currently blocked by pnpm dependency purge prompt. |
| e2e | `pnpm --filter @pong-ping/api test:e2e` | Use for controller/guard request behavior. |
| build | `pnpm --filter @pong-ping/api build` | Required after module wiring and dependency changes. |

## Execution Plan

### Phase 1: Context and Persistence Foundation

```text
T1 -> T2 -> T3 -> T4
```

### Phase 2: Authentication and Authorization

```text
T4 -> T5 -> T6 -> T7 -> T8
```

### Phase 3: Tenant Scope and Core Boundary

```text
T4 -> T9 -> T10
T4 -> T11
T8 + T10 + T11 -> T12
```

### Phase 4: Final Verification

```text
T12 -> T13
```

---

## Task Breakdown

### T1: Add Identity Auth Configuration

**What**: Add config schema entries for Google OAuth, session cookie/TTL, root domain, and reserved tenant subdomains.
**Where**: `apps/api/src/common/config/config.module.ts`
**Depends on**: None
**Reuses**: Existing Joi schema pattern.
**Requirement**: IDR-01, IDR-02

**Tools**:

- MCP: Context7 for Nest config only if API usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Config schema includes `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SESSION_SECRET`, `SESSION_COOKIE_NAME`, `SESSION_TTL_SECONDS`, `ROOT_DOMAIN`, and reserved subdomain config/defaults.
- [ ] Validation test covers valid defaults and required secret/provider fields.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus the new config cases.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add identity auth config`

---

### T2: Configure Typed CLS Request Context

**What**: Register global `ClsModule` and add typed context access helpers for tenant and principal.
**Where**: `apps/api/src/common/context/`, `apps/api/src/app.module.ts`
**Depends on**: T1
**Reuses**: `nestjs-cls`, existing `request-id.middleware`.
**Requirement**: IDR-02

**Tools**:

- MCP: Context7 for `nestjs-cls`.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `ClsModule.forRoot` is global and mounts middleware.
- [ ] CLS store is typed through module augmentation.
- [ ] Helper service exposes `getTenantOrThrow`, `getPrincipal`, and `getPrincipalOrThrow`.
- [ ] Unit tests cover missing tenant/principal behavior.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus new context tests.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add request identity context`

---

### T3: Create Identity TypeORM Entities

**What**: Create TypeORM entities for tenants, users, memberships, system role assignments, and sessions.
**Where**: `apps/api/src/modules/identity/entities/`
**Depends on**: T2
**Reuses**: `BaseAuditEntity`.
**Requirement**: IDR-01, IDR-06

**Tools**:

- MCP: Context7 for Nest TypeORM if decorator/registration usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Entities are defined outside `identity/domain`.
- [ ] Tenant roles and system roles are separate enums/types.
- [ ] Session entity stores `tokenHash`, never raw token.
- [ ] Relevant indexes/unique constraints are declared in entity metadata.
- [ ] Entity tests or metadata tests verify core columns and relations.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus entity tests.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add identity persistence entities`

---

### T4: Wire Identity Module

**What**: Create `IdentityModule`, register TypeORM entities, and import the module in `AppModule`.
**Where**: `apps/api/src/modules/identity/identity.module.ts`, `apps/api/src/app.module.ts`
**Depends on**: T3
**Reuses**: Existing Nest module patterns.
**Requirement**: IDR-06

**Tools**:

- MCP: Context7 for Nest TypeORM if needed.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `TypeOrmModule.forFeature` registers identity entities.
- [ ] `IdentityModule` exports only stable services/decorators needed by other modules.
- [ ] Existing `identity/domain` exports are removed or no longer imported by core.
- [ ] Build gate is expected to pass after downstream tasks provide services.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api build` once T5/T6 providers are added.

**Tests**: build
**Gate**: build
**Commit**: `feat(api): wire identity module`

---

### T5: Implement Tenant Host Resolution

**What**: Add tenant host parser, active tenant resolver, middleware, and tests.
**Where**: `apps/api/src/modules/identity/tenancy/`
**Depends on**: T4
**Reuses**: CLS context helpers and tenant repository.
**Requirement**: IDR-02

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] First host label is parsed as tenant slug for `{slug}.{ROOT_DOMAIN}`.
- [ ] Reserved subdomains are rejected as tenant context.
- [ ] Unknown/inactive tenants are rejected.
- [ ] Successful resolution writes tenant ID/slug to CLS.
- [ ] Tests cover valid, missing, reserved, unknown, inactive, and client-supplied mismatch cases.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus tenant resolver tests.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): resolve tenant from subdomain`

---

### T6: Implement In-House Session Service

**What**: Create opaque session token generation, hashing, validation, revocation, and cookie helpers without session libraries.
**Where**: `apps/api/src/modules/identity/session/`
**Depends on**: T5
**Reuses**: `crypto`, identity entities, config, CLS helpers.
**Requirement**: IDR-01

**Tools**:

- MCP: Node.js docs via Context7/web only if crypto API usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Session creation generates high-entropy opaque tokens.
- [ ] Only token hash is persisted.
- [ ] Validation rejects missing, unknown, expired, revoked, inactive user, inactive tenant, and tenant mismatch.
- [ ] Logout revokes session and clears cookie options consistently.
- [ ] Unit tests cover token hashing, validation, revocation, expiry, and tenant mismatch.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus session service tests.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add app-owned sessions`

---

### T7: Implement Google OAuth Controller and Strategy

**What**: Add Google strategy and auth endpoints that create app-owned sessions after OAuth callback.
**Where**: `apps/api/src/modules/identity/auth/`
**Depends on**: T6
**Reuses**: `@nestjs/passport`, Passport Google strategy, `SessionService`.
**Requirement**: IDR-01

**Tools**:

- MCP: Context7 for Nest Passport.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] OAuth start endpoint uses Passport Google guard and requires tenant context.
- [ ] Callback endpoint upserts/links identity user and requires active tenant membership.
- [ ] Callback creates app-owned session and sets HTTP-only cookie.
- [ ] Logout and `/auth/me` are implemented.
- [ ] Tests mock Google profile and verify session creation/no-session rejection for missing membership.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus auth controller/service tests.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add google oauth auth endpoints`

---

### T8: Implement Secure-By-Default Authorization

**What**: Add `@Public`, system role, tenant role decorators and a global guard with `system_admin` default.
**Where**: `apps/api/src/modules/identity/authorization/`, `apps/api/src/app.module.ts`
**Depends on**: T7
**Reuses**: Nest `Reflector`, CLS context.
**Requirement**: IDR-03

**Tools**:

- MCP: Context7 for Nest guards/metadata if needed.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] No metadata means authenticated `system_admin` required.
- [ ] `@RequireSystemRoles` overrides default with explicit system roles.
- [ ] `@RequireTenantRoles` requires active tenant membership and explicit tenant role.
- [ ] `@Public` bypasses auth/RBAC for OAuth start/callback and chosen public routes.
- [ ] Guard tests cover undecorated, public, system role, tenant role, unauthenticated, and wrong-role cases.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus guard tests.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): enforce secure default rbac`

---

### T9: Implement Tenant-Scoped Repository Infrastructure

**What**: Add shared tenant-scoped entity base, repository wrapper/provider, and subscriber validation for tenant-owned writes.
**Where**: `apps/api/src/common/database/tenancy/`
**Depends on**: T4
**Reuses**: TypeORM repositories and CLS context helpers.
**Requirement**: IDR-04

**Tools**:

- MCP: Context7 for TypeORM if repository/query builder API is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `TenantScopedEntity` includes `tenant_id`.
- [ ] Repository wrapper injects CLS tenant into reads and creates.
- [ ] Save/update rejects missing or mismatched tenant.
- [ ] Query builder helper applies tenant predicate centrally.
- [ ] Tests prove tenant A cannot read/write tenant B records through the wrapper.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus tenant repository tests.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): centralize tenant-scoped repositories`

---

### T10: Apply Tenant Scope to Business Entity Base

**What**: Prepare shared business persistence conventions so future TypeORM business entities must carry `tenant_id`.
**Where**: `apps/api/src/common/shared/entities/`, `apps/api/src/common/database/tenancy/`
**Depends on**: T9
**Reuses**: `BaseAuditEntity`.
**Requirement**: IDR-04

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] A tenant-owned base entity is available for business tables.
- [ ] Documentation or tests make direct unscoped repository usage a detectable violation for tenant-owned entities.
- [ ] Existing non-business/system entities are not forced to have `tenant_id`.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus tenant base convention tests.

**Tests**: unit
**Gate**: unit
**Commit**: `feat(api): add tenant-owned entity base`

---

### T11: Replace Core Identity Domain Coupling

**What**: Remove core imports from `identity/domain`, add core-owned actor identity type, and add translation adapter outside core domain.
**Where**: `apps/api/src/modules/core/**/domain/`, `apps/api/src/modules/core/application/identity/`, `apps/api/test/domain/framework-independence.spec.ts`
**Depends on**: T4
**Reuses**: Existing domain ID/value-object patterns.
**Requirement**: IDR-05

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Core domain uses a core-owned actor/user ID type instead of importing `identity/domain`.
- [ ] Translation adapter maps identity principal IDs to core actor IDs outside pure domain.
- [ ] Domain independence test still protects core domain from framework imports.
- [ ] If the static test is narrowed, it explicitly targets `core/**/domain` instead of all `modules/**/domain`.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] Test count is at least 44 plus/including updated independence coverage.

**Tests**: unit
**Gate**: unit
**Commit**: `refactor(api): decouple core from identity domain`

---

### T12: Add End-to-End Authorization and Session Coverage

**What**: Add request-level tests proving OAuth/session, tenant membership, and default RBAC behavior work together.
**Where**: `apps/api/test/identity-auth.e2e-spec.ts`, test helpers as needed.
**Depends on**: T8, T10, T11
**Reuses**: `apps/api/test/test-app.ts`, existing e2e health setup.
**Requirement**: IDR-01, IDR-02, IDR-03, IDR-04

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Undecorated test route requires `system_admin`.
- [ ] `@Public` test route is reachable without session.
- [ ] Tenant role route denies no membership and allows explicit tenant role.
- [ ] Session tenant mismatch is rejected.
- [ ] Tenant-scoped test data does not leak across tenants.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test:e2e`.
- [ ] E2E test count is at least current baseline plus new identity e2e cases.

**Tests**: e2e
**Gate**: e2e
**Commit**: `test(api): cover identity tenancy authorization`

---

### T13: Final Build and Regression Verification

**What**: Run full API verification and fix only issues directly caused by this feature.
**Where**: `apps/api`
**Depends on**: T12
**Reuses**: package scripts.
**Requirement**: IDR-01, IDR-02, IDR-03, IDR-04, IDR-05, IDR-06

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `pnpm --filter @pong-ping/api test` passes.
- [ ] `pnpm --filter @pong-ping/api test:e2e` passes or any external database prerequisite is documented.
- [ ] `pnpm --filter @pong-ping/api build` passes.
- [ ] No `express-session`, `connect-pg-simple`, `passport.session()`, serializer, or deserializer exists in the implementation.
- [ ] Existing 44 statically discovered tests are preserved and new tests are present.

**Tests**: full regression
**Gate**: build
**Commit**: `chore(api): verify identity auth tenancy`

---

## Parallel Execution Map

```text
Phase 1:
  T1 -> T2 -> T3 -> T4

Phase 2:
  T4 -> T5 -> T6 -> T7 -> T8

Phase 3:
  T4 -> T9 -> T10
  T4 -> T11
  T8 + T10 + T11 -> T12

Phase 4:
  T12 -> T13
```

No tasks are marked `[P]` initially because the feature touches shared module wiring, global guards, and test infrastructure. Parallelism can be introduced after T4 if separate workers own disjoint files and coordinate around `AppModule`.

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Config schema/tests | OK |
| T2 | CLS context module/helpers | OK |
| T3 | Identity entity set | OK as cohesive persistence slice |
| T4 | Module wiring | OK |
| T5 | Tenant resolver/middleware | OK |
| T6 | Session service/middleware | OK |
| T7 | OAuth endpoints/strategy | OK as OAuth vertical slice |
| T8 | Authorization decorators/guard | OK |
| T9 | Tenant repository infrastructure | OK |
| T10 | Business tenant entity convention | OK |
| T11 | Core translation boundary | OK |
| T12 | E2E integration coverage | OK |
| T13 | Final verification | OK |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | Match |
| T2 | T1 | T1 -> T2 | Match |
| T3 | T2 | T2 -> T3 | Match |
| T4 | T3 | T3 -> T4 | Match |
| T5 | T4 | T4 -> T5 | Match |
| T6 | T5 | T5 -> T6 | Match |
| T7 | T6 | T6 -> T7 | Match |
| T8 | T7 | T7 -> T8 | Match |
| T9 | T4 | T4 -> T9 | Match |
| T10 | T9 | T9 -> T10 | Match |
| T11 | T4 | T4 -> T11 | Match |
| T12 | T8, T10, T11 | T8 + T10 + T11 -> T12 | Match |
| T13 | T12 | T12 -> T13 | Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Config | No TESTING.md; use unit by repo convention | unit | OK |
| T2 | Context service/module | No TESTING.md; use unit | unit | OK |
| T3 | Entities | No TESTING.md; use unit metadata/repository tests | unit | OK |
| T4 | Nest module wiring | No TESTING.md; use build | build | OK |
| T5 | Middleware/resolver | No TESTING.md; use unit | unit | OK |
| T6 | Session service | No TESTING.md; use unit | unit | OK |
| T7 | OAuth controller/service | No TESTING.md; use unit with mocked strategy/profile | unit | OK |
| T8 | Guard/decorators | No TESTING.md; use unit | unit | OK |
| T9 | Repository infrastructure | No TESTING.md; use unit | unit | OK |
| T10 | Entity convention | No TESTING.md; use unit/static test | unit | OK |
| T11 | Core domain boundary | Existing static domain test | unit | OK |
| T12 | Request integration | Existing e2e pattern | e2e | OK |
| T13 | Regression | Full scripts | full regression | OK |

## Implementation Notes for Executor

- Do not add `express-session`, `connect-pg-simple`, or any server-session package.
- Do not call `passport.session()` and do not create Passport serializers/deserializers.
- Use Context7 before implementing library-specific Nest, TypeORM, Passport, or `nestjs-cls` APIs.
- Keep identity framework code outside `identity/domain`.
- Keep commits atomic per task unless a compile dependency forces a small task merge.
