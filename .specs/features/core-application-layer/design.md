# Core Application and Infrastructure Layer Design

## Module Structure

Each submodule in `apps/api/src/modules/core/` will follow this structure:

```text
[submodule]/
  domain/
    entities/
    value-objects/
  application/
    use-cases/
      [name].use-case.ts
    dtos/ (if needed)
  infrastructure/
    typeorm/
      schemas/
        [name].schema.ts
      repositories/
        [name].repository.ts
```

## Component Mapping

### 1. Club Module
- **Schema**: `ClubSchema` mapping `Club` entity to `clubs` table.
- **Repository**: `ClubRepository` providing `findById`, `findBySlug`, `existsBySlug`, `save`.
- **Use Cases**: `CreateClubUseCase`, `RenameClubUseCase`.

### 2. Athlete Module
- **Schema**: `AthleteSchema` mapping `Athlete` entity to `athletes` table. Handles `AthleteProfile` as embedded columns.
- **Repository**: `AthleteRepository` providing `findById`, `findByUserId`, `save`.
- **Use Cases**: `RegisterAthleteUseCase`, `UpdateAthleteProfileUseCase`.

### 3. Table Module
- **Schema**: `TableSchema` mapping `Table` aggregate root.
  - `TableMember` mapped as a one-to-many relation or jsonb if appropriate (prefer relation for membership queries).
  - `QueueEntry` mapped as a one-to-many relation.
- **Repository**: `TableRepository` providing `findById`, `save`.
- **Use Cases**: `EnqueueTableUseCase`, `RemoveFromQueueUseCase`, `FormActiveGameUseCase`, `RotateWinnerStaysUseCase`.

### 4. Competition & Rating Module
- **Schemas**:
  - `GameRecordSchema` mapping `GameRecord` and `GameCorrection`.
  - `RatingSchema` mapping `Rating`.
- **Repositories**:
  - `GameRecordRepository`.
  - `RatingRepository`.
- **Use Cases**: `RecordGameUseCase`, `CorrectGameUseCase`.

## Persistence Strategy (EntitySchema)

We will use the `target` property in `EntitySchema` to point to the domain class. Private fields in domain entities (e.g., `nameValue`) will be mapped using the `any` cast in the schema definition to bypass TypeScript access restrictions while maintaining the internal domain state.

Example transformer for ID value objects:
```ts
transformer: {
  to: (vo: DomainId) => vo.value,
  from: (value: string) => new ConcreteId(value)
}
```

## Error Handling
Use Cases will throw `DomainRuleViolation` (from shared domain) or standard NestJS exceptions (translated in the application layer if needed) when business rules are violated.
