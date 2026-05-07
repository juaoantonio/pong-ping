# TypeScript enum replacements

Tags: conventions, typescript

## Summary

Do not introduce TypeScript `enum` declarations. Represent enumerated values with an exported UPPER_CASE `const` object using `as const`, then export the PascalCase type from `typeof`.

## Current Pointers

- `apps/api/src/common/shared/errors/app-error-code.enum.ts` defines `APP_ERROR_CODE` and `AppErrorCode`.
- `apps/api/src/modules/core/athlete/domain/value-objects/athlete-technical-level.enum.ts` defines `ATHLETE_TECHNICAL_LEVEL` and `AthleteTechnicalLevel`.
- `apps/api/src/modules/core/athlete/domain/value-objects/athlete-grip-style.enum.ts` defines `ATHLETE_GRIP_STYLE` and `AthleteGripStyle`.
- `apps/api/src/modules/core/athlete/domain/value-objects/athlete-playing-style.enum.ts` defines `ATHLETE_PLAYING_STYLE` and `AthletePlayingStyle`.

## Notes

- Use the UPPER_CASE object for runtime value access, e.g. `ATHLETE_TECHNICAL_LEVEL.ADVANCED`.
- Use `import type` for the PascalCase union type when only a type is needed.
- Prisma schema and SQL migrations still use database enum syntax; this note applies to TypeScript code.
