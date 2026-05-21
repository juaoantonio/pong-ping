# Core Table Command Locking

Table commands that depend on queue or active-game state are serialized through
`apps/api/src/modules/core/table/infrastructure/typeorm/repositories/table.repository.ts:withLockedTable()`.

- The repository opens a TypeORM transaction and loads the table row with `pessimistic_write`.
- Use cases pass `clubId` plus `tableId`, so HTTP commands cannot mutate a table outside the current tenant.
- Covered use cases: rename table, enqueue, remove from queue, form active game, remove from active game, rotate winner-stays.
- Controllers still own actor/role policy; current policy allows members to remove only themselves and admins to remove any athlete in the tenant.

