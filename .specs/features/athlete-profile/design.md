# Athlete Profile Design

**Spec**: `.specs/features/athlete-profile/spec.md`
**Status**: Draft

---

## Architecture Overview

The implementation extends the existing authenticated profile workflow. Editable athlete metadata is stored separately from identity data, while competitive data remains derived from ranking and match history.

```mermaid
graph TD
    ProfilePage[/profile] --> ProfileQuery[Athlete profile query]
    ProfileForm[Profile form] --> MeApi[PATCH /api/auth/me]
    MeApi --> User[User]
    MeApi --> AthleteProfile[AthleteProfile]
    ProfileQuery --> AthleteProfile
    ProfileQuery --> PlayerRanking[PlayerRanking]
    ProfileQuery --> MatchHistory[MatchHistory]
```

## Data Model Strategy

### New Enums

Add Prisma enums:

| Enum | Values | UI Labels |
| --- | --- | --- |
| `AthleteTechnicalLevel` | `beginner`, `intermediate`, `advanced`, `competitive` | Iniciante, Intermediario, Avancado, Competitivo |
| `AthleteGripStyle` | `classic`, `penhold` | Classica, Caneta |
| `AthletePlayingStyle` | `offensive`, `defensive`, `all_round` | Ofensivo, Defensivo, All-round |

### New Model

Add `AthleteProfile` to [prisma/schema.prisma](/Users/juao/pong-ping/prisma/schema.prisma):

```prisma
model AthleteProfile {
  id                  String                  @id @default(cuid())
  tenantId            String
  userId              String                  @unique
  technicalLevel      AthleteTechnicalLevel?
  gripStyle           AthleteGripStyle?
  playingStyle        AthletePlayingStyle?
  bladeName           String?
  forehandRubberName  String?
  backhandRubberName  String?
  equipmentNotes      String?
  createdAt           DateTime                @default(now())
  updatedAt           DateTime                @default(now()) @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([tenantId, updatedAt])
}
```

Also add:

- `Tenant.athleteProfiles AthleteProfile[]`
- `User.athleteProfile AthleteProfile?`

## Read Model

Create `lib/athletes/profile.ts` or equivalent.

### `getCurrentAthleteProfile(userId, tenantId)`

Returns:

```ts
type AthleteProfileView = {
  editable: {
    name: string | null;
    technicalLevel: AthleteTechnicalLevel | null;
    gripStyle: AthleteGripStyle | null;
    playingStyle: AthletePlayingStyle | null;
    bladeName: string | null;
    forehandRubberName: string | null;
    backhandRubberName: string | null;
    equipmentNotes: string | null;
  };
  ranking: {
    position: number | null;
    elo: number;
    wins: number;
    totalMatches: number;
    winRate: number;
    rankLevelName: string | null;
  };
  evolution: AthleteEvolutionPoint[];
};
```

### `AthleteEvolutionPoint`

```ts
type AthleteEvolutionPoint = {
  matchId: string;
  finishedAt: Date;
  opponentName: string | null;
  result: "win" | "loss";
  oldElo: number;
  newElo: number;
  diffPoints: number;
};
```

## Ranking Position Strategy

Internal ranking position should be calculated within the authenticated user's tenant using the same ordering rules as public rankings:

1. Higher Elo first.
2. Higher wins second.
3. Display label ascending.
4. User id as stable tie-breaker.

If the user has no `PlayerRanking`, use the existing default ranking values:

- Elo: `DEFAULT_PLAYER_ELO`
- Wins: `0`
- Total matches: `0`
- Win rate: `0`
- Position: computed among tenant users when feasible, otherwise `null`

## Evolution History Strategy

Query latest `MatchHistory` rows where:

- `tenantId` matches the authenticated user's tenant.
- `kind` is `match`.
- `winnerId` or `loserId` matches the authenticated user.

Map each row from the user's perspective:

| User Role In Match | Result | Old Elo | New Elo | Diff |
| --- | --- | --- | --- | --- |
| `winnerId` | `win` | `winnerOldElo` | `winnerNewElo` | `winnerDiffPoints` |
| `loserId` | `loss` | `loserOldElo` | `loserNewElo` | `loserDiffPoints` |

Default limit: latest 10 matches.

## API Changes

Extend `PATCH /api/auth/me`.

Accepted body:

```ts
type UpdateMeBody = {
  name?: unknown;
  technicalLevel?: unknown;
  gripStyle?: unknown;
  playingStyle?: unknown;
  bladeName?: unknown;
  forehandRubberName?: unknown;
  backhandRubberName?: unknown;
  equipmentNotes?: unknown;
};
```

Validation:

| Field | Rule |
| --- | --- |
| `name` | Required string after trim, 2 to 80 chars |
| `technicalLevel` | Optional enum or null |
| `gripStyle` | Optional enum or null |
| `playingStyle` | Optional enum or null |
| `bladeName` | Optional string, max 120 chars |
| `forehandRubberName` | Optional string, max 120 chars |
| `backhandRubberName` | Optional string, max 120 chars |
| `equipmentNotes` | Optional string, max 500 chars |

Persistence:

- Update `User.name`.
- Upsert `AthleteProfile` by `userId`.
- Derive `tenantId` from authenticated user, never from request body.

## UI Design

Update `/profile` into four practical sections:

1. Header with avatar, name, email.
2. `Dados do atleta` form with name, technical level, grip, and playing style.
3. `Equipamentos` form fields for blade and rubbers.
4. Read-only `Ranking interno` and `Historico de evolucao`.

Controls:

- Use `Select` for enums.
- Use `Input` for equipment names.
- Use `Textarea` for equipment notes.
- Use existing `Button`, `Label`, and toast behavior.

Layout:

- Keep the current no-card page style.
- Use bordered section separators like the current profile page.
- Avoid nested cards.
- Ensure long equipment names and emails wrap or truncate intentionally.

## Error Handling

| Scenario | Response |
| --- | --- |
| Unauthenticated request | Existing auth redirect or 401 behavior |
| Missing/invalid name | `400`, existing name error |
| Invalid enum | `400`, field-specific Portuguese error |
| Oversized equipment field | `400`, field-specific Portuguese error |
| Missing tenant context | `403`, no profile write |
| Prisma failure | Existing route error behavior or generic `500` |

## Test Strategy

- Unit or route tests for `PATCH /api/auth/me`.
- Query tests for athlete ranking position and evolution mapping.
- Component tests for profile form payload and changed-state behavior if current test setup supports it.
- Regression tests to ensure existing name update still works.

## Open Decisions

| Topic | Default For First Implementation |
| --- | --- |
| Exact technical levels | `beginner`, `intermediate`, `advanced`, `competitive` |
| Equipment model | Free text fields, not catalog tables |
| Evolution visualization | Compact list/table first, chart later if needed |
| Admin editing athlete profiles | Out of scope |

