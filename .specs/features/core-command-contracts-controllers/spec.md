# Core Command Contracts and Controllers Specification

## Problem Statement

The core domain and application layers can create clubs, register athletes, manage table queues, and record games, but these commands are not exposed through HTTP. The contracts package also lacks shared types for clients to call those command endpoints safely. This feature creates the framework-neutral contracts and the corresponding Nest controllers for persisted core domain commands.

## Goals

- [ ] Add shared request/response contracts for persisted core commands in `@pong-ping/contracts`.
- [ ] Add Nest DTOs and controllers that expose core command use cases through tenant-authenticated HTTP routes.
- [ ] Add missing application use cases required to expose persisted domain methods currently present only on aggregates.
- [ ] Return serialized contract payloads, not raw domain objects or value objects.
- [ ] Keep unpersisted `invitation` and `scoreboard` commands out of this feature.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Invitation HTTP commands | Invitation has no repository/application module yet. |
| Scoreboard HTTP commands | Scoreboard has no persistence/module yet. |
| Frontend integration | This feature prepares backend contracts and controllers only. |
| Database migrations beyond already mapped persisted aggregates | Existing TypeORM schemas already cover the persisted aggregates this feature exposes. |
| Query/read-model endpoints | The request is for command controllers. |

---

## User Stories

### P1: Shared Core Command Contracts - MVP

**User Story**: As a frontend or API client developer, I want shared TypeScript contracts for core commands so that request and response payloads stay aligned with the API.

**Why P1**: Controllers and clients need stable payload definitions before HTTP command surfaces are usable.

**Acceptance Criteria**:

1. WHEN the contracts package is built THEN the system SHALL export core request and response types from `@pong-ping/contracts`.
2. WHEN a command request type represents a domain enum THEN the system SHALL export contract constants or unions matching the domain literals.
3. WHEN a response represents a domain object THEN the system SHALL expose primitive JSON-safe values only.

**Independent Test**: Build `@pong-ping/contracts` and import core contracts from the package entrypoint.

---

### P1: Tenant-Scoped Core Command Controllers - MVP

**User Story**: As an authenticated club member or admin, I want HTTP endpoints for core commands so that the app can operate on the core domain through the API.

**Why P1**: The existing application use cases are not reachable from clients.

**Acceptance Criteria**:

1. WHEN a tenant-authenticated request calls a core command endpoint THEN the controller SHALL delegate to the corresponding application use case.
2. WHEN a command needs `clubId` THEN the controller SHALL use the current tenant id as the core club id.
3. WHEN a command needs the actor athlete/user context THEN the controller SHALL use the current identity principal and existing core identity translator.
4. WHEN the command succeeds THEN the controller SHALL return a serialized payload matching the core contract.
5. WHEN authorization is missing or insufficient THEN the existing identity guard SHALL reject the request before use-case execution.

**Independent Test**: Controller unit tests verify delegation, tenant id usage, principal usage, and serialized return payloads.

---

### P1: Persisted Domain Command Coverage - MVP

**User Story**: As an API maintainer, I want all persisted core aggregate commands exposed through use cases before adding controllers so that HTTP does not bypass domain/application boundaries.

**Why P1**: Some aggregate methods, such as club activation and table creation/rename, currently have no application use case.

**Acceptance Criteria**:

1. WHEN a persisted aggregate domain method is exposed over HTTP THEN the system SHALL call it through an application use case.
2. WHEN a use case loads an aggregate by id and it does not exist THEN it SHALL throw `DomainRuleViolation` with a not-found code.
3. WHEN a use case mutates an aggregate THEN it SHALL persist the aggregate through the existing repository.
4. WHEN a domain-only module lacks persistence THEN it SHALL remain unexposed in this feature.

**Independent Test**: Use-case unit tests cover successful mutation, persistence, and not-found behavior.

---

### P2: Consistent Domain Error Envelopes

**User Story**: As an API client developer, I want domain rule errors returned in the same API envelope format as other failures so that client error handling is consistent.

**Why P2**: Use cases currently throw `DomainRuleViolation`, and the global exception filter does not explicitly normalize it.

**Acceptance Criteria**:

1. WHEN a use case throws a `DomainRuleViolation` with a not-found code THEN the API SHALL respond with 404.
2. WHEN a use case throws a duplicate/already-exists style `DomainRuleViolation` THEN the API SHALL respond with 409.
3. WHEN a use case throws any other `DomainRuleViolation` THEN the API SHALL respond with 400.
4. WHEN the error response is returned THEN it SHALL use the existing `{ ok: false, error }` envelope.

**Independent Test**: Exception filter unit tests exercise representative domain error codes.

---

## Edge Cases

- WHEN a request body contains an invalid enum literal THEN the system SHALL return validation failure before use-case execution.
- WHEN a route id is blank or invalid for the domain id value object THEN the system SHALL return a domain validation error envelope.
- WHEN a tenant context is missing for a tenant-scoped core command THEN the existing authorization/context path SHALL reject the request.
- WHEN a table command references a non-existent table THEN the system SHALL return a not-found domain error envelope.
- WHEN a game correction targets a missing or already-corrected game THEN the system SHALL return the mapped domain error envelope.
- WHEN contracts and DTOs drift THEN TypeScript `implements` checks SHALL fail during API build.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CORE-HTTP-01 | P1: Shared Core Command Contracts | Design | Pending |
| CORE-HTTP-02 | P1: Tenant-Scoped Core Command Controllers | Design | Pending |
| CORE-HTTP-03 | P1: Persisted Domain Command Coverage | Design | Pending |
| CORE-HTTP-04 | P2: Consistent Domain Error Envelopes | Design | Pending |

**Coverage**: 4 total, 4 mapped to design/tasks, 0 unmapped.

## Success Criteria

- [ ] `pnpm --filter @pong-ping/contracts build` passes.
- [ ] `pnpm --filter @pong-ping/api test` passes.
- [ ] `pnpm --filter @pong-ping/api build` passes.
- [ ] Core controllers expose persisted command use cases without returning raw domain objects.
- [ ] `invitation` and `scoreboard` remain documented as deferred.

