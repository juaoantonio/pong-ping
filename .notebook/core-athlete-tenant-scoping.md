# Core Athlete Tenant Scoping

Athlete registrations are scoped by core club plus identity user, not by identity user globally.

- `apps/api/src/modules/core/athlete/infrastructure/typeorm/schemas/athlete.schema.ts` uses unique `(club_id, user_id)`.
- `apps/api/src/modules/core/athlete/infrastructure/typeorm/repositories/athlete.repository.ts:findByClubAndUserId()` is the lookup to use when resolving the current athlete for a tenant request.
- `apps/api/src/modules/core/application/identity/core-identity-events.listener.ts:handleTenantUserAuthenticated()` creates an athlete per tenant login when missing.
- Core command controllers that derive the actor athlete from the principal must include `CurrentContextService.getTenantOrThrow()` and call `findByClubAndUserId()`.

Gotcha: using `findByUserId()` globally causes the same Google user in multiple tenants to either miss the current tenant athlete or reuse the wrong club athlete.
