# Vite System Admin Frontend Migration Context

## User Decisions

| Decision | Choice |
| --- | --- |
| Frontend location | Create a new app at `apps/frontend`. |
| Shared contract package | Create a new package named `@pong-ping/contracts`. |
| Existing deleted package | Do not restore or modify the currently deleted `packages/api-contracts` package. |
| First UI scope | Build only the system admin pages backed by existing Nest system endpoints. |
| Old Next admin screens | Do not port users/access/rounds in this slice because they are backed by old Next-only routes or non-system API behavior. |
| Frontend stack | React, TypeScript, Vite, Zod, TanStack Query, TanStack Form, TanStack Router. |
| Design system | Reuse the same shadcn components, CSS variables, design tokens, colors, radius, shadows, and UI tone from `apps/web`. |

## Repository Facts

- `apps/web` is a Next.js app using React 19, Tailwind CSS v4, shadcn/ui, `next-auth`, and several Next server routes.
- `apps/api` is a NestJS 11 app with a global API prefix from `API_PREFIX`, success/error envelopes, validation pipe, CORS with credentials, Swagger/Scalar docs, and system admin controllers under `apps/api/src/modules/identity/system`.
- Existing Nest system endpoints cover:
  - `GET /system/auth/google`
  - `GET /system/auth/google/callback`
  - `POST /system/auth/logout`
  - `GET /system/auth/me`
  - `GET /system/admin/tenants`
  - `POST /system/admin/tenants`
  - `PATCH /system/admin/tenants/:tenantId`
  - `GET /system/admin/tenants/:tenantId/memberships`
  - `POST /system/admin/tenants/:tenantId/memberships`
  - `PATCH /system/admin/tenants/:tenantId/memberships/:membershipId`
  - `DELETE /system/admin/tenants/:tenantId/memberships/:membershipId`
- Current Nest response DTO classes use `Date` for date fields while the HTTP wire shape is ISO date strings after JSON serialization.
- The workspace currently has user/worktree deletions for `packages/api-contracts/**`; this feature must not reverse those deletions.

## Documentation Checked

- Context7 was used for current docs for Vite, React, shadcn/ui, Zod, TanStack Router, TanStack Query, and TanStack Form.
- Relevant confirmed patterns:
  - Vite exposes client env vars through `VITE_` names and supports React TypeScript apps with `@vitejs/plugin-react`.
  - TanStack Router supports the Vite plugin, generated route tree, typed router registration, and route context for auth.
  - TanStack Query uses `QueryClientProvider`, query keys, mutations, and invalidation.
  - TanStack Form accepts Standard Schema/Zod validators and form submit handlers.
  - shadcn/ui supports Vite/monorepo setups and CSS-variable theming.

## Constraints

- Preserve current Next app files unless a later implementation explicitly chooses to remove or replace them.
- Avoid creating new Nest API behavior beyond contract typing and any small serialization/CORS adjustments needed for the existing system endpoints.
- Use credentialed browser requests because system auth uses an HTTP-only session cookie.
- Keep UI in Portuguese where existing admin UI copy is Portuguese.
- No implementation in this artifact phase.

