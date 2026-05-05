# Context Boundaries Implementation Summary

## Completed

- Added shared `DomainResult` and typed domain errors under `lib/contexts/shared`.
- Added typed audit event recording under `lib/contexts/audit`.
- Extracted table membership, queue, current-player lookup, and queue rotation into `lib/contexts/table-play`.
- Extracted match finalization and rollback use cases into `lib/contexts/competition`.
- Moved admin rounds query/filter/read-model mapping into `lib/contexts/competition/queries.ts`.
- Extracted invitation policy and access/table invitation create/claim use cases into `lib/contexts/invitations`.
- Added a scoreboard context adapter for Firebase path construction and re-exported scoreboard state helpers.
- Migrated match, rollback, queue, invitation, admin rounds, and scoreboard call sites to the new context boundaries.
- Reduced `lib/tables/service.ts` to table-play compatibility wrappers only.

## Verification

- `pnpm test` passed: 20 suites, 82 tests.
- `pnpm lint` passed.
- `pnpm build` passed.

## Deviations

None.
