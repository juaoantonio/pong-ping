# Centralized Google Login Tasks

**Design**: `.specs/features/centralized-google-login/design.md`
**Status**: Done

---

## Gate Check Commands

| Gate           | Command                                   | Notes                                                             |
| -------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| api-unit       | `pnpm --filter @pong-ping/api test`       | Covers config, auth, state, cookie, tenancy, session regressions. |
| frontend-unit  | `pnpm --filter @pong-ping/frontend test`  | Covers `tenant-auth.ts` URL behavior.                             |
| api-build      | `pnpm --filter @pong-ping/api build`      | Required after API wiring changes.                                |
| frontend-build | `pnpm --filter @pong-ping/frontend build` | Required after env/type changes.                                  |

No `.specs/codebase/TESTING.md` exists in this repo. These gates are inferred from `apps/api/package.json` and `apps/frontend/package.json`.

---

## Execution Plan

### Phase 1: Configuration and Stateless State Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Backend Tenant OAuth Centralization

```text
T3 -> T4 -> T5 -> T6
T3 -> T7
T6 + T7 -> T8
```

### Phase 3: Frontend Login URL

```text
T3 -> T9
```

### Phase 4: Regression and Build Verification

```text
T8 + T9 -> T10
```

---

## Task Breakdown

### T1: Add Central Auth Configuration

**What**: Add central auth config support and ensure reserved subdomain defaults include `auth`.
**Where**: `apps/api/src/common/config/config.module.ts`, `apps/api/src/common/config/config.module.spec.ts`
**Depends on**: None
**Reuses**: Existing Joi schema patterns and config module tests.
**Requirement**: CGL-01, CGL-06

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `AUTH_BASE_URL` exists with a dev default equivalent to `http://api.localhost.test:3001/v1`.
- [ ] `RESERVED_TENANT_SUBDOMAINS` default includes `auth`, `api`, and `www`.
- [ ] Config tests document that `GOOGLE_CALLBACK_URL` is the single central Google redirect for tenant OAuth.
- [ ] Existing config tests still pass.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: api-unit
**Verify**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add central auth config`

---

### T2: Reserve Auth Subdomain In Tenant Host Parsing

**What**: Update tenant host parser tests so `auth.<ROOT_DOMAIN>` is treated as reserved tenant context.
**Where**: `apps/api/src/modules/identity/tenancy/tenant-host.spec.ts`, `apps/api/src/modules/identity/tenancy/tenant.middleware.spec.ts`
**Depends on**: T1
**Reuses**: `parseTenantSlugFromHost` and existing middleware/resolver test fixtures.
**Requirement**: CGL-01

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `parseTenantSlugFromHost("api.localhost.test", "localhost.test", defaults)` resolves as reserved.
- [ ] Tenant middleware does not set tenant context for `auth.<ROOT_DOMAIN>`.
- [ ] Existing tenant parsing cases for valid tenant, missing, invalid root, and other reserved hosts still pass.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: api-unit
**Verify**: `pnpm --filter @pong-ping/api test`
**Commit**: `test(api): reserve auth tenant host`

---

### T3: Add OAuth State Service

**What**: Create a signed OAuth state service that validates tenant state and internal return paths.
**Where**: `apps/api/src/modules/identity/auth/oauth-state.service.ts`, `apps/api/src/modules/identity/auth/oauth-state.service.spec.ts`, `apps/api/src/modules/identity/identity.module.ts`
**Depends on**: T2
**Reuses**: `SESSION_SECRET`, `TenantEntity`, Node `crypto`, existing identity module provider patterns.
**Requirement**: CGL-02

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Service generates state with `tenantId`, `tenantSlug`, `returnTo`, `nonce`, `iat`, and `exp`.
- [ ] State signature uses `SESSION_SECRET` and timing-safe comparison.
- [ ] Service validates expiration and reloads an active tenant by `tenantId`.
- [ ] Service rejects missing, malformed, tampered, expired, JSON-invalid, and wrong-secret state.
- [ ] Service rejects absolute, protocol-relative, and external `returnTo`.
- [ ] Unit tests cover valid state and all rejection cases.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: api-unit
**Verify**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): add signed oauth state`

