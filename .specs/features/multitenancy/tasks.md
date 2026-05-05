# Multitenancy Tasks

**Design**: `.specs/features/multitenancy/design.md`
**Status**: Implemented

---

## Execution Plan

### Phase 1: Schema and Tenant Context Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Authentication and Access

```text
T3 -> T4 -> T5
```

### Phase 3: Tenant-Scoped Domain Migration

```text
T5 -> T6
T5 -> T7
T5 -> T8
T5 -> T9
```

### Phase 4: Admin UI and Verification

```text
T6 + T7 + T8 + T9 -> T10 -> T11 -> T12
```

---

## Task Breakdown

### T1: Finalize Tenant Schema and Migration

**What**: Update Prisma schema and migration for tenant-scoped identity and existing tenant-owned models.
**Where**: `prisma/schema.prisma`, `prisma/migrations/*`
**Depends on**: None
**Requirement**: MT-004

**Done when**:

- [x] `User.email` is tenant-scoped unique instead of globally unique.
- [x] `Account` has `tenantId` and tenant-scoped provider uniqueness.
- [x] `AllowedEmail.email` is tenant-scoped unique.
- [x] Existing data backfills to the default tenant.
- [x] Prisma client generation succeeds.

**Tests**: schema/client generation and migration review
**Gate**: `pnpm prisma:generate`

---

### T2: Add Tenant Context and Guard Helpers

**What**: Add server helpers for current tenant user/admin resolution and pending tenant cookie management.
**Where**: `lib/auth/*`, `types/next-auth.d.ts`
**Depends on**: T1
**Requirement**: MT-001, MT-002

**Done when**:

- [x] Session types include tenant id, slug, and name.
- [x] `getCurrentUser()` returns tenant fields.
- [x] `requireTenantUser()` and `requireTenantAdmin()` are available.
- [x] Pending tenant cookie helpers can set, read, and clear trusted OAuth context.

**Tests**: unit tests for helper behavior
**Gate**: targeted auth/session tests

---

### T3: Implement Tenant-Aware Auth.js Adapter and Login Flow

**What**: Replace stock Prisma adapter behavior for user/account lookup and creation with tenant-aware logic.
**Where**: `auth.ts`, `app/login/page.tsx`, `app/actions/auth.ts`, auth helper modules
**Depends on**: T2
**Requirement**: MT-001, MT-002, MT-004

**Done when**:

- [x] Login validates tenant slug before starting Google sign-in.
- [x] OAuth callback requires pending tenant context.
- [x] Adapter resolves users by `(tenantId, email)`.
- [x] Adapter resolves accounts by `(tenantId, provider, providerAccountId)`.
- [x] Same email can authenticate into two tenants without collision.

**Tests**: adapter/session unit tests
**Gate**: targeted auth tests, then `pnpm test`

---

### T4: Tenant-Scope Access Allowlist and Access Invitations

**What**: Update sign-in policy, allowed emails, access invitation creation, and access invitation claiming to use tenant scope.
**Where**: `lib/auth/access.ts`, `lib/auth/sign-in-policy.ts`, `lib/contexts/invitations/`, admin access routes/pages
**Depends on**: T3
**Requirement**: MT-006

**Done when**:

- [x] Allowed email lookup/upsert requires `tenantId`.
- [x] Access invitations store tenant id.
- [x] Claiming access invitations creates `AllowedEmail` in the invitation tenant only.
- [x] Existing invitation expiration and one-time-use behavior is preserved.

