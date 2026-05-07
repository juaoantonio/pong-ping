# Test Descriptions Language

## Convention

`describe`, `it`, and `test` descriptions in test files must be written in Brazilian Portuguese.

## Scope

- API specs under `apps/api/**/*.spec.ts`
- Web unit tests under `apps/web/__tests__/**/*.test.ts` and `.test.tsx`

## Notes

- Keep domain terms when they are clearer or already used by the codebase, such as `tenant`, `role`, `allowlist`, `rollback`, `Auth.js`, `Prisma`, `HTTP`, and endpoint paths.
- Prefer ASCII Portuguese when editing existing test files that already avoid accents.
