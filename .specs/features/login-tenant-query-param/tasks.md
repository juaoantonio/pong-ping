# Login Tenant Query Param Tasks

**Spec**: `.specs/features/login-tenant-query-param/spec.md`
**Status**: Implemented

---

## Execution Plan

```text
T1 -> T2 -> T3 -> T4
```

## Task Breakdown

### T1: Add Login Tenant Resolver

**What**: Add a small resolver for login tenant slug normalization and fallback.
**Where**: `app/actions/auth.ts` or new `lib/auth/login-tenant.ts`
**Depends on**: None
**Requirement**: LTQP-001, LTQP-003

**Done when**:

- [x] Missing, blank, array/repeated, or malformed query values resolve to `default`.
- [x] String tenant values normalize consistently with existing slug expectations.
- [x] Resolver has focused unit tests.

**Gate**: targeted resolver tests

### T2: Move Server Action Off Form Tenant Input

**What**: Change Google sign-in action so tenant slug is supplied by server-rendered page context, not user-editable form data.
**Where**: `app/actions/auth.ts`, `app/login/page.tsx`
**Depends on**: T1
**Requirement**: LTQP-001, LTQP-002, LTQP-003

**Done when**:

- [x] `signInWithGoogle` validates the resolved slug against `prisma.tenant`.
- [x] Missing tenant row redirects with `tenant_not_found`.
- [x] Existing pending tenant cookie payload is unchanged.
- [x] Google OAuth redirect target still uses `buildTenantUrlFromRequest("/tables", tenant.slug)`.

**Gate**: targeted auth action tests

### T3: Remove Visible Tenant Field

**What**: Update login UI to remove `Tenant` label/input and show only read-only tenant context if useful.
**Where**: `app/login/page.tsx`
**Depends on**: T2
**Requirement**: LTQP-002

**Done when**:

- [x] No visible or editable `tenantSlug` field renders.
- [x] Form still works without JavaScript through a Server Action.
- [x] Error alert remains `aria-live="polite"`.
- [x] Already-authenticated redirect behavior remains.

**Gate**: render test or manual HTML review

### T4: Regression Verification

**What**: Verify login tenant selection and existing multitenancy behavior.
**Where**: `__tests__/unit/*`, existing auth tests
**Depends on**: T3
**Requirement**: LTQP-001 through LTQP-004

**Done when**:

- [x] `/login?tenant=alpha` starts OAuth with tenant `alpha`.
- [x] `/login` starts OAuth with tenant `default`.
- [x] Missing tenant row does not call `signIn`.
- [x] Existing tenant adapter/session tests pass.

**Gate**: `pnpm test`
