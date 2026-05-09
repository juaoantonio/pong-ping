# Vite System Admin Frontend Migration Tasks

**Design**: `.specs/features/vite-system-admin-frontend-migration/design.md`
**Status**: Implemented

---

## Gate Check Commands

| Gate | Command | Notes |
| --- | --- | --- |
| contracts-build | `pnpm --filter @pong-ping/contracts build` | Verifies shared DTO package emits/types. |
| api-unit | `pnpm --filter @pong-ping/api test` | Verifies Nest DTO/service/controller behavior impacted by contracts. |
| api-build | `pnpm --filter @pong-ping/api build` | Verifies Nest compile with shared package imports. |
| frontend-test | `pnpm --filter @pong-ping/frontend test` | Verifies frontend behavior when tests are added. |
| frontend-build | `pnpm --filter @pong-ping/frontend build` | Verifies Vite/TypeScript production build. |
| full | `pnpm --filter @pong-ping/contracts build && pnpm --filter @pong-ping/api build && pnpm --filter @pong-ping/frontend build` | Final package integration gate. |

No `.specs/codebase/TESTING.md` exists, so test assignments follow existing workspace scripts and package conventions discovered in `apps/api/package.json` and `apps/web/package.json`.

---

## Execution Plan

### Phase 1: Contracts And Backend Alignment

```text
T1 -> T2 -> T3
```

### Phase 2: Frontend Foundation

```text
T3 -> T4 -> T5 -> T6
```

### Phase 3: Frontend Data And Auth

```text
T6 -> T7 -> T8
```

### Phase 4: System Admin Pages

```text
T8 -> T9 -> T10 -> T11
```

### Phase 5: Verification And Local Run Readiness

```text
T11 -> T12 -> T13
```

---

## Task Breakdown

### T1: Create Shared Contracts Package

**What**: Create `@pong-ping/contracts` with framework-neutral system auth/admin DTO interfaces and API envelope types.
**Where**: `packages/contracts/`
**Depends on**: None
**Reuses**: Current Nest DTO shapes from `apps/api/src/modules/identity/system/dtos/system-admin.dtos.ts` and auth response DTOs.
**Requirement**: VITEADM-01

**Tools**:

- MCP: Context7 only if TypeScript package export behavior is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Package manifest exports type declarations and build output.
- [ ] Shared interfaces cover API envelopes, system auth responses, tenant requests/responses, and membership requests/responses.
- [ ] Date fields use `ISODateString`.
- [ ] Package is included by existing pnpm workspace globs.
- [ ] Gate check passes: `pnpm --filter @pong-ping/contracts build`.

**Tests**: build
**Gate**: contracts-build
**Commit**: `feat(contracts): add system admin contracts`

**Verify**:

Run `pnpm --filter @pong-ping/contracts build`; expected result is a successful TypeScript build with generated `dist` output.

---

### T2: Make Nest DTOs Implement Shared Contracts

**What**: Add contract imports to Nest system/auth DTO classes and align HTTP response typing where needed.
**Where**: `apps/api/src/modules/identity/system/dtos/system-admin.dtos.ts`, `apps/api/src/modules/identity/auth/dtos/auth-response.dtos.ts`
**Depends on**: T1
**Reuses**: Existing class-validator and Swagger decorators.
**Requirement**: VITEADM-01

**Tools**:

- MCP: Context7 for Nest/Swagger only if decorator behavior becomes unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] System request DTO classes implement corresponding request contract interfaces.
- [ ] System response DTO classes implement corresponding response contract interfaces.
- [ ] Auth response DTO classes implement corresponding auth contract interfaces.
- [ ] Any date response mismatch is resolved intentionally by wire DTO typing or mapper changes.
- [ ] Gate checks pass: `pnpm --filter @pong-ping/api build` and `pnpm --filter @pong-ping/api test`.

**Tests**: unit/build
**Gate**: api-build, api-unit
**Commit**: `feat(api): align system dtos with contracts`

**Verify**:

Run `pnpm --filter @pong-ping/api build` and `pnpm --filter @pong-ping/api test`; expected result is successful compile and unchanged passing API tests.

---

### T3: Confirm API CORS And Env Contract

**What**: Ensure the Nest app and local env documentation support credentialed requests from Vite dev origin.
**Where**: `apps/api/src/common/config/config.module.ts`, API env docs/examples if present, new frontend env example if created later.
**Depends on**: T2
**Reuses**: Existing `CORS_ORIGIN` JSON-array config and `app.enableCors({ credentials: true })`.
**Requirement**: VITEADM-02, VITEADM-03

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] Implementation plan identifies `http://localhost:5173` as required Vite dev CORS origin.
- [ ] Any repo env example touched by implementation documents `VITE_API_BASE_URL`.
- [ ] No credentialed fetch workaround is added outside the existing CORS config model.
- [ ] Gate check passes: `pnpm --filter @pong-ping/api build`.

