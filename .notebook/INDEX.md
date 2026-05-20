# Project Notebook

## Conventions

- [Contracts ESM build](contracts-esm-build.md) - Contracts dist must emit `.js` relative ESM specifiers.
- [Centralized Google login flow](centralized-google-login-flow.md) - Tenant Google OAuth now starts on central auth host and returns through signed state.
- [Core module structure](core-module-structure.md) - Core submodules are organized by capability first, then layer.
- [Core API status](core-api-status.md) - Current implementation state of `apps/api/src/modules/core`, including surfaced endpoints, gaps, and verification status.
- [Frontend API integration status](frontend-api-integration-status.md) - Current state of `apps/frontend` integration with auth/system admin API and missing core gameplay integration.
- [Core application EntitySchema pattern](core-application-entityschema-pattern.md) - Core application/infrastructure mapping keeps domain pure and contains TypeORM casts in infrastructure.
- [Core command HTTP pattern](core-command-http-pattern.md) - Core command routes use shared contracts, capability DTOs/serializers, tenant context, and application use cases.
- [Core read side pattern](core-read-side-pattern.md) - Core read APIs use tenant-scoped HTTP query providers and shared pagination/contracts.
- [Frontend club core query pattern](frontend-club-core-query-pattern.md) - Club frontend core API client, query keys, hooks, mutation invalidation, and screen state pattern.
- [TypeScript enum replacements](typescript-enum-replacements.md) - Project convention for replacing TypeScript `enum` with immutable `const` objects and separate union types.
- [Test descriptions language](test-descriptions-language.md) - Test `describe`, `it`, and `test` descriptions use Brazilian Portuguese.
