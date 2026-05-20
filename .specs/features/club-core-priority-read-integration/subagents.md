# Subagent Skill Analysis

**Feature**: Club Core Priority Read Integration
**Status**: Draft

## Scope Split

The priority pendencies naturally split into four execution scopes:

1. Backend read APIs and shared contracts.
2. Frontend core API client and TanStack Query integration.
3. Frontend club screens and interaction flows.
4. Cross-cutting verification and tenant/authorization review.

## Recommended Skills By Scope

### Backend Read APIs And Contracts

**Best subagent**: `worker`

**Skills**:

- `coding-guidelines`: required for code changes and avoiding broad refactors.
- `codenavi`: useful for following existing module, DTO, serializer, repository, and test patterns.
- `context7-mcp`: use only when current NestJS or TypeORM API behavior is needed.
- `tactical-ddd`: optional review only, because the read side must not force rich-domain reconstruction.

**Why**: This scope writes API/contracts and must preserve the current command-domain pattern while adding a deliberately pragmatic read side.

**Do not use as primary**:

- `nestjs-modular-monolith`: useful if module boundaries change, but this scope should avoid new architecture unless implementation reveals a hard blocker.
- `domain-analysis`: not needed because bounded contexts are already established enough for this priority scope.

### Frontend API Client And Query Layer

**Best subagent**: `worker`

**Skills**:

- `react-best-practices`: required for React/TanStack Query integration discipline.
- `coding-guidelines`: required for implementation changes.
- `context7-mcp`: required for current TanStack Query v5 docs when designing hooks, mutations, and invalidation.
- `codenavi`: useful to reuse existing API client and query-client conventions.

**Why**: This scope should produce stable query keys and mutation invalidation before UI workers build on top of them.

### Frontend Club Screens And UX

**Best subagent**: `worker`

**Skills**:

- `frontend-design`: required because this is user-facing UI with dashboard, tables, games, athletes, profile, ranking, empty/loading/error states, and role-aware actions.
- `react-best-practices`: required for component/data-fetching ergonomics.
- `coding-guidelines`: required for scoped code edits.
- `context7-mcp`: use only if introducing or changing library-specific usage, such as TanStack Form.

**Why**: The UI must be operational, not marketing-style, and it must follow existing app primitives and club layout.

### Verification, Coverage, And Tenant Safety

**Best subagent**: `explorer` first, `worker` only if fixes are requested.

**Skills**:

- `codenavi`: best fit for tracing endpoint coverage, query invalidation coverage, and cross-module assumptions.
- `coding-guidelines`: useful for review and small targeted patches.
- `tactical-ddd`: useful for checking that commands remain domain-oriented and reads do not accidentally move business rules into projections.

**Why**: This scope benefits from independent inspection. It should verify that every priority checkbox maps to implementation and every read endpoint enforces tenant scope.

## Suggested Parallel Plan

| Wave | Agents | Notes |
| --- | --- | --- |
| 1 | Backend Read Worker | Own contracts and backend reads first because frontend types depend on these shapes. |
| 2 | Frontend Data Worker + Verification Explorer | Data worker builds client/hooks once contracts stabilize; explorer reviews backend tenant scope and endpoint coverage. |
| 3 | Frontend UX Worker | Builds screens once hooks stabilize. Can start static layout earlier only if write paths are isolated. |
| 4 | Verification Explorer or Worker | Runs final coverage check and patches tests only if explicitly assigned. |

## Write Ownership Rules

- Backend worker owns `packages/contracts/src/core.ts` and backend core read/controller/query files.
- Frontend data worker owns `apps/frontend/src/lib/api/core.ts` and `apps/frontend/src/features/club/api/**`.
- Frontend UX worker owns club feature UI/routes and should not edit backend files.
- Verification explorer is read-only by default.

## Risk Notes

- The highest-risk backend issue is tenant scope on detail endpoints; every query must filter by current tenant before returning a row.
- The highest-risk frontend issue is stale state after mutations; every mutation needs an explicit invalidation map.
- The highest coordination risk is contracts changing while UI work is active; stabilize T1 before frontend workers depend on types.
