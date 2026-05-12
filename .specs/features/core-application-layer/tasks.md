# Core Application and Infrastructure Layer Tasks

**Status**: Implemented

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
**Status**: Done

### T2: Club Use Cases
**What**: Implement `CreateClubUseCase` and `RenameClubUseCase`.
**Where**: `apps/api/src/modules/core/club/application/use-cases/`
**Done when**: Clubs can be created with unique slugs and renamed.
**Status**: Done

### T3: Club Module Wiring
**What**: Register repositories and use cases in `ClubModule`.
**Done when**: The module compiles and providers are available for injection.
**Status**: Done

---

### T4: Athlete Infrastructure
**What**: Implement `AthleteSchema` and `AthleteRepository`.
**Where**: `apps/api/src/modules/core/athlete/infrastructure/typeorm/`
**Done when**: `Athlete` and its `AthleteProfile` are correctly mapped to the database.
**Status**: Done

### T5: Athlete Use Cases
**What**: Implement `RegisterAthleteUseCase` and `UpdateAthleteProfileUseCase`.
**Where**: `apps/api/src/modules/core/athlete/application/use-cases/`
**Status**: Done

### T6: Athlete Module Wiring
**What**: Register providers in `AthleteModule`.
**Status**: Done

---

### T7: Table Infrastructure
**What**: Implement `TableSchema`, `TableMemberSchema`, and `QueueEntrySchema`.
**Where**: `apps/api/src/modules/core/table/infrastructure/typeorm/`
**Note**: Handle relations for members and queue entries within the aggregate.
**Status**: Done

### T8: Table Use Cases
**What**: Implement `EnqueueTableUseCase`, `RemoveFromQueueUseCase`, `FormActiveGameUseCase`, `RotateWinnerStaysUseCase`.
**Where**: `apps/api/src/modules/core/table/application/use-cases/`
**Status**: Done

### T9: Table Module Wiring
**What**: Register providers in `TableModule`.
**Status**: Done

---

### T10: Competition & Rating Infrastructure
**What**: Implement `GameRecordSchema` and `RatingSchema`. Implement `GameRecordRepository` and `RatingRepository`.
**Where**: `apps/api/src/modules/core/competition/infrastructure/typeorm/`, `apps/api/src/modules/core/rating/infrastructure/typeorm/`
**Status**: Done

### T11: Competition Use Cases
**What**: Implement `RecordGameUseCase` and `CorrectGameUseCase`.
**Where**: `apps/api/src/modules/core/competition/application/use-cases/`
**Note**: Must handle atomic updates to both `GameRecord` and `Rating`.
**Status**: Done

### T12: Competition & Rating Module Wiring
**What**: Register providers in their respective modules.
**Status**: Done

---

## Verification
Run `pnpm --filter @pong-ping/api build` after each phase.
Add unit tests for each use case mocking the repositories.

## Implementation Verification
- `pnpm --filter @pong-ping/api build` passes.
- Focused core use-case specs plus `test/domain/framework-independence.spec.ts` pass with 17 tests.
- Full `pnpm --filter @pong-ping/api test` currently has 3 unrelated identity controller spec failures around missing `SessionCookieService` mocks.
