# Frontend Club Core Query Pattern

The club frontend uses a dedicated core API client and TanStack Query cache boundary.

- Raw API functions live in `apps/frontend/src/lib/api/core.ts` and use `getTenantApiBaseUrl()` so requests stay in tenant session context.
- Query keys live in `apps/frontend/src/features/club/api/query-keys.ts`; top-level groups are `dashboard`, `tables`, `athletes`, `ratings`, and `games`.
- Read hooks live in `apps/frontend/src/features/club/api/queries.ts`.
- Mutation hooks live in `apps/frontend/src/features/club/api/mutations.ts` and invalidate affected groups after success.
- Club screens render loading, error, empty, and loaded states through shared helpers in `apps/frontend/src/features/club/club-ui.tsx`.

References:

- `apps/frontend/src/features/club/dashboard-shell-page.tsx`
- `apps/frontend/src/features/club/tables/tables-page.tsx`
- `apps/frontend/src/features/club/games/games-page.tsx`
- `apps/frontend/src/features/club/athletes/athletes-page.tsx`
- `apps/frontend/src/features/club/profile/profile-page.tsx`
- `apps/frontend/src/features/club/ranking/ranking-page.tsx`
