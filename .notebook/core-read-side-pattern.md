# Core Read Side Pattern

Core read APIs use a pragmatic HTTP read-side pattern for display-oriented data.

- Shared read contracts live in `packages/contracts/src/core.ts`, including `CorePageResponseContract`, `RatingReadContract`, and `CoreDashboardSummaryContract`.
- Backend pagination helpers live in `apps/api/src/modules/core/shared/presentation/http/dtos/core-page.dtos.ts`.
- Capability read services live under `apps/api/src/modules/core/<capability>/presentation/http/queries`.
- Read services may inject TypeORM repositories directly and return contract DTOs without reconstructing aggregates unless an existing serializer already makes that cheap.
- Every read controller resolves the current tenant with `CurrentContextService` and passes tenant id into the query before fetching.
- Missing tenant-scoped detail rows throw `DomainRuleViolation` with a `*_not_found` code.

References:

- `apps/api/src/modules/core/table/presentation/http/queries/table-read.query.ts`
- `apps/api/src/modules/core/athlete/presentation/http/queries/athlete-read.query.ts`
- `apps/api/src/modules/core/rating/presentation/http/queries/rating-read.query.ts`
- `apps/api/src/modules/core/competition/presentation/http/queries/game-read.query.ts`
- `apps/api/src/modules/core/presentation/http/queries/core-dashboard-read.query.ts`