**Tests**: access and invitation unit/route tests
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/access.test.ts __tests__/unit/*invitation*.test.ts`

---

### T5: Tenant-Scope Audit Logging

**What**: Require or derive tenant id for all audit writes.
**Where**: `lib/contexts/audit/`, `app/api/admin/_shared.ts`, domain use cases
**Depends on**: T2
**Requirement**: MT-007

**Done when**:

- [x] `recordAuditEvent` writes tenant id for tenant actions.
- [x] Admin denial helpers include tenant id when known.
- [x] Audit metadata remains compatible with existing tests.

**Tests**: audit unit tests
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/audit/record-audit-event.test.ts`

---

### T6: Tenant-Scope Admin Users and Access Pages

**What**: Scope admin user management and access management to the actor tenant, while reserving global tenant management for superadmins.
**Where**: `app/admin/users/*`, `app/api/admin/users/*`, `app/admin/access/*`, `app/api/admin/access/route.ts`
**Depends on**: T4, T5
**Requirement**: MT-003, MT-005, MT-006

**Done when**:

- [x] Tenant admins only list/manage users in their tenant.
- [x] Superadmin role behavior is preserved for global-only operations.
- [x] Access admin lists allowed emails and invitations for the actor tenant.
- [x] Role changes/deletions cannot target another tenant.

**Tests**: admin route/page query tests
**Gate**: targeted admin tests, then `pnpm test`

---

### T7: Tenant-Scope Tables and Table Play

**What**: Scope table list/detail, admin table APIs, membership, queue, participants, scoreboard table lookup, and table invitations.
**Where**: `lib/tables/*`, `lib/contexts/table-play/`, table API routes/pages
**Depends on**: T5
**Requirement**: MT-003, MT-006, MT-008

**Done when**:

- [x] Table reads include actor tenant id.
- [x] Table creation writes actor tenant id.
- [x] Membership and queue operations validate table and user tenant match.
- [x] Table invitations store tenant id and cannot join users across tenants.
- [x] Cross-tenant table ids return 404 from tenant routes.

**Tests**: table query, queue, invitation, and route regression tests
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/tables/*.test.ts __tests__/unit/*invitation*.test.ts`

---

### T8: Tenant-Scope Competition and Rankings

**What**: Scope match finalization, rollback, match history, player ranking, public rankings, and admin rounds.
**Where**: `lib/contexts/competition/`, `lib/rankings/queries.ts`, competition/admin routes/pages
**Depends on**: T5, T7
**Requirement**: MT-003, MT-007, MT-008

**Done when**:

- [x] `finishMatch` and `rollbackMatch` receive tenant context and validate table/match ownership.
- [x] Player ranking upserts include tenant id.
- [x] Ranking reads show only current tenant users/rankings.
- [x] Admin rounds filters include tenant id.
- [x] Cross-tenant match rollback and finish attempts fail safely.

**Tests**: competition, ranking, and admin rounds tests
**Gate**: `pnpm test -- --runTestsByPath __tests__/unit/competition/*.test.ts __tests__/unit/ranking/elo.test.ts`

---

### T9: Tenant-Scope Remaining Read Models and Routes

**What**: Search for remaining unscoped tenant-owned Prisma calls and migrate them to tenant-aware helpers or query facades.
**Where**: `app/`, `lib/`, `__tests__/`
**Depends on**: T6, T7, T8
**Requirement**: MT-003, MT-008

**Done when**:

- [x] No tenant-owned list query runs without `tenantId`.
- [x] No tenant-owned create runs without setting `tenantId`.
- [x] No tenant-owned update/delete relies only on global id.
- [x] Tests cover every intentionally tenant-owned route family.

**Tests**: full unit suite
**Gate**: `pnpm test`

---

### T10: Add Tenant Management UI

**What**: Add superadmin screens and APIs for tenant listing and creation.
**Where**: `app/admin/tenants/*`, `app/api/admin/tenants/*`, shared admin components as needed
**Depends on**: T6
**Requirement**: MT-005

**Done when**:

- [x] Superadmins can list tenants.
- [x] Superadmins can create tenants with unique slugs.
- [x] Non-superadmins cannot access global tenant administration.
- [x] Navigation exposes tenant management only to superadmins.

**Tests**: route tests and focused UI tests where existing patterns support them
**Gate**: targeted tenant admin tests

---

### T11: Add Cross-Tenant Regression Coverage

**What**: Add explicit security tests for data leakage across tenants.
**Where**: `__tests__/unit/`
**Depends on**: T9, T10
**Requirement**: MT-008

**Done when**:

- [x] Same email in two tenants is covered.
- [x] Tenant B cannot access Tenant A table detail, queue, match, ranking, invitation, or admin user records.
- [x] Tenant-scoped audit writes are covered.
- [x] Tests use clear Tenant A/Tenant B fixtures.

**Tests**: new and updated unit tests
**Gate**: `pnpm test`

---

### T12: Final Verification

**What**: Run project checks and review for unscoped tenant-owned data access.
**Where**: whole repo
**Depends on**: T11
**Requirement**: MT-001 through MT-008

**Done when**:

- [x] `pnpm prisma:generate` succeeds.
- [x] `pnpm test` succeeds.
- [x] `pnpm build` succeeds.
- [x] `rg "prisma\\." app lib` review finds no unsafe tenant-owned access.
- [x] Spec deviations, if any, are documented before merge.

**Tests**: full verification
**Gate**: `pnpm prisma:generate`, `pnpm test`, `pnpm build`

---

### T13: Tenant Subdomain Routing for Public and Post-Auth Pages

**What**: Resolve tenant context from request host subdomains for public pages while keeping OAuth callback on the current auth host and moving post-auth app pages to the tenant subdomain.
**Where**: `lib/tenants/*`, `app/page.tsx`, `app/actions/auth.ts`, `app/login/page.tsx`, `auth.ts`
**Depends on**: T3, T8
**Requirement**: MT-009

**Done when**:

- [x] Public rankings use the tenant id resolved from `{tenant}.<root-domain>`.
- [x] Reserved/auth hosts are not treated as tenant slugs.
- [x] Google sign-in redirects to `/tables` on the tenant subdomain after OAuth.
- [x] Auth.js session cookies can be scoped to `AUTH_COOKIE_DOMAIN` so tenant subdomains receive the login session.
- [x] Auth.js redirect validation only permits same-origin or configured tenant-subdomain redirect targets.
- [x] Pending tenant cookies are cleared with the same domain used when setting them.

**Tests**: tenant host helper tests, ranking query regression tests, auth adapter tests
**Gate**: `pnpm lint`, targeted unit tests, `pnpm test`, `pnpm build`
