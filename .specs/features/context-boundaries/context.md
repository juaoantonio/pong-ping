# Context Boundaries Decisions

## User Decisions

| Decision | Choice |
| --- | --- |
| Scope | Reestruturação ampla |
| Delivery | Criar e versionar `.specs/` |
| Compatibility | Pode quebrar contratos internos e APIs antigas se necessário |

## Locked Assumptions

- This is a modular monolith refactor, not a service extraction.
- User-facing behavior should remain equivalent unless a task explicitly documents an intentional change.
- Database schema and migrations should remain unchanged in the first implementation pass.
- Existing untracked `apps/`, `packages/`, and `.agents/` directories are unrelated and should not be modified.
- New context modules should live under `lib/contexts/*` unless implementation finds an existing local convention that is clearly better.

## Analysis Inputs

- Domain analysis identified table play and competition/ranking as the core areas.
- Coupling analysis identified the strongest coupling in match finalization and rollback.
- Git history indicates `prisma/schema.prisma`, public ranking, admin/access, and the rooms-to-tables area have been volatile.

## Preferred Implementation Style

- Keep changes atomic and commit-ready by context.
- Prefer explicit use-case functions over broad service objects.
- Prefer small DTOs and typed results over leaking Prisma models or raw strings.
- Keep tests close to changed behavior.
- Avoid UI redesign unless required by contract changes.
