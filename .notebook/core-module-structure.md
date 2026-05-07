# Core Module Structure

The API core module is organized by capability first, then by layer:

- `apps/api/src/modules/core/athlete/domain`
- `apps/api/src/modules/core/club/domain`
- `apps/api/src/modules/core/competition/domain`
- `apps/api/src/modules/core/invitation/domain`
- `apps/api/src/modules/core/rating/domain`
- `apps/api/src/modules/core/scoreboard/domain`
- `apps/api/src/modules/core/table/domain`
- `apps/api/src/modules/core/shared/domain`

When adding application or infrastructure code for a core capability, place it under the same capability folder, for example `apps/api/src/modules/core/invitation/application`.

Cross-capability domain imports currently use relative imports to the other capability's `domain` barrel, such as `../../athlete/domain` or `../../shared/domain`.
