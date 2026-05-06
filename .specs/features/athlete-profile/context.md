# Athlete Profile Context Decisions

## User Decisions

| Topic | Decision | Notes |
| --- | --- | --- |
| Feature scope | Add athlete-specific profile fields to the existing player profile | The user asked for technical level, grip, playing style, internal ranking, evolution history, and equipment. |
| Editable data | Technical level, grip, playing style, and equipment are editable by the athlete | These are self-declared profile attributes. |
| Read-only data | Internal ranking and evolution history are derived from match/ranking records | Ranking should not be manually edited from the profile form. |
| Profile location | Extend `/profile` | The existing profile page already owns user-editable profile data. |
| Language | Portuguese UI labels | Existing user-facing copy is mostly Portuguese. |

## Current Codebase Facts

- The app is a Next.js App Router project using Prisma and a tenant-scoped user model.
- `/profile` currently renders [app/(app)/profile/page.tsx](/Users/juao/pong-ping/app/(app)/profile/page.tsx) and edits only `User.name` through [app/(app)/profile/profile-form.tsx](/Users/juao/pong-ping/app/(app)/profile/profile-form.tsx).
- `PATCH /api/auth/me` in [app/api/auth/me/route.ts](/Users/juao/pong-ping/app/api/auth/me/route.ts) validates and updates only `name`.
- `User` in [prisma/schema.prisma](/Users/juao/pong-ping/prisma/schema.prisma) currently stores identity, auth, role, avatar, and tenant data.
- `PlayerRanking` already stores Elo, wins, total matches, and win rate.
- `MatchHistory` already stores winner/loser old and new Elo values, which are enough to build a recent evolution history.
- Ranking display currently uses [lib/rankings/queries.ts](/Users/juao/pong-ping/lib/rankings/queries.ts) and sorts users by Elo, wins, and label.
- Tenant isolation is already a project concern and must remain enforced for all profile/ranking reads.

## Product Defaults

- New athletes can leave athlete profile fields empty.
- Existing users should keep working after migration without immediate backfill.
- Technical level should be a discrete enum instead of free text.
- Grip style should support `classica` and `caneta`.
- Playing style should support `ofensivo`, `defensivo`, and `all_round`.
- Equipment should support free text for:
  - Madeira
  - Borracha forehand
  - Borracha backhand
  - Observacoes opcionais
- Internal ranking should show current placement, Elo, wins, total matches, and win rate when available.
- Evolution history should show the latest matches involving the athlete, with Elo before/after and point variation.

## Security And Permission Defaults

- A user can edit only their own athlete profile through `/api/auth/me`.
- Admin user management must not gain athlete profile editing unless explicitly added in another feature.
- Ranking and evolution history must be scoped to the authenticated user's tenant.
- Request body tenant ids must be ignored.
- Cross-tenant match history must not be visible through profile queries.
- Invalid enum values or oversized strings must return `400`.

## Implementation Constraints

- Preserve existing `name` update behavior and validation.
- Avoid adding ranking fields to the write API.
- Prefer a separate `AthleteProfile` model over adding sports fields directly to `User`.
- Keep `PlayerRanking` as the source of ranking stats.
- Keep `MatchHistory` as the source of evolution history.
- Use existing UI primitives from `components/ui`.
- Keep the profile page dense and practical, not marketing-like.
- Add focused tests around validation, tenant scoping, and derived read models.

