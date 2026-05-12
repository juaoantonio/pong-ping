# Core Command Contracts and Controllers Context

## Locked Decisions

| Topic | Decision | Rationale |
| --- | --- | --- |
| Command scope | Expose all persisted core domain command capabilities. | The user selected "all domain methods", then narrowed domain-only modules to persisted capabilities only. |
| Domain-only modules | Defer `invitation` and `scoreboard`. | They currently have domain code but no persistence/application module to back HTTP commands. |
| Club context | Use current tenant id as the core `clubId`. | Existing identity middleware resolves tenant context before guarded controllers run. |
| Contract package shape | Add core contracts to `@pong-ping/contracts` and re-export from the flat entrypoint. | Existing identity contracts are exported from `packages/contracts/src/index.ts`; keep consumer compatibility. |
| Controller style | Follow existing identity controllers: Nest DTOs implement framework-neutral contracts, Swagger envelope decorators document responses, controllers delegate to application use cases. | Keeps the API style consistent and avoids returning domain value objects directly. |

## Defaults For Implementation

- Tenant-scoped command routes require existing identity authorization decorators.
- Admin-only commands: club mutation, table creation/rename, and game correction.
- Member commands: athlete self-registration/profile update, queue operations, active-game formation, winner-stays rotation, and game recording.
- Public response contracts describe the `data` payload; the global success interceptor keeps the outer `{ ok, data, meta }` envelope.
- `DomainRuleViolation` should be normalized by the global exception filter instead of caught inside each controller.

