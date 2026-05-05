# Design Quality Audit

Spec: `.specs/features/design-quality-refactor/spec.md`
Date: 2026-05-05

## Finding Schema

Each finding records: `id`, `severity`, `route`, `file:line`, `category`, `viewport`, `issue`, `fix direction`, `requirements`, `status`.

Severity:

- P1: blocks core usability, accessibility, or mobile readability.
- P2: slows common workflows or weakens trust.
- P3: visual cohesion and polish.

## Route Checklist

| Route / Flow                                       | Review Mode                                  | Status                       |
| -------------------------------------------------- | -------------------------------------------- | ---------------------------- |
| `/` public ranking                                 | Code audit, responsive implementation review | Reviewed                     |
| `/tables`                                          | Code audit, responsive implementation review | Reviewed                     |
| `/tables/[tableId]`                                | Code audit, workflow implementation review   | Reviewed                     |
| `/tables/[tableId]/scoreboard`                     | Code audit, display implementation review    | Reviewed                     |
| `/tables/[tableId]/scoreboard/controls`            | Code audit, touch implementation review      | Reviewed                     |
| `/admin/users`                                     | Code audit, responsive implementation review | Reviewed                     |
| `/login`                                           | Code audit, form implementation review       | Reviewed                     |
| `/invite/[token]`, `/table-invite/[token]`         | Code audit only                              | Follow-up visual pass needed |
| `/admin/access`, `/admin/tenants`, `/admin/rounds` | Code audit only                              | Follow-up visual pass needed |

## Findings

| ID     | Severity | Route               | Evidence                                            | Category            | Viewport | Issue                                                                                               | Fix Direction                                                               | Requirements   | Status |
| ------ | -------- | ------------------- | --------------------------------------------------- | ------------------- | -------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------- | ------ |
| DQA-01 | P1       | Authenticated shell | `components/app-layout.tsx:32`                      | Accessibility       | All      | Authenticated pages needed a clear skip path into one main region.                                  | Add skip link and explicit `main#main-content`.                             | DQR-02         | Fixed  |
| DQA-02 | P3       | Global              | `app/globals.css:5`                                 | Visual identity     | All      | Tokens used a generic neutral/orange shadcn feel.                                                   | Move to one court-green family with ink neutrals and restrained shadows.    | DQR-02, DQR-08 | Fixed  |
| DQA-03 | P1       | `/`                 | `app/page.tsx:140`                                  | Responsive          | Mobile   | Ranking depended on dense table layout and risked horizontal scan on phones.                        | Add mobile ranking rows and keep table for desktop.                         | DQR-03         | Fixed  |
| DQA-04 | P1       | `/`                 | `app/page.tsx:90`                                   | Locale / typography | All      | Ranking numbers and rates were not consistently locale-formatted or tabular.                        | Use `Intl.NumberFormat` and `tabular-nums`.                                 | DQR-03         | Fixed  |
| DQA-05 | P1       | `/tables`           | `components/tables/table-list.tsx:88`               | Layout              | All      | Current match, queue depth, latest match, and actions had weak hierarchy.                           | Promote current match region, wrap long names, separate destructive action. | DQR-04         | Fixed  |
| DQA-06 | P1       | `/tables`           | `components/tables/table-list.tsx:157`              | Interaction         | All      | Table removal used normal action styling.                                                           | Use destructive variant and confirmation.                                   | DQR-04, DQR-06 | Fixed  |
| DQA-07 | P1       | Scoreboard controls | `components/scoreboard/scoreboard-controls.tsx:123` | Focus / touch       | Mobile   | Custom full-screen buttons bypassed shared focus styling.                                           | Add explicit focus-visible rings, stable touch targets, safe-area padding.  | DQR-05         | Fixed  |
| DQA-08 | P2       | Shared buttons      | `components/ui/button.tsx:8`                        | Animation           | All      | `transition-all` created broad, less predictable animation behavior.                                | Restrict transitions to color, border, shadow, opacity.                     | DQR-02         | Fixed  |
| DQA-09 | P2       | `/login`            | `app/login/page.tsx:65`                             | Forms / content     | Mobile   | Tenant field placeholder and error state needed stronger form metadata and accessible announcement. | Add ellipsis placeholder, spellcheck off, `aria-live` alert.                | DQR-07         | Fixed  |
| DQA-10 | P2       | `/admin/users`      | `app/admin/users/users-admin.tsx:158`               | Interaction         | All      | Destructive row action needed destructive styling and target-specific confirmation copy.            | Use destructive icon button and clearer dialog copy.                        | DQR-06         | Fixed  |

## Root Cause Groups

- Shared foundation: DQA-01, DQA-02, DQA-08.
- Mobile data readability: DQA-03, DQA-04, DQA-05.
- Destructive action hierarchy: DQA-06, DQA-10.
- High-touch scoreboard controls: DQA-07.
- Onboarding polish: DQA-09.

## Requirement Mapping

| Requirement | Findings                                         |
| ----------- | ------------------------------------------------ |
| DQR-01      | Audit report created with evidence and mappings. |
| DQR-02      | DQA-01, DQA-02, DQA-08                           |
| DQR-03      | DQA-03, DQA-04                                   |
| DQR-04      | DQA-05, DQA-06                                   |
| DQR-05      | DQA-07                                           |
| DQR-06      | DQA-10                                           |
| DQR-07      | DQA-09                                           |
| DQR-08      | DQA-02, DQA-03, DQA-05, DQA-07                   |

## Visual Review Notes

Browser screenshot capture was not completed in this pass. Follow-up should run seeded data through 375, 768, and 1280 widths, plus scoreboard fullscreen desktop. Blocked routes should record session/seed prerequisites instead of marking visual verification complete.
