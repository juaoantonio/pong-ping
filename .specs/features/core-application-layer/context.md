# Core Application and Infrastructure Layer Context

## Locked Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Architecture Pattern | Pragmatic DDD | Separates domain logic from persistence while keeping the implementation straightforward. |
| Persistence Style | TypeORM EntitySchema | Keeps domain entities clean of decorators and framework coupling. |
| Repository Pattern | Concrete Repositories | No interfaces in the domain layer as per explicit user instruction for this module. |
| Layer Organization | Submodule-based | `application/` and `infrastructure/` folders inside each core submodule (club, athlete, etc.). |
| Identity Mapping | Manual Transformers | Use TypeORM `transformer` in `EntitySchema` to handle Value Objects (IDs, Names, Slugs). |

## Inputs Used
- `CONTEXT.md`: Canonical ubiquitous language (Portuguese meanings, English names).
- Architecture Directive: "DDD pragmático com TypeORM EntitySchema".
- Existing Domain Layer: Entities and VOs in `apps/api/src/modules/core/**/domain`.

## Implementation Constraints
- **Domain Purity**: Do not add `@Entity`, `@Column`, or any other TypeORM/NestJS decorators to domain files.
- **Explicit Transactions**: Use Cases should handle transaction boundaries when multiple aggregates are involved (especially in Competition/Rating).
- **No Domain Repository Interfaces**: Repositories are concrete classes in the `infrastructure` layer, injected directly into Use Cases.