**Tests**: build
**Gate**: api-build
**Commit**: `chore(api): document vite cors origin`

**Verify**:

Run `pnpm --filter @pong-ping/api build`; expected result is successful compile.

---

### T4: Scaffold Vite React Frontend Package

**What**: Create the `@pong-ping/frontend` Vite React TypeScript package and workspace scripts.
**Where**: `apps/frontend/`
**Depends on**: T3
**Reuses**: Existing workspace script names (`dev`, `build`, `lint`, `test`) and TypeScript strictness.
**Requirement**: VITEADM-02

**Tools**:

- MCP: Context7 for Vite/React setup.
- Skill: `frontend-design` for UI constraints only when implementing visible shell.

**Done when**:

- [ ] `apps/frontend/package.json` defines Vite dev/build/preview/test scripts.
- [ ] Vite config includes React and TanStack Router plugin.
- [ ] TypeScript config uses Vite-compatible JSX/module settings.
- [ ] `index.html`, `src/main.tsx`, and base router files exist.
- [ ] Gate check passes: `pnpm --filter @pong-ping/frontend build`.

**Tests**: build
**Gate**: frontend-build
**Commit**: `feat(frontend): scaffold vite app`

**Verify**:

Run `pnpm --filter @pong-ping/frontend build`; expected result is a successful Vite production build.

---

### T5: Port Design Tokens And shadcn Primitives

**What**: Bring the current visual system into the Vite app without Next-specific dependencies.
**Where**: `apps/frontend/src/styles/`, `apps/frontend/src/components/ui/`, `apps/frontend/components.json`
**Depends on**: T4
**Reuses**: `apps/web/src/app/globals.css`, `apps/web/src/components/ui/`, `apps/web/src/lib/utils.ts`.
**Requirement**: VITEADM-02

**Tools**:

- MCP: Context7 for shadcn Vite setup.
- Skill: `frontend-design`

**Done when**:

- [ ] CSS variables, OKLCH colors, radius, shadows, sidebar tokens, and base styles are present in frontend global CSS.
- [ ] shadcn primitives needed by system admin pages exist and compile in Vite.
- [ ] `next-themes`, `next/font`, `next/link`, and `next/navigation` imports are not used in `apps/frontend`.
- [ ] Tooltip and toaster providers are wired into the app shell.
- [ ] Gate check passes: `pnpm --filter @pong-ping/frontend build`.

**Tests**: build
**Gate**: frontend-build
**Commit**: `feat(frontend): port design system`

**Verify**:

Run `rg -n "next/" apps/frontend` and `pnpm --filter @pong-ping/frontend build`; expected result is no Next imports and successful build.

---

### T6: Add App Shell And Typed Routing

**What**: Implement root providers, typed TanStack Router setup, and admin layout routes.
**Where**: `apps/frontend/src/routes/`, `apps/frontend/src/router.tsx`, `apps/frontend/src/components/layout/`
**Depends on**: T5
**Reuses**: Existing app layout/sidebar/page shell patterns from `apps/web`.
**Requirement**: VITEADM-02, VITEADM-03

**Tools**:

- MCP: Context7 for TanStack Router.
- Skill: `frontend-design`

**Done when**:

- [ ] Router is created from generated route tree and registered for type safety.
- [ ] Root route provides app-level layout and providers.
- [ ] `/login`, `/`, `/admin/tenants`, and `/admin/tenants/$tenantId/memberships` routes exist.
- [ ] `/` redirects to `/admin/tenants`.
- [ ] Layout uses TanStack Router links and no Next router APIs.
- [ ] Gate check passes: `pnpm --filter @pong-ping/frontend build`.

**Tests**: build
**Gate**: frontend-build
**Commit**: `feat(frontend): add typed router shell`

**Verify**:

Run `pnpm --filter @pong-ping/frontend build`; expected result is generated route types and successful build.

---

### T7: Implement API Client And Query Keys

**What**: Create the credentialed Nest API client, Zod envelope parsing, endpoint functions, and stable query keys.
**Where**: `apps/frontend/src/lib/api/`
**Depends on**: T6
**Reuses**: Nest envelope shape and `@pong-ping/contracts` interfaces.
**Requirement**: VITEADM-01, VITEADM-03, VITEADM-04, VITEADM-05

**Tools**:

