# Vite System Admin Frontend Migration Specification

## Problem Statement

The current frontend is a Next.js application that mixes user-facing pages, admin UI, server-side data access, and Next API routes. The requested migration introduces a Vite React frontend that communicates directly with the Nest API and uses shared DTO contracts so request/response shapes stay aligned across backend and frontend. The first vertical slice is the system admin surface already exposed by Nest.

## Goals

- [x] Create preconditions for a new Vite React TypeScript frontend at `apps/frontend`.
- [x] Share system admin request/response DTO interfaces through `@pong-ping/contracts`.
- [x] Make Nest system DTO classes implement the shared interfaces.
- [x] Build a system admin UI that authenticates with Nest and manages tenants and tenant memberships.
- [x] Reuse the existing shadcn/ui look, CSS design tokens, colors, spacing, radius, and dashboard tone.
- [x] Verify contracts, API package, and frontend package through package-scoped build/test commands.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Restoring `packages/api-contracts` | User chose a different package and the deletions are existing worktree state. |
| Replacing/removing `apps/web` | User chose a new `apps/frontend` app. |
| Porting users/access/rounds admin screens | First slice is limited to available Nest system endpoints. |
| Migrating tenant/player/table app flows | This feature is system admin only. |
| Adding new Nest domain endpoints | The UI must use currently available system auth/admin endpoints. |
| Changing OAuth provider | Existing system auth uses Google OAuth. |
| Server-side rendering in Vite | Requested stack is a client Vite app talking to Nest. |

---

## User Stories

### P1: Shared System Admin Contracts MVP

**User Story**: As a developer, I want system admin DTO interfaces in a shared package so that Nest and the Vite frontend use the same request and response shapes.

**Why P1**: The migration explicitly requires shared request/response interfaces and Nest DTO classes implementing them.

**Acceptance Criteria**:

1. WHEN `@pong-ping/contracts` is built THEN it SHALL export framework-neutral TypeScript interfaces for API envelopes, system auth DTOs, tenant DTOs, and membership DTOs.
2. WHEN Nest system request DTO classes are compiled THEN they SHALL implement the corresponding interfaces from `@pong-ping/contracts`.
3. WHEN frontend code imports DTO types THEN it SHALL import them from `@pong-ping/contracts` and SHALL NOT duplicate system admin DTO shapes locally.
4. WHEN date fields are represented in shared contracts THEN they SHALL use HTTP wire types (`ISODateString`) rather than backend `Date` objects.

**Independent Test**: Run `pnpm --filter @pong-ping/contracts build` and `pnpm --filter @pong-ping/api build`; both must type-check with Nest DTO implementations.

---

### P1: Vite App Foundation MVP

**User Story**: As a developer, I want a standalone Vite React app in the workspace so that system admin UI can be developed without Next.js runtime assumptions.

**Why P1**: All admin pages depend on a working Vite app, router, build config, env handling, and design system foundation.

**Acceptance Criteria**:

1. WHEN `pnpm --filter @pong-ping/frontend dev` is run THEN Vite SHALL serve the frontend app.
2. WHEN `pnpm --filter @pong-ping/frontend build` is run THEN TypeScript and Vite production build SHALL pass.
3. WHEN the app renders THEN it SHALL use React `createRoot`, `QueryClientProvider`, TanStack Router provider, tooltip provider, and shadcn toaster.
4. WHEN the app needs the API URL THEN it SHALL read `VITE_API_BASE_URL` with a documented local default.
5. WHEN shadcn components render THEN they SHALL use the same CSS variables and visual tokens from the current Next app.

**Independent Test**: Run the frontend build and load the dev server; the root route should render or redirect through the TanStack Router tree without Next imports.

---

### P1: System Authentication

**User Story**: As a system administrator, I want to log in and out through the Nest system auth endpoints so that I can access protected admin pages from the Vite frontend.

**Why P1**: Tenant and membership administration must be protected by system admin authentication.

**Acceptance Criteria**:

1. WHEN an unauthenticated user visits `/admin/tenants` THEN the frontend SHALL redirect to `/login`.
2. WHEN a user clicks login THEN the frontend SHALL navigate the browser to `GET {VITE_API_BASE_URL}/system/auth/google`.
3. WHEN a logged-in system admin loads a protected route THEN the frontend SHALL call `GET /system/auth/me` with credentials and allow the route after success.
4. WHEN `GET /system/auth/me` returns unauthorized or forbidden THEN the frontend SHALL clear cached auth state and redirect to `/login`.
5. WHEN the user logs out THEN the frontend SHALL call `POST /system/auth/logout` with credentials, invalidate auth queries, and return to `/login`.

