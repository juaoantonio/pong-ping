# Core Application EntitySchema Pattern

Core persistence maps pure domain classes with TypeORM `EntitySchema` rather than decorators.

- Schemas live under each capability's `infrastructure/typeorm/schemas`.
- Repositories live under `infrastructure/typeorm/repositories` and are concrete injectable classes.
- Use cases are pure classes with `execute` methods. Nest modules wire them through `useFactory` providers so the use-case classes do not need Nest decorators.
- Private TypeScript domain fields are normal runtime properties, but intersecting domain classes with private persistence fields collapses schema generics to `never`. Use plain persistence-shape types in `EntitySchemaOptions` and keep casts contained inside infrastructure repositories.
- Table queue/members and game result/rating-change value objects are persisted with JSONB transformers in `apps/api/src/modules/core/infrastructure/typeorm/domain-transformers.ts`.
- Migration datasource must include `src/**/*.schema.ts`; runtime TypeORM uses `autoLoadEntities`.
- Runtime and migration TypeORM configs set `entitySkipConstructor: true` because EntitySchema targets pure domain classes with required constructors.
