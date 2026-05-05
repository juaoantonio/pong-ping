# Login Page Design Refresh Specification

## Problem Statement

The current login page works, but reads as a generic centered card. It uses one basic heading, a short description, a radial background, and form content dominated by the soon-to-be-removed `Tenant` field. After tenant selection moves to the URL, the login page should become a polished, trustworthy auth entry point that fits Pong Ping's sport-console visual direction and follows Web Interface Guidelines.

## Goals

- [ ] Redesign `/login` around one clear Google sign-in action.
- [ ] Show tenant context as read-only, not editable form state.
- [ ] Improve visual hierarchy, spacing, responsive behavior, and error recovery.
- [ ] Keep the page accessible with semantic form, visible focus, `aria-live` errors, and safe touch targets.
- [ ] Preserve existing auth behavior, redirects, and error mapping.
- [ ] Avoid generic AI/SaaS design tropes: purple gradients, glass cards, card nesting, oversized marketing hero, and decorative icon stacks.

## Out of Scope

| Feature | Reason |
| --- | --- |
| New auth providers | Google remains the only login action. |
| Tenant switching UI | Tenant comes from query/default in the companion spec. |
| Marketing landing page | `/login` is an auth tool, not a product homepage. |
| Global app redesign | This spec only covers `/login` and reusable bits needed by it. |

---

## Requirements

### LPDR-001: Focused Auth Layout

**User Story**: As a user, I want login to feel direct and trustworthy so I can enter the right tenant with one action.

**Acceptance Criteria**:

1. WHEN `/login` renders THEN the primary task SHALL be visually obvious: sign in with Google.
2. WHEN tenant context exists THEN it SHALL be shown as read-only organization context.
3. WHEN no query tenant is present THEN the page SHALL communicate the default tenant context without asking for input.
4. WHEN an error is present THEN error copy SHALL include the next step and remain near the login action.
5. WHEN content is viewed at 375px width THEN no text or controls SHALL overflow.

**Independent Test**: Visual review at 375px and 1280px confirms one primary action, no overflow, and readable tenant context.

### LPDR-002: Web Interface Guidelines Compliance

**User Story**: As a keyboard or assistive tech user, I want the login page to remain usable and understandable.

**Acceptance Criteria**:

1. WHEN the page renders THEN it SHALL have one semantic `<main>` region.
2. WHEN the Google button receives keyboard focus THEN visible `focus-visible` styling SHALL appear.
3. WHEN errors render THEN they SHALL be announced with `aria-live="polite"`.
4. WHEN form submission starts THEN pending state SHALL avoid layout shift and clearly disable duplicate submit attempts if a client button is used.
5. WHEN icons are decorative THEN they SHALL be `aria-hidden="true"` or inside a button with clear text.

**Independent Test**: Code audit against Web Interface Guidelines has no P1 findings for `/login`.

### LPDR-003: Distinctive Pong Ping Visual Direction

**User Story**: As a product owner, I want login to feel like part of the Pong Ping app, not a default shadcn auth card.

**Acceptance Criteria**:

1. WHEN visual styling is implemented THEN it SHALL use existing court-green, ink, and ball/accent tokens rather than new one-off colors.
2. WHEN layout is composed THEN it SHALL avoid nested cards and avoid styling the whole page as a floating generic card.
3. WHEN typography is applied THEN heading/body hierarchy SHALL use existing `--font-display` and `--font-sans` tokens with stable sizing.
4. WHEN decorative details appear THEN they SHALL support table-tennis/auth context and not reduce readability.
5. WHEN reduced motion is preferred THEN any nonessential animation SHALL be disabled or avoided.

**Independent Test**: Before/after visual review shows login aligned with current sport-console direction.

### LPDR-004: Auth Behavior Preservation

**User Story**: As a maintainer, I want visual changes to avoid auth regressions.

**Acceptance Criteria**:

1. WHEN a user is already authenticated THEN redirect behavior SHALL stay identical.
2. WHEN `error` query param is present THEN mapped error behavior SHALL stay equivalent.
3. WHEN Google sign-in is submitted THEN existing pending tenant cookie and OAuth flow SHALL be preserved.
4. WHEN login fails because tenant/email is invalid THEN user-facing copy SHALL stay safe and actionable.

**Independent Test**: Existing auth tests plus new login UI checks pass.

---

## Current Login Findings

| Evidence | Guideline / Design Issue |
| --- | --- |
| `app/login/page.tsx:52` | Full page centered card is generic; no product-specific composition. |
| `app/login/page.tsx:53` | Card is main page structure; redesign should avoid card-as-page shell. |
| `app/login/page.tsx:55` | Heading is just product name; weak task hierarchy. |
| `app/login/page.tsx:66` | Form is mostly tenant field; this becomes dead weight after query-param change. |
| `app/login/page.tsx:83` | Primary button is correct action but could carry stronger hierarchy and pending affordance. |

## Design Direction

| Dimension | Direction |
| --- | --- |
| Purpose | Auth entry for players/admins entering a tenant-scoped club workspace. |
| Tone | Refined sport console: calm, precise, club-ready, not marketing-heavy. |
| Layout | Split functional composition on desktop: brand/tenant context region plus compact auth action region; stacked single-column on mobile. |
| Color | Existing green/ink/amber tokens from global theme; no purple-blue gradients or glow-heavy dark hero. |
| Typography | Display font for concise title, body font for tenant/error copy, no viewport-width font scaling. |
| Differentiator | Tenant badge/context feels like entering a specific club table, with login action treated as the only tool. |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Long tenant name | Wrap or clamp without pushing button off-screen. |
| `tenant_not_found` error | Show clear recovery: check link or ask admin for new login link. |
| Mobile safe area | Primary content remains visible with `px`/`py` and no unwanted horizontal scroll. |
| Dark mode | Existing tokens keep contrast; native controls remain legible. |
| Google icon/loading icon | Decorative icon does not replace text label. |

## Requirement Traceability

| Requirement | Primary Areas |
| --- | --- |
| LPDR-001 | `app/login/page.tsx` layout and copy |
| LPDR-002 | `app/login/page.tsx`, `components/ui/button.tsx`, alert behavior |
| LPDR-003 | `app/login/page.tsx`, `app/globals.css` tokens as existing source |
| LPDR-004 | `app/actions/auth.ts`, `auth.ts`, existing tests |

## Success Criteria

- [ ] `/login` has no visible tenant input.
- [ ] Page presents one clear Google sign-in action.
- [ ] Tenant context is read-only and handles default/query cases.
- [ ] Login errors are accessible and actionable.
- [ ] Mobile and desktop visual review passes.
- [ ] `pnpm lint`, `pnpm test`, and `pnpm build` pass after implementation.
