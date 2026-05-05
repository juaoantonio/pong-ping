# Login Tenant Query Param Implementation Summary

## Status

Implemented and verified on 2026-05-05.

## Delivered

- Added `normalizeLoginTenantSlug` with `default` fallback.
- Changed Google sign-in to use bound server-side tenant slug instead of editable form data.
- Kept server-side tenant lookup, pending tenant cookie payload, and tenant app redirect behavior.
- Removed visible tenant input from `/login`.
- Added regression tests for resolver, auth action, and login page rendering.

## Verification

- `pnpm test -- __tests__/unit/login-tenant.test.ts __tests__/unit/auth-actions.test.ts __tests__/unit/login-page.test.tsx` passed.
- `pnpm lint` passed.
- `pnpm test` passed: 29 suites, 119 tests.
- `pnpm build` passed.