---

### T4: Centralize Tenant OAuth Start Guard

**What**: Change tenant Google OAuth start to run on the auth host, resolve tenant from query, and pass signed state to Passport.
**Where**: `apps/api/src/modules/identity/auth/auth.controller.ts`, `apps/api/src/modules/identity/auth/google-oauth.guard.ts`, related specs
**Depends on**: T3
**Reuses**: Existing `GoogleOAuthGuard`, `TenantResolver`, Passport Google strategy, Swagger decorators.
**Requirement**: CGL-01, CGL-02

**Tools**:

- MCP: Context7 only if Nest Passport API usage becomes unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `GET /v1/auth/google` validates request host against `AUTH_BASE_URL` or `auth.<ROOT_DOMAIN>`.
- [ ] OAuth start reads `tenant=<slug>` from query and rejects missing, blank, arrays, reserved, unknown, or inactive tenants.
- [ ] OAuth start validates `returnTo` as internal and defaults to `/club`.
- [ ] `GoogleOAuthGuard.canActivate()` no longer requires `CurrentContextService.getTenantOrThrow()`.
- [ ] `GoogleOAuthGuard.getAuthenticateOptions()` returns the fixed central `callbackURL` and signed `state`.
- [ ] Unit tests cover accepted start state and rejected tenant/host inputs.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: api-unit
**Verify**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): start tenant oauth on auth host`

---

### T5: Complete Tenant Callback From State

**What**: Change tenant Google callback to validate OAuth state and create a tenant session from the state tenant.
**Where**: `apps/api/src/modules/identity/auth/auth.controller.ts`, `apps/api/src/modules/identity/auth/auth.service.ts`, related specs
**Depends on**: T4
**Reuses**: Existing Google user upsert logic, membership query, `SessionService.createTenantSession`.
**Requirement**: CGL-02, CGL-03

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Callback validates state before creating or updating a user.
- [ ] Callback loads tenant by `tenantId` from state and rejects missing/inactive tenant.
- [ ] `AuthService` exposes a tenant-explicit completion path and no longer needs `CurrentContextService.getTenantOrThrow()` for central callback.
- [ ] Active membership is required for the state tenant.
- [ ] Created `identity_sessions` row uses the state tenant id.
- [ ] Invalid state, expired state, tampered state, external `returnTo`, and no active membership do not create sessions.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: api-unit
**Verify**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): complete tenant oauth from state`

---

### T6: Build Tenant Redirect From Validated State

