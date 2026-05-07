# API Core Domain Foundation Context

## Locked Decisions

- Scope is the `apps/api` NestJS application only.
- This feature prepares implementation artifacts for the core domain only.
- The implementation step will create rich domain objects and domain tests, not HTTP endpoints or persistence wiring.
- Domain entities must not import TypeORM, NestJS, class-validator, or framework decorators.
- TypeORM `EntitySchema`, `TypeOrmModule.forFeature`, repositories, migrations, controllers, DTOs, and application use cases are explicitly deferred.
- The canonical domain language comes from `CONTEXT.md`; code names must prefer `Club`, `Athlete`, `Table`, `QueueEntry`, `ActiveGame`, `GameRecord`, `GameCorrection`, `Scoreboard`, `Rating`, `ClubLadder`, `Tier`, `ClubInvite`, and `TableInvite`.
- `User` remains identity/auth terminology. Sports domain behavior must use `Athlete`; translation from `User` to `Athlete` happens outside this feature.
- Authentication is a generic subdomain and can stay framework-oriented later. This feature only creates the minimum identity references needed by the sports domain.
- Moderate future coupling to TypeORM is acceptable, but the core domain created here must remain persistence-unaware.

## Inputs Used

- `CONTEXT.md`
- Existing NestJS API starter under `apps/api/src/core/*`
- Existing legacy domain behavior in `apps/web/src/lib/contexts/*`
- Existing Prisma model names as a migration reference only, not as canonical domain language
- Context7 documentation check for current NestJS TypeORM and TypeORM `EntitySchema` behavior
