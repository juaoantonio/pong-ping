# Frontend API Integration Status

As of 2026-05-20, `apps/frontend` is integrated with `apps/api` for identity, system administration, and priority core club workflows.

- System admin login uses `/v1/system/auth/google`, `/v1/system/auth/me`, and `/v1/system/auth/logout`.
- Tenant club login uses `/v1/auth/google`, `/v1/auth/me`, and `/v1/auth/logout`, including tenant slug and return path handling.
- Admin tenant screens use real API calls for listing, creating, and updating tenants, plus listing, creating, updating, reactivating, and deactivating memberships.
- The club area calls core endpoints through `apps/frontend/src/lib/api/core.ts`.
- Club query keys and hooks live under `apps/frontend/src/features/club/api/`.
- The club dashboard, tables, games, athletes, profile, and ranking screens use TanStack Query reads and mutations with targeted invalidation.
- Admin-only UI actions are gated from tenant roles returned by `tenantMeQueryOptions`; backend authorization remains the source of truth.
- Frontend tests and build pass. The production build currently emits a bundle-size warning for the main JS chunk.

References:

- `apps/frontend/src/lib/api/client.ts`
- `apps/frontend/src/lib/api/system-admin.ts`
- `apps/frontend/src/lib/api/tenant-auth.ts`
- `apps/frontend/src/lib/api/core.ts`
- `apps/frontend/src/features/club/api/query-keys.ts`
- `apps/frontend/src/features/club/api/queries.ts`
- `apps/frontend/src/features/club/api/mutations.ts`
- `apps/frontend/src/features/system-admin/tenants/tenant-list-page.tsx`
- `apps/frontend/src/features/system-admin/memberships/memberships-page.tsx`
- `apps/frontend/src/features/club/dashboard-shell-page.tsx`