**What**: Replace callback-host-based tenant frontend redirect construction with tenant-slug and `returnTo` driven redirect construction.
**Where**: `apps/api/src/modules/identity/auth/auth.controller.ts`, optional `apps/api/src/modules/identity/auth/tenant-redirect.ts`, related specs
**Depends on**: T5
**Reuses**: Existing `TENANT_FRONTEND_URL` config and current redirect helper intent.
**Requirement**: CGL-05

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Redirect builder uses `TENANT_FRONTEND_URL` for protocol, port, and default path.
- [ ] Redirect builder sets hostname to `${tenantSlug}.${ROOT_DOMAIN}` for tenant subdomain flow.
- [ ] Localhost dev resolves to URLs like `http://tenant.localhost:5173/club`.
- [ ] Valid internal `returnTo` overrides the default path.
- [ ] Missing `returnTo` defaults to `/club`.
- [ ] Unit tests cover localhost, production-like root domain, nested internal paths, and default path.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: api-unit
**Verify**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): redirect tenant oauth by state`

---

### T7: Add Cross-Subdomain Cookie Options

**What**: Update session cookie helpers and callers to include root-domain cookies in production and omit domain on localhost.
**Where**: `apps/api/src/modules/identity/session/cookies.ts`, `apps/api/src/modules/identity/auth/auth.controller.ts`, `apps/api/src/modules/identity/system/system-auth.controller.ts`, related specs
**Depends on**: T3
**Reuses**: Existing `setSessionCookie` and `clearSessionCookie` helper API.
**Requirement**: CGL-04, CGL-06

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Production/non-localhost cookie set includes `domain: ".${ROOT_DOMAIN}"`.
- [ ] Localhost cookie set omits `domain`.
- [ ] Clear cookie uses the same domain decision as set cookie.
- [ ] Cookie options keep `httpOnly`, `sameSite: "lax"`, production `secure`, and `path: "/"`.
- [ ] Tenant and system auth controllers pass the required root-domain options.
- [ ] Unit tests cover production domain, localhost omission, and clear/set parity.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.

**Tests**: unit
**Gate**: api-unit
**Verify**: `pnpm --filter @pong-ping/api test`
**Commit**: `feat(api): scope session cookies to root domain`

---

### T8: Add Backend Regression Coverage

**What**: Add focused regression coverage for tenant session mismatch and system admin OAuth behavior after centralization.
**Where**: `apps/api/src/modules/identity/session/session.service.spec.ts`, `apps/api/src/modules/identity/system/*.spec.ts`, `apps/api/src/modules/identity/auth/*.spec.ts`
**Depends on**: T6, T7
**Reuses**: Existing session service and system auth test patterns.
**Requirement**: CGL-03, CGL-06

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `SessionService.validateTenantSession()` still rejects a tenant A request using a tenant B session.
- [ ] `/v1/system/auth/google` and callback tests still assert system host guard behavior.
- [ ] System callback still creates a session with `tenantId=null`.
- [ ] Tenant auth centralization tests and existing system tests pass together.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api test`.
- [ ] API build passes: `pnpm --filter @pong-ping/api build`.

**Tests**: unit
**Gate**: api-unit, api-build
**Verify**:

```sh
pnpm --filter @pong-ping/api test
pnpm --filter @pong-ping/api build
```

**Commit**: `test(api): cover centralized oauth regressions`

---

### T9: Update Frontend Tenant Login URL Builder

**What**: Build tenant login URLs against the central auth API host while preserving tenant-scoped protected API calls.
**Where**: `apps/frontend/src/lib/api/tenant-auth.ts`, `apps/frontend/src/lib/api/tenant-auth.test.ts`
**Depends on**: T3
**Reuses**: Existing `getTenantApiBaseUrl`, safe internal redirect helper, and Vitest tests.
**Requirement**: CGL-01, CGL-05

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `getTenantLoginUrl()` uses `VITE_AUTH_API_BASE_URL` when present.
- [ ] Without `VITE_AUTH_API_BASE_URL`, auth base uses the configured central API base URL.
- [ ] Tenant slug is extracted from the current frontend hostname.
- [ ] Login URL sends `tenant=<slug>` and `returnTo=<internal path>`.
- [ ] External, absolute, and protocol-relative redirects are not sent.
- [ ] `getTenantApiBaseUrl()` keeps protected calls on the configured central API host.
- [ ] Frontend unit tests cover `acme.localhost.test -> api.localhost.test`, `returnTo=/club`, external redirect rejection, and tenant API base regression.
- [ ] Gate check passes: `pnpm --filter @pong-ping/frontend test`.
- [ ] Frontend build passes: `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit
**Gate**: frontend-unit, frontend-build
**Verify**:

```sh
pnpm --filter @pong-ping/frontend test
pnpm --filter @pong-ping/frontend build
```

**Commit**: `feat(frontend): use central tenant login host`

---

### T10: Full Verification Pass

**What**: Run the full relevant gate set and document any residual gaps before implementation handoff.
**Where**: repo root and `.specs/features/centralized-google-login/`
**Depends on**: T8, T9
**Reuses**: Package scripts from API and frontend workspaces.
**Requirement**: CGL-01, CGL-02, CGL-03, CGL-04, CGL-05, CGL-06

**Tools**:

- MCP: none
- Skill: `tlc-spec-driven`

**Done when**:

- [x] API unit tests pass.
- [x] Frontend unit tests pass.
- [x] API build passes.
- [x] Frontend build passes.
- [x] Any manual Google Console/local DNS requirements are documented in implementation summary if not directly testable.

**Tests**: unit/build
**Gate**: api-unit, frontend-unit, api-build, frontend-build
**Verify**:

```sh
pnpm --filter @pong-ping/api test
pnpm --filter @pong-ping/frontend test
pnpm --filter @pong-ping/api build
pnpm --filter @pong-ping/frontend build
```

**Commit**: `chore(auth): verify centralized google login`

---

## Parallel Execution Map

Most tasks touch shared auth files, so execution should stay mostly sequential. The only safe split after state foundation is T7 and the frontend T9, because T7 owns cookie helpers/API callers and T9 owns frontend URL generation.

```text
Sequential:
  T1 -> T2 -> T3 -> T4 -> T5 -> T6

Parallel-safe after T3:
  T7 [P] cookie helper/callers
  T9 [P] frontend tenant-auth URL builder

Final:
  T6 + T7 -> T8
  T8 + T9 -> T10
```

---

## Pre-Approval Checks

### Task Granularity Check

| Task | Scope                                       | Status |
| ---- | ------------------------------------------- | ------ |
| T1   | Config schema and config tests              | OK     |
| T2   | Tenant host reserved behavior tests         | OK     |
| T3   | One OAuth state service and tests           | OK     |
| T4   | OAuth start guard/controller path           | OK     |
| T5   | OAuth callback service/controller path      | OK     |
| T6   | Tenant redirect builder and tests           | OK     |
| T7   | Cookie helper and auth controller callers   | OK     |
| T8   | Regression coverage and API build           | OK     |
| T9   | Frontend tenant login URL utility and tests | OK     |
| T10  | Full verification pass                      | OK     |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows  | Status |
| ---- | ---------------------- | -------------- | ------ |
| T1   | None                   | None           | Match  |
| T2   | T1                     | T1 -> T2       | Match  |
| T3   | T2                     | T2 -> T3       | Match  |
| T4   | T3                     | T3 -> T4       | Match  |
| T5   | T4                     | T4 -> T5       | Match  |
| T6   | T5                     | T5 -> T6       | Match  |
| T7   | T3                     | T3 -> T7       | Match  |
| T8   | T6, T7                 | T6 + T7 -> T8  | Match  |
| T9   | T3                     | T3 -> T9       | Match  |
| T10  | T8, T9                 | T8 + T9 -> T10 | Match  |

### Test Co-location Validation

| Task | Code Layer Created/Modified          | Matrix Requires | Task Says  | Status |
| ---- | ------------------------------------ | --------------- | ---------- | ------ |
| T1   | API config                           | unit            | unit       | OK     |
| T2   | API tenancy parsing/middleware       | unit            | unit       | OK     |
| T3   | API auth service/provider            | unit            | unit       | OK     |
| T4   | API guard/controller start path      | unit            | unit       | OK     |
| T5   | API auth callback service/controller | unit            | unit       | OK     |
| T6   | API redirect helper/controller       | unit            | unit       | OK     |
| T7   | API cookie helper/controller callers | unit            | unit       | OK     |
| T8   | API session/system regression        | unit/build      | unit/build | OK     |
| T9   | Frontend API URL utility             | unit/build      | unit/build | OK     |
| T10  | Verification only                    | unit/build      | unit/build | OK     |

---

## Tooling Question Before Execute

Before implementation starts, confirm whether execution should use only the local filesystem and package scripts, or whether sub-agents should be used for the parallel-safe tasks T7 and T9.
