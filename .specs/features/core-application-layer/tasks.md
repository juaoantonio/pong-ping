# Core Application and Infrastructure Layer Tasks

**Status**: Planned

---

## Execution Plan

### Phase 1: Club Module (Foundational)
```text
T1 -> T2 -> T3
```

### Phase 2: Athlete Module
```text
T4 -> T5 -> T6
```

### Phase 3: Table Module (Complex Aggregates)
```text
T7 -> T8 -> T9
```

### Phase 4: Competition & Rating Module (Transactional)
```text
T10 -> T11 -> T12
```

---

## Task Breakdown

### T1: Club Infrastructure
**What**: Implement `ClubSchema` and `ClubRepository`.
**Where**: `apps/api/src/modules/core/club/infrastructure/typeorm/`
**Done when**: `ClubSchema` maps all `Club` fields and `ClubRepository` passes basic save/find checks.

### T2: Club Use Cases
**What**: Implement `CreateClubUseCase` and `RenameClubUseCase`.
**Where**: `apps/api/src/modules/core/club/application/use-cases/`
**Done when**: Clubs can be created with unique slugs and renamed.

### T3: Club Module Wiring
**What**: Register repositories and use cases in `ClubModule`.
**Done when**: The module compiles and providers are available for injection.

---

### T4: Athlete Infrastructure
**What**: Implement `AthleteSchema` and `AthleteRepository`.
**Where**: `apps/api/src/modules/core/athlete/infrastructure/typeorm/`
**Done when**: `Athlete` and its `AthleteProfile` are correctly mapped to the database.

### T5: Athlete Use Cases
**What**: Implement `RegisterAthleteUseCase` and `UpdateAthleteProfileUseCase`.
**Where**: `apps/api/src/modules/core/athlete/application/use-cases/`

### T6: Athlete Module Wiring
**What**: Register providers in `AthleteModule`.

---

### T7: Table Infrastructure
**What**: Implement `TableSchema`, `TableMemberSchema`, and `QueueEntrySchema`.
**Where**: `apps/api/src/modules/core/table/infrastructure/typeorm/`
**Note**: Handle relations for members and queue entries within the aggregate.

### T8: Table Use Cases
**What**: Implement `EnqueueTableUseCase`, `RemoveFromQueueUseCase`, `FormActiveGameUseCase`, `RotateWinnerStaysUseCase`.
**Where**: `apps/api/src/modules/core/table/application/use-cases/`

### T9: Table Module Wiring
**What**: Register providers in `TableModule`.

---

### T10: Competition & Rating Infrastructure
**What**: Implement `GameRecordSchema` and `RatingSchema`. Implement `GameRecordRepository` and `RatingRepository`.
**Where**: `apps/api/src/modules/core/competition/infrastructure/typeorm/`, `apps/api/src/modules/core/rating/infrastructure/typeorm/`

### T11: Competition Use Cases
**What**: Implement `RecordGameUseCase` and `CorrectGameUseCase`.
**Where**: `apps/api/src/modules/core/competition/application/use-cases/`
**Note**: Must handle atomic updates to both `GameRecord` and `Rating`.

### T12: Competition & Rating Module Wiring
**What**: Register providers in their respective modules.

---

## Verification
Run `pnpm --filter @pong-ping/api build` after each phase.
Add unit tests for each use case mocking the repositories.