- MCP: Context7 for Zod and TanStack Query if API usage is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] API base URL comes from `import.meta.env.VITE_API_BASE_URL` with documented local behavior.
- [ ] All requests use `credentials: "include"`.
- [ ] Success and error envelopes are parsed consistently.
- [ ] System auth, tenant, and membership endpoint functions are typed with contracts.
- [ ] Unit tests cover success envelope, error envelope, malformed envelope, and credentialed request options.
- [ ] Gate check passes: `pnpm --filter @pong-ping/frontend test`.

**Tests**: unit
**Gate**: frontend-test
**Commit**: `feat(frontend): add system api client`

**Verify**:

Run `pnpm --filter @pong-ping/frontend test`; expected result is passing API client tests.

---

### T8: Implement System Auth Flow

**What**: Add login page, auth query, protected route guard, and logout action.
**Where**: `apps/frontend/src/features/auth/`, `apps/frontend/src/routes/`
**Depends on**: T7
**Reuses**: API client `me`/`logout`, TanStack Router route guards, shadcn buttons.
**Requirement**: VITEADM-03

**Tools**:

- MCP: Context7 for TanStack Router and Query.
- Skill: `frontend-design`

**Done when**:

- [ ] `/login` has a Google/system login action that navigates to the Nest OAuth start URL.
- [ ] Protected admin routes require successful `GET /system/auth/me`.
- [ ] Unauthorized/forbidden auth checks redirect to `/login`.
- [ ] Logout calls `POST /system/auth/logout`, invalidates auth state, and navigates to `/login`.
- [ ] Tests cover unauthenticated redirect, authenticated access, and logout invalidation.
- [ ] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit
**Gate**: frontend-test, frontend-build
**Commit**: `feat(frontend): add system auth flow`

**Verify**:

Run frontend tests and build; expected result is protected-route behavior covered and successful Vite build.

---

### T9: Implement Tenant List And Create Flow

**What**: Build `/admin/tenants` list and create form using TanStack Query/Form and shared contracts.
**Where**: `apps/frontend/src/features/system-admin/tenants/`, route file for `/admin/tenants`
**Depends on**: T8
**Reuses**: shadcn table/input/select/button, current Next `TenantsAdmin` interaction ideas, API client tenant functions.
**Requirement**: VITEADM-04

**Tools**:

- MCP: Context7 for TanStack Form and Query.
- Skill: `frontend-design`

**Done when**:

- [ ] Tenant query renders loading, error, empty, and populated states.
- [ ] Create tenant form validates `name`, `slug`, `ownerEmail`, and optional owner role with Zod.
- [ ] Successful create invalidates tenant list query and resets form.
- [ ] API errors show without losing unsaved values.
- [ ] Tests cover list rendering, empty state, create payload, invalidation, and API error handling.
- [ ] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit
**Gate**: frontend-test, frontend-build
**Commit**: `feat(frontend): add tenant creation page`

**Verify**:

Run frontend tests and build; expected result is tenant page behavior covered and successful build.

---

### T10: Implement Tenant Update Flow

**What**: Add tenant edit controls for name, slug, and active status.
**Where**: `apps/frontend/src/features/system-admin/tenants/`
**Depends on**: T9
**Reuses**: Tenant list row UI, shadcn dialog/select/button, API client update tenant function.
**Requirement**: VITEADM-04

**Tools**:

- MCP: Context7 for TanStack Form if needed.
- Skill: `frontend-design`

**Done when**:

- [ ] Each tenant row exposes an edit action.
- [ ] Edit form validates changed fields and prevents empty update payload.
- [ ] Successful update invalidates tenant list query.
- [ ] Conflict/validation errors are surfaced to the user.
- [ ] Tests cover update payload, no-change prevention, invalidation, and error state.
- [ ] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit
**Gate**: frontend-test, frontend-build
**Commit**: `feat(frontend): add tenant update flow`

**Verify**:

Run frontend tests and build; expected result is tenant update behavior covered and successful build.

---

### T11: Implement Membership Management Page

**What**: Build membership list, create/reactivate form, role/active update controls, and deactivate action.
**Where**: `apps/frontend/src/features/system-admin/memberships/`, route file for `/admin/tenants/$tenantId/memberships`
**Depends on**: T10
**Reuses**: shadcn table/select/dialog/button, API client membership functions, tenant role contract types.
**Requirement**: VITEADM-05

**Tools**:

- MCP: Context7 for TanStack Form and Query.
- Skill: `frontend-design`

**Done when**:

