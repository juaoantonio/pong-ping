# API Core Domain Foundation Design

**Spec**: `.specs/features/api-core-domain-foundation/spec.md`
**Context**: `.specs/features/api-core-domain-foundation/context.md`
**Status**: Draft

---

## Architecture Overview

The implementation will add only the domain layer under `apps/api/src/modules`. Each context owns its domain entities, value objects, services, errors, and tests. No NestJS module, controller, TypeORM schema, repository injection, migration, or application use case is part of this feature.

Target shape:

```text
apps/api/src/modules/
  core/domain/
    shared/
    clubs/
    athletes/
    tables/
    competition/
    ratings/
    invitations/
    scoreboards/
  identity/domain/
```

Dependency direction:

```text
identity -> core/domain/shared
core/domain/clubs -> shared
core/domain/athletes -> shared, clubs, identity
core/domain/tables -> shared, clubs, athletes
core/domain/ratings -> shared, clubs, athletes
core/domain/competition -> shared, clubs, athletes, tables, ratings
core/domain/invitations -> shared, clubs, identity, tables
core/domain/scoreboards -> shared, clubs, tables
```

Domain code must not depend on `core/shared` HTTP/error infrastructure. A future adapter can map domain errors to `AppException`.

## Code Reuse Analysis

| Existing Code | Reuse |
| --- | --- |
| `CONTEXT.md` | Canonical language and required invariants. |
| `apps/web/src/lib/tables/queue.ts` | Preserve winner-stays rotation behavior, but implement as table-domain behavior. |
| `apps/web/src/lib/ranking/elo.ts` | Preserve `MATCH_ELO_K = 64`, default rating `1000`, Elo formula, and win-rate semantics. |
| `apps/web/src/lib/contexts/invitations/policy.ts` | Preserve expiration and one-time-use policy semantics. |
| `apps/api/src/core/shared/errors/*` | Do not import from domain; only use later as an adapter target. |

Context7 findings used for later constraints: NestJS registers repositories through `TypeOrmModule.forFeature`/`@InjectRepository`, and TypeORM supports `EntitySchema` as separated entity definition. Those APIs are not implemented in this feature because persistence is out of scope.

## Components

### Shared Domain Kernel

- **Purpose**: Provide minimal primitives used by all domain contexts.
- **Location**: `apps/api/src/modules/core/domain/shared/`
- **Interfaces**:
  - `abstract class Entity<TId>` with identity equality.
  - `interface DomainEvent` with `occurredAt` and `eventVersion`.
  - `abstract class AggregateRoot<TId>` with `pullDomainEvents()`.
  - `class DomainRuleViolation extends Error`.
  - Base `DomainId` value object for concrete IDs owned by each context.
- **Dependencies**: none.

### Clubs Domain

- **Purpose**: Model `Club` as the ownership boundary for sports data.
- **Location**: `apps/api/src/modules/core/domain/clubs/`
- **Interfaces**:
  - `Club.create(input)` creates an active club.
  - `club.rename(name: ClubName)` changes display name.
  - `club.changeSlug(slug: ClubSlug)` changes slug after external uniqueness validation.
  - `club.ensureSameClub(other: ClubId)` guards cross-club operations.
- **Value Objects**: `ClubName`, `ClubSlug`.
- **Domain Services**: `ClubSlugUniquenessService` contract shape that accepts a lookup callback, not a repository interface.

### Identity Domain

- **Purpose**: Keep generic identity references separate from sports behavior.
- **Location**: `apps/api/src/modules/identity/domain/`
- **Interfaces**:
  - `User` with `UserId`, `Email`, role, and active state only.
  - `user.changeEmail(email: Email)` and `user.deactivate()`.
- **Value Objects**: `Email`.
- **Constraint**: No sports behavior, no table/rating membership, no auth provider/session details.

### Athletes Domain

- **Purpose**: Model the sports person who plays and appears in rankings.
- **Location**: `apps/api/src/modules/core/domain/athletes/`
- **Interfaces**:
  - `Athlete.register({ clubId, userId, displayName })`.
  - `athlete.updateProfile(profile: AthleteProfile)`.
  - `athlete.rename(displayName: AthleteDisplayName)`.
- **Value Objects**: `AthleteDisplayName`, `AthleteProfile`, equipment/profile VOs and enums for technical level, grip style, playing style.
- **Constraint**: `Athlete` references `UserId` as identity boundary, but domain methods speak in athlete terms.

### Tables Domain

- **Purpose**: Own table membership, queue ordering, active game formation, and winner-stays rotation.
- **Location**: `apps/api/src/modules/core/domain/tables/`
- **Interfaces**:
  - `Table.create({ clubId, name, createdByAthleteId, playMode })`.
  - `table.addMember(athleteId)`.
  - `table.enqueue(athleteId)` returns whether membership must be created.
  - `table.removeFromQueue(athleteId)` rejects current players when a playable game exists.
  - `table.removeFromActiveGame(athleteId)` removes a current player without recording a game.
  - `table.formActiveGame()` returns `ActiveGame`.
  - `table.rotateWinnerStays(winningSide: GameSide)`.