**Independent Test**: Mock the API client in frontend tests and verify protected route redirect, authenticated route access, and logout invalidation.

---

### P1: Tenant Management

**User Story**: As a system administrator, I want to list, create, and update tenants so that I can operate tenant lifecycle from the Vite UI.

**Why P1**: Tenant management is the primary available system admin workflow in Nest.

**Acceptance Criteria**:

1. WHEN `/admin/tenants` loads for an authenticated system admin THEN the frontend SHALL fetch `GET /system/admin/tenants` with credentials and display tenants.
2. WHEN the tenant list is empty THEN the frontend SHALL show an empty state.
3. WHEN a system admin submits valid tenant name, slug, owner email, and optional owner role THEN the frontend SHALL call `POST /system/admin/tenants` and refresh tenant data after success.
4. WHEN a system admin edits tenant name, slug, or active status THEN the frontend SHALL call `PATCH /system/admin/tenants/:tenantId` and refresh tenant data after success.
5. WHEN the API returns a validation or conflict error THEN the frontend SHALL show the envelope error message without losing unsaved form input.

**Independent Test**: Mock list/create/update endpoints and verify table rendering, submit payloads, query invalidation, and error presentation.

---

### P1: Tenant Membership Management

**User Story**: As a system administrator, I want to manage memberships for a tenant so that I can grant, update, deactivate, and restore access.

**Why P1**: Membership endpoints are part of the available Nest system admin surface and complete the system admin vertical slice.

**Acceptance Criteria**:

1. WHEN a tenant row action opens membership management THEN the frontend SHALL navigate to `/admin/tenants/$tenantId/memberships`.
2. WHEN the membership page loads THEN the frontend SHALL fetch `GET /system/admin/tenants/:tenantId/memberships` and display memberships.
3. WHEN a system admin submits email and roles THEN the frontend SHALL call `POST /system/admin/tenants/:tenantId/memberships`.
4. WHEN a system admin changes roles or active status THEN the frontend SHALL call `PATCH /system/admin/tenants/:tenantId/memberships/:membershipId`.
5. WHEN a system admin deactivates a membership THEN the frontend SHALL call `DELETE /system/admin/tenants/:tenantId/memberships/:membershipId`.
6. WHEN a membership mutation succeeds THEN the frontend SHALL invalidate the membership query and tenant list query.

**Independent Test**: Mock membership endpoints and verify list rendering, role payloads, active/deactivate actions, and cache invalidation.

---

## Edge Cases

- WHEN `VITE_API_BASE_URL` is missing in local development THEN frontend SHALL use a documented localhost default or fail with a clear configuration error.
- WHEN API responses do not match expected envelope shape THEN API client SHALL throw a typed parse error surfaced as a generic user-facing failure.
- WHEN the browser blocks cross-site cookies THEN protected routes SHALL behave as unauthenticated and show the login path.
- WHEN tenant or membership rows have long names/emails/slugs THEN UI SHALL truncate or wrap without layout overlap.
- WHEN a tenant has no memberships THEN membership page SHALL show an empty state and keep create form available.
- WHEN a role multi-select would submit no roles THEN form validation SHALL prevent submission.
- WHEN API base URL points to a different origin THEN requests SHALL use `credentials: "include"` and rely on Nest CORS credentials.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| VITEADM-01 | P1: Shared System Admin Contracts MVP | Verified |
| VITEADM-02 | P1: Vite App Foundation MVP | Verified |
| VITEADM-03 | P1: System Authentication | Verified |
| VITEADM-04 | P1: Tenant Management | Verified |
| VITEADM-05 | P1: Tenant Membership Management | Verified |

Coverage: 5 total, 5 mapped to tasks, 5 verified, 0 unmapped.

## Success Criteria

- [x] `@pong-ping/contracts` builds and exports only framework-neutral DTO interfaces/types.
- [x] Nest system DTOs implement shared interfaces and `@pong-ping/api` builds.
- [x] `@pong-ping/frontend` builds as a Vite app without Next.js imports.
- [x] System admin can authenticate, list/create/update tenants, and manage memberships through Nest API calls.
- [x] Frontend uses current shadcn components/tokens and maintains the existing admin dashboard tone.