- [ ] Membership query renders loading, error, empty, and populated states.
- [ ] Create membership form validates email and non-empty roles.
- [ ] Update controls can replace roles and toggle active status.
- [ ] Deactivate action uses confirmation before calling DELETE.
- [ ] Successful mutations invalidate membership query and tenant list query.
- [ ] Tests cover create, update, deactivate, invalidation, empty state, and API error handling.
- [ ] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit
**Gate**: frontend-test, frontend-build
**Commit**: `feat(frontend): add membership management`

**Verify**:

Run frontend tests and build; expected result is membership management behavior covered and successful build.

---

### T12: Add Frontend Quality Gates And Workspace Integration

**What**: Ensure frontend lint/test/build scripts work through pnpm/turbo and do not require Next.
**Where**: `apps/frontend/package.json`, `apps/frontend/eslint.config.*`, frontend test config, `turbo.json` if output patterns need adjustment.
**Depends on**: T11
**Reuses**: Existing API/web package script naming and workspace task names.
**Requirement**: VITEADM-02

**Tools**:

- MCP: Context7 for Vite test tooling only if selected test runner setup is unclear.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `pnpm --filter @pong-ping/frontend test` runs frontend unit tests.
- [ ] `pnpm --filter @pong-ping/frontend build` runs TypeScript/Vite production build.
- [ ] Root `pnpm build` includes contracts before API/frontend where workspace dependencies require it.
- [ ] No frontend package script depends on Next.
- [ ] Gate checks pass: `pnpm --filter @pong-ping/frontend test` and `pnpm --filter @pong-ping/frontend build`.

**Tests**: unit/build
**Gate**: frontend-test, frontend-build
**Commit**: `chore(frontend): add quality gates`

**Verify**:

Run frontend test and build commands; expected result is passing tests and build.

---

### T13: Run Final Integration Gate

**What**: Verify all packages touched by the migration build/test together.
**Where**: Workspace root.
**Depends on**: T12
**Reuses**: Package scripts from contracts, API, and frontend.
**Requirement**: VITEADM-01, VITEADM-02, VITEADM-03, VITEADM-04, VITEADM-05

**Tools**:

- MCP: none required.
- Skill: `tlc-spec-driven`

**Done when**:

- [ ] `pnpm --filter @pong-ping/contracts build` passes.
- [ ] `pnpm --filter @pong-ping/api test` passes.
- [ ] `pnpm --filter @pong-ping/api build` passes.
- [ ] `pnpm --filter @pong-ping/frontend test` passes.
- [ ] `pnpm --filter @pong-ping/frontend build` passes.
- [ ] Manual run notes document required local API/frontend env values.

**Tests**: integration/build
**Gate**: full
**Commit**: `test: verify vite system admin migration`

**Verify**:

Run every command in the checklist; expected result is all commands passing without modifying the deleted `packages/api-contracts` state.

---

## Parallel Execution Map

```text
Sequential foundation:
  T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7 -> T8

Feature pages:
  T8 -> T9 -> T10 -> T11

Final verification:
  T11 -> T12 -> T13
```

No tasks are marked `[P]` in the draft because the app scaffold, design tokens, router, API client, auth guard, and page tests depend on each other and touch overlapping frontend package setup.

---

## Pre-Approval Validation

### Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | One package contract surface | OK |
| T2 | One backend DTO alignment slice | OK |
| T3 | One config/env compatibility slice | OK |
| T4 | One frontend scaffold deliverable | OK |
| T5 | One design-system port deliverable | OK |
| T6 | One router/layout shell deliverable | OK |
| T7 | One API client/query-key deliverable | OK |
| T8 | One auth flow deliverable | OK |
| T9 | One tenant create/list page deliverable | OK |
| T10 | One tenant update flow deliverable | OK |
| T11 | One membership management page deliverable | OK |
| T12 | One quality gate/workspace deliverable | OK |
| T13 | One integration verification deliverable | OK |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Start | Match |
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
| T12 | T11 | T11 -> T12 | Match |
| T13 | T12 | T12 -> T13 | Match |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Shared package contracts | Build | build | OK |
| T2 | Nest DTO compile alignment | Unit/build | unit/build | OK |
| T3 | API config/env docs | Build | build | OK |
| T4 | Frontend scaffold | Build | build | OK |
| T5 | UI primitives/styles | Build | build | OK |
| T6 | Router/layout shell | Build | build | OK |
| T7 | API client | Unit | unit | OK |
| T8 | Auth route behavior | Unit | unit | OK |
| T9 | Tenant list/create UI | Unit | unit | OK |
| T10 | Tenant update UI | Unit | unit | OK |
| T11 | Membership management UI | Unit | unit | OK |
| T12 | Test/build scripts | Unit/build | unit/build | OK |
| T13 | Package integration | Integration/build | integration/build | OK |
