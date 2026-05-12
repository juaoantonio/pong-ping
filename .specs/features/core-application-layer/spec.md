# Core Application and Infrastructure Layer Specification

## Problem Statement
The `apps/api` core module has a well-defined domain layer (entities and value objects), but lacks the application layer (use cases) and infrastructure layer (persistence with TypeORM) required to perform actual operations. We need to implement these layers following a "Pragmatic DDD" approach, where the domain remains pure and persistence is handled via TypeORM `EntitySchema`.

## Goals
- [x] Implement TypeORM `EntitySchema` for all core aggregates: `Club`, `Athlete`, `Table`, and `GameRecord`.
- [x] Implement concrete TypeORM repositories in the infrastructure layer.
- [x] Implement pure Use Cases in the application layer for all core business operations.
- [x] Ensure the domain layer remains free of framework (NestJS/TypeORM) dependencies.
- [x] Maintain consistent ubiquitous language from `CONTEXT.md`.

## Out of Scope
- [ ] HTTP Controllers and DTOs (to be implemented in a later phase).
- [ ] External integrations (Firebase, etc.).
- [ ] Frontend changes.

---

## User Stories

### P1: Club Management Use Cases
**User Story**: As a platform operator, I want to create and rename clubs so that I can manage organization boundaries.
**Acceptance Criteria**:
1. `CreateClubUseCase` ensures slug uniqueness using `ClubSlugUniquenessService` and a concrete repository.
2. `RenameClubUseCase` updates the club name and persists it.
3. Persistence uses `ClubSchema` (EntitySchema) to map the pure `Club` entity.

### P1: Athlete Registration and Profile
**User Story**: As a user, I want to register as an athlete and update my profile so that I can participate in club activities.
**Acceptance Criteria**:
1. `RegisterAthleteUseCase` creates an `Athlete` record linked to a user identity.
2. `UpdateAthleteProfileUseCase` allows editing technical and equipment details.
3. Persistence uses `AthleteSchema` to map the `Athlete` entity and its `AthleteProfile` value object.

### P1: Table Play Operations
**User Story**: As a player or admin, I want to join the queue, form games, and rotate winners so that matches can be played.
**Acceptance Criteria**:
1. `EnqueueTableUseCase` adds an athlete to the queue and ensures table membership.
2. `RemoveFromQueueUseCase` allows leaving the queue (with current-player guards).
3. `FormActiveGameUseCase` triggers the formation of the next match.
4. `RotateWinnerStaysUseCase` handles the post-match queue rotation.
5. Persistence uses `TableSchema` mapping `Table`, `TableMember`, and `TableQueue`.

### P1: Competition Recording
**User Story**: As an admin or current player, I want to record match results and correct mistakes so that rankings remain accurate.
**Acceptance Criteria**:
1. `RecordGameUseCase` creates a `GameRecord` and updates athlete `Rating` deltas.
2. `CorrectGameUseCase` creates a compensating `GameCorrection`.
3. Persistence uses `GameRecordSchema` and `RatingSchema`.

---

## Requirement Traceability

| ID | Feature | Status |
| --- | --- | --- |
| CORE-APP-01 | Club Application & Infrastructure | Done |
| CORE-APP-02 | Athlete Application & Infrastructure | Done |
| CORE-APP-03 | Table Application & Infrastructure | Done |
| CORE-APP-04 | Competition Application & Infrastructure | Done |

## Success Criteria
- [x] All use cases are implemented as pure classes with an `execute` method.
- [x] Concrete repositories are implemented and injected into use cases.
- [x] `EntitySchema` files correctly map domain objects to the database.
- [x] Domain layer remains framework-independent.
- [x] Unit tests for use cases pass using repository mocks.