- **Entities/VOs**: `Table`, `TableMember`, `TableQueue`, `QueueEntry`, `ActiveGame`, `GameSide`, `PlayMode`, `TableName`, `QueuePosition`.
- **Rules**: Singles uses 2 entries; doubles uses 4 entries; sides never contain duplicate athletes.

### Ratings Domain

- **Purpose**: Own rating points, Elo changes, tiers, and club ladder ordering.
- **Location**: `apps/api/src/modules/core/domain/ratings/`
- **Interfaces**:
  - `Rating.createDefault({ clubId, athleteId })`.
  - `rating.recordWinAgainst(opponent: Rating, service: EloRatingService)`.
  - `rating.applyCorrection(delta: RatingDelta)`.
  - `ClubLadder.rank(ratings, tiers)`.
  - `Tier.resolve(points, tiers)`.
- **Value Objects**: `RatingPoints`, `RatingDelta`, `WinRate`, `TierThreshold`.
- **Domain Services**: `EloRatingService` for pure Elo calculation.

### Competition Domain

- **Purpose**: Model recorded game history and compensating corrections.
- **Location**: `apps/api/src/modules/core/domain/competition/`
- **Interfaces**:
  - `GameRecord.record({ clubId, tableId, activeGame, winningSide, ratingChanges, actorAthleteId, finishedAt })`.
  - `gameRecord.correct({ correctionId, actorAthleteId, correctedAt })`.
  - `GameCorrection.createCompensating(originalRecord, actorAthleteId)`.
- **Entities/VOs**: `GameRecord`, `GameCorrection`, `GameResult`, `SideRatingChange`.
- **Rules**: A record has at most one correction; corrections cannot target corrections; original records are not deleted.

### Invitations Domain

- **Purpose**: Model club/table invitation availability without framework or persistence details.
- **Location**: `apps/api/src/modules/core/domain/invitations/`
- **Interfaces**:
  - `ClubInvite.create(...)`, `TableInvite.create(...)`.
  - `invite.claim({ claimedAt, claimedBy })`.
  - `InvitationPolicy.getUnavailableReason(invite, now)`.
- **Value Objects**: `InvitationToken`, `InvitationExpiration`, `InvitationClaim`.
- **Rules**: Expiring at or before `now` is unavailable; one-time invites cannot be claimed twice; reusable invites can be claimed until expiration.

### Scoreboards Domain

- **Purpose**: Model live points separately from game records and ratings.
- **Location**: `apps/api/src/modules/core/domain/scoreboards/`
- **Interfaces**:
  - `Scoreboard.create({ clubId, tableId, activeGame })`.
  - `scoreboard.pointFor(side)`.
  - `scoreboard.undoPoint(side)`.
  - `scoreboard.reset()`.
- **Value Objects**: `ScorePoints`, `ScoreboardSide`.
- **Constraint**: No dependency on `GameRecord`, `Rating`, Firebase, or persistence.

## Error Handling Strategy

| Scenario | Domain Handling |
| --- | --- |
| Invalid VO input | Throw `DomainRuleViolation` with stable code and message. |
| Cross-club operation | Entity method throws `DomainRuleViolation("cross_club_operation")`. |
| Duplicate queue entry | `Table.enqueue` throws `DomainRuleViolation("athlete_already_queued")`. |
| Not enough queue entries | `Table.formActiveGame` throws `DomainRuleViolation("not_enough_athletes")`. |
| Invalid winner side | `Table.rotateWinnerStays` throws `DomainRuleViolation("winning_side_not_active")`. |
| Already corrected record | `GameRecord.correct` throws `DomainRuleViolation("game_record_already_corrected")`. |
| Expired invite | `InvitationPolicy` returns/throws `invitation_expired` depending on method. |

Application/use-case layers can later catch and map these errors to `AppException`; domain tests should assert domain codes, not HTTP status.

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Feature scope | Domain-only | Matches the user's latest instruction to focus on core domain before implementation. |
| Persistence | Deferred | Keeps entities free of TypeORM while allowing future `EntitySchema` mapping. |
| Domain events | In-memory pending events on aggregate roots | Supports tactical DDD without adding a bus or framework dependency. |
| Identity | Minimal generic domain | `User` exists only as identity boundary; sports behavior belongs to `Athlete`. |
| Shared kernel | Small and local to `src/modules/core/domain/shared` | Avoids coupling domain code to HTTP/core infrastructure. |
| Concrete IDs | Owned by their domain contexts | Keeps identity types close to the aggregate/context that defines them. |
| Errors | Domain-specific error class | Keeps invariants testable without NestJS exceptions. |
| Tests | Unit-first | Core domain should be executable without database, Nest application context, or Testcontainers. |
