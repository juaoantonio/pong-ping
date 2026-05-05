# Multitenancy Context Decisions

## User Decisions

| Topic | Decision | Notes |
| --- | --- | --- |
| Isolation model | Shared tables with `tenantId` | Matches the existing partial schema direction and is appropriate for small to medium SaaS. |
| Tenant source | Invitation/admin controlled | Tenant must come from trusted server-side context, not frontend `tenant_id`. |
| Email scope | Unique per tenant | The same email may exist in different tenants. |
| Admin scope | Full UI | Superadmins need tenant management screens, not only seed/default tenant setup. |
| Auth model | Select tenant before Google OAuth | Required because Auth.js/Google identity lookup must know which tenant owns the login. |

## Current Codebase Facts

- The app is a Next.js App Router project using Auth.js/NextAuth v5 beta, Prisma 7, and PostgreSQL.
- `Tenant` and `tenantId` fields already exist in `prisma/schema.prisma` for most tenant-owned models.
- `prisma/migrations/20260505000000_add_multitenancy/migration.sql` already exists and backfills a `default` tenant.
- Runtime auth still uses the stock `PrismaAdapter(prisma)`, whose default `getUserByEmail(email)` assumes a globally unique email.
- `Session.user` currently includes `id` and `role`, but not tenant context.
- `getCurrentUser()` currently fetches by user id only and does not select tenant fields.
- Several read/write paths use unscoped Prisma queries, including rankings, tables, admin users/access, rounds, invitations, and table-play/competition use cases.

## Product Defaults

- Default tenant remains available for existing data and local development.
- Tenant slugs are the stable human-readable identifier for login and admin URLs.
- Tenant-owned protected routes use the authenticated user's tenant.
- Global tenant administration is reserved for `superadmin`.
- Tenant admins can manage users, access, tables, rounds, and invitations only within their tenant.

## Security Defaults

- Cross-tenant resource access returns `404` when the requested resource id does not belong to the actor tenant.
- Same-tenant authorization failure returns `403`.
- Tenant id from request query/body is ignored for authorization decisions.
- Invitation tokens are trusted entry points only after token lookup validates expiration/use status and derives tenant from the stored invitation.
- Audit records include tenant id whenever tenant context is known.

## Implementation Constraints

- Preserve existing user-facing Portuguese error messages where practical.
- Keep the modular monolith shape and existing context modules under `lib/contexts`.
- Prefer tenant-scoped query facades and domain inputs over scattered raw Prisma filters.
- Keep this feature focused on isolation and administration, not billing, rate limits, or RLS.
