# Core Pendencies Spec Map

Created on 2026-05-20 while splitting `PENDENCIAS_BACKEND.md` > `Pendencias Do Core` into pre-implementation artifacts.

Each Core topic now has its own feature directory under `.specs/features`:

- `core-club-pendencies`: ownership of `Club` vs `identity.tenant` and current club read API.
- `core-athlete-pendencies`: profile update authorization and tenant scope.
- `core-table-pendencies`: queue/active-game concurrency and removal authorization.
- `core-competition-pendencies`: regression/control spec for already completed history, detail, and corrections.
- `core-rating-pendencies`: rating by athlete and doubles delta algorithm.
- `core-scoreboard-pendencies`: transient vs persisted scoreboard decision, use cases, and API.
- `core-invitation-pendencies`: application layer, persistence, and endpoints for invitations.

Relevant source pointers:

- `PENDENCIAS_BACKEND.md`
- `apps/api/src/modules/core`
- `packages/contracts/src/core.ts`
- `.notebook/core-api-status.md`
- `.notebook/core-module-structure.md`

Superseded broad Core specs removed after this split:

- `.specs/features/api-core-domain-foundation`
- `.specs/features/core-application-layer`
- `.specs/features/core-command-contracts-controllers`
