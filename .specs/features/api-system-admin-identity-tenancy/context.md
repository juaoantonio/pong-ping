# API System Admin Identity Tenancy Context

## Locked User Decisions

| Decision | Choice |
| --- | --- |
| System admin scope | Identity only: tenants, users, memberships, system sessions, and tenant roles. |
| Invite handling | Remove invites from the plan; no invite links, token claim flows, or invite entities. |
| Tenant bootstrap | Tenant creation requires an owner/admin email and associated subdomain slug. |
| Initial access behavior | Create membership pending login by email; Google OAuth links the subject later. |
| System admin host behavior | Reserved/root host only; tenant-independent endpoints reject tenant subdomains. |
| System admin authentication | System-scoped Google OAuth session on reserved/root host. |

## Existing Implementation Facts

- `apps/api/src/modules/identity` already contains TypeORM entities for tenants, users, memberships, system roles, and sessions.
- Current `IdentitySessionEntity.tenantId` is required and session validation requires a tenant ID.
- Current `IdentityPrincipal.tenantId` is required.
- Current tenant OAuth path is `AuthController` under `/auth/**` and requires active tenant membership before creating a tenant-bound session.
- `IdentityAuthorizationGuard` defaults undecorated routes to `system_admin` and supports explicit tenant/system role decorators.
- `TenantMiddleware` resolves tenant context only from host-derived slug and leaves context empty for missing, reserved, invalid, unknown, or inactive tenant hosts.
- `TenantResolver.parseHost` already knows `ROOT_DOMAIN` and `RESERVED_TENANT_SUBDOMAINS`.
- `SessionMiddleware` currently validates only when both cookie and tenant context exist, so it will not populate a principal for reserved-host system routes without changes.
- There are no Nest identity invitation persistence entities or admin controllers.
- Existing core invitation classes under `apps/api/src/modules/core/invitation/domain` are pure domain objects and are out of scope for this feature.

## Test Baseline And Gates

- No `.specs/codebase/TESTING.md` exists.
- API scripts in `apps/api/package.json` are the source of gate commands:
  - Unit: `pnpm --filter @pong-ping/api test`
  - E2E: `pnpm --filter @pong-ping/api test:e2e`
  - Build: `pnpm --filter @pong-ping/api build`
- Existing identity tests are under `apps/api/src/modules/identity/**`.
- Existing e2e helper is `apps/api/test/test-app.ts`.

## Constraints

- Do not add `express-session`, `connect-pg-simple`, `passport.session()`, serializers, or deserializers.
- Keep tenant-scoped auth behavior unchanged for `/auth/**` tenant routes.
- Keep system roles separate from tenant membership roles.
- Do not generate migrations unless implementation scope is explicitly changed later.
- Use Context7 before implementing library-specific Nest, TypeORM, Passport, or `nestjs-cls` API changes.
