# Core Command HTTP Pattern

Core command HTTP endpoints follow a contract-first, thin-controller pattern.

- Shared payload types live in `packages/contracts/src/core.ts` and are re-exported from `packages/contracts/src/index.ts`.
- Nest DTOs live under each capability's `presentation/http/dtos` folder and implement the matching contract interfaces.
- Serializers live under each capability's `presentation/http/serializers` folder and convert domain objects/value objects to primitive contract payloads.
- Controllers live beside the capability module, use `RequireTenantRoles`, resolve the current tenant with `CurrentContextService`, and delegate to application use cases.
- Commands needing the current athlete resolve the principal with `CoreIdentityTranslator.toActorId()` and then load the athlete through `AthleteRepository.findByUserId()`.
- Missing domain entities should throw `DomainRuleViolation` with a `*_not_found` code so `GlobalExceptionFilter` maps them to the API error envelope.
