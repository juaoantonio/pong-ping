# Multitenancy Implementation Summary

## Status

Implemented and verified on 2026-05-05.

## Delivered

- Tenant-scoped Prisma identity constraints for users, accounts, allowed emails, and owned domain models.
- Pending tenant cookie helpers and tenant-aware Auth.js adapter for Google OAuth.
- Session/current-user tenant context and tenant guard helpers.
- Tenant-scoped access allowlists, access invitations, table invitations, admin users/access, tables, queues, participants, matches, rankings, rounds, and audit events.
- Superadmin tenant management page and API.
- Tenant subdomain resolution for public rankings, auth-safe OAuth callbacks, and post-login tenant app redirects.
- Cross-tenant regression coverage for auth, access, invitations, tables, queues, competition, rankings, admin routes, and audit.

## Verification

- `pnpm prisma:generate` passed.
- `pnpm lint` passed.
- `pnpm test` passed: 26 suites, 106 tests.
- `pnpm build` passed.
- `rg "prisma\\." app lib` was reviewed for tenant-owned access. Remaining global queries are intentional: tenant management, session/current-user lookup, trusted invitation-token entry points, rank levels, and authenticated self-profile updates.

## Spec Deviations

- `AuditLog.tenantId` is nullable. Tenant-owned actions write it whenever known, while pre-tenant admin denials keep `tenantContext: "missing"` metadata as required by MT-007.
