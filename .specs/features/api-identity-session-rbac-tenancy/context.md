# API Identity Session RBAC Tenancy Context

## Locked User Decisions

| Decision | Choice |
| --- | --- |
| Identity modeling style | Framework-coupled NestJS/TypeORM module because identity is a generic subdomain. |
| Core domain relationship | Core must not import authentication terms; use a translation layer from identity principal to core actor/user IDs. |
| Authentication provider | Google OAuth through Nest Passport strategy. |
| Session implementation | Implement session-based auth in-house; do not use `express-session`, `passport.session()`, or another session library. |
| Tenancy source | Tenant is resolved from the host subdomain slug. |
| Authorization v1 | RBAC only; ABAC is explicitly out of scope for this cut. |
| RBAC role groups | Separate system roles from tenant roles. |
| Default authorization | Protected endpoints without role decorators require `system_admin` by default. |
| Public access | Only routes explicitly marked with `@Public()` bypass the default `system_admin` requirement. |
| Persistence | Use TypeORM entities; do not create migrations for now. |
| Tenant scope | Shared-table model; business tables must have `tenant_id`; tenant filtering must be centralized, not manually repeated. |
| Request context | Use `nestjs-cls` for request context propagation. |

## Repository Facts

- `apps/api` uses NestJS 11, TypeORM 0.3, PostgreSQL, Vitest, and `nestjs-cls` is already installed.
- `DatabaseModule` uses `TypeOrmModule.forRootAsync`, `autoLoadEntities: true`, and `DB_SYNCHRONIZE`.
- Existing `identity` is currently a pure domain folder under `apps/api/src/modules/identity/domain`.
- Existing core modules are pure domain modules under `apps/api/src/modules/core/**/domain`.
- `apps/api/test/domain/framework-independence.spec.ts` currently checks every `src/modules/**/domain` file for forbidden framework imports.
- There is no `.specs/codebase/TESTING.md`; gates below use scripts from `apps/api/package.json`.

## Documentation Findings

- Context7 for `nestjs-cls` confirms `ClsModule.forRoot({ global: true, middleware: { mount: true } })` as the standard request context setup, with `ClsService.get/set` and module augmentation for typed stores.
- Context7 for Nest TypeORM confirms feature modules should register entities with `TypeOrmModule.forFeature([...])` and inject repositories through `@InjectRepository` or `DataSource` where needed.
- Context7 for Nest Passport confirms OAuth strategies are exposed through Passport guards; this feature uses Passport only for Google OAuth, not for session persistence.

## Test Baseline

- Static test count discovery found 44 test cases in `apps/api` spec/e2e files.
- Running `pnpm --filter @pong-ping/api test` and `build` was blocked because pnpm attempted a dependency status install and aborted without TTY before executing tests.
- Implementation tasks must re-run gates after dependency state is usable and must not delete existing tests.
