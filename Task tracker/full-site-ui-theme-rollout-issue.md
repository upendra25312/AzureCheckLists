# Full-Site Azure Review Board Theme Rollout Issue

Last updated: April 9, 2026

## Objective

Bring the entire Azure Checklists website onto the same Azure Review Board visual system already established on the homepage so every primary route feels like part of one product.

The target theme is:

- Azure Review Board top navigation and tab framing
- action-first dashboard layout
- soft white panels with subtle borders and shadows
- bold operational headings and compact supporting copy
- consistent search, input, table, and card patterns
- blue primary-action treatment and Azure-style interaction rhythm

## Why This Work Is Needed

The homepage already follows the new UI direction, but most internal routes still use the older editorial shell. That creates visible inconsistency in:

- navigation structure
- page hierarchy
- card density
- CTA styling
- trust/status placement
- form and filter controls

Without a shared rollout, the product feels stitched together instead of intentionally designed.

## Scope

In scope:

- global shell and page chrome
- shared CSS tokens and reusable UI primitives
- homepage alignment clean-up where needed
- review workflow pages
- directory and detail pages
- data health, admin, and advanced tools pages
- mobile and desktop validation for each completed task
- Playwright validation updates for changed flows

Out of scope for this issue:

- new product features unrelated to theme consistency
- backend/API changes unless required for UI wiring
- copy/IA overhauls beyond what is needed to fit the new shell

## Delivery Rules

- Do not regress current pricing, availability, save/resume, copilot, or admin behavior.
- Preserve route structure and working links unless there is an explicit redirect plan.
- Prefer shared components over page-specific CSS patches.
- Every completed task must include build validation plus either automated browser coverage or targeted manual browser validation.
- Do not mark a task complete until desktop and mobile behavior are checked.

## Shared Validation Standard For Every Task

Each task below must end with:

1. `npm run build`
2. targeted route validation in a browser
3. mobile-width validation for the affected route(s)
4. Playwright update or execution when the task changes an existing tested flow
5. notes added to the commit summary or implementation log

## Implementation Plan

### Task 1: Shared shell and navigation foundation

Status: Completed
Priority: P0

Work:

- Replace the split homepage/non-home shell in `src/components/theme-provider.tsx` with one site-wide Azure Review Board shell.
- Make all top-level pages use the same header, tab treatment, action area, identity entry point, and theme toggle language.
- Introduce reusable shell variants for:
  - primary app pages
  - admin pages
  - narrow informational pages
- Align footer/status treatment so it visually matches the homepage.
- Normalize page container widths and vertical spacing in `app/globals.css`.

Files likely touched:

- `src/components/theme-provider.tsx`
- `src/components/auth-status-chip.tsx`
- `src/components/trust-banner.tsx`
- `app/globals.css`
- possibly `app/layout.tsx`

Acceptance criteria:

- Homepage and non-home pages share the same top navigation family.
- Route changes preserve active-state clarity.
- The shell looks intentional on desktop and mobile.
- Existing sign-in and admin access entry points still work.

Test and validate:

- Run `npm run build`.
- Browser-check `/`, `/services`, `/review-package`, `/data-health`, `/admin/copilot`.
- Validate header wrap, tab overflow, and theme toggle on mobile width.
- Run or update Playwright coverage for shell/nav if selectors change.

### Task 2: Shared panel, card, and form component styling

Status: Completed
Priority: P0

Work:

- Consolidate card, panel, section-heading, metric-tile, and input styles into reusable theme classes.
- Replace remaining editorial-only surface patterns with the new board-card language.
- Normalize search bars, text inputs, textareas, chips, buttons, and toolbar blocks.
- Create utility classes for:
  - card headers with icon pills
  - operational subtitles
  - summary stat rows
  - compact action rows

Files likely touched:

- `app/globals.css`
- shared components that currently use old utility classes

Acceptance criteria:

- Inputs, buttons, chips, and cards feel consistent across major routes.
- New shared styles reduce duplicated page-specific visual overrides.
- No route looks like it belongs to a different design system.

Test and validate:

- Run `npm run build`.
- Browser-check `/`, `/services`, `/review-package`.
- Validate hover, focus, disabled, and empty states.
- Update screenshots or Playwright assertions where shared class names/structure changed.

### Task 3: Review workspace shell migration

Status: Completed
Priority: P0

Work:

- Restyle `src/components/review-package-workbench.tsx` to match the homepage board layout.
- Convert the current workspace intro and controls into dashboard-style panels.
- Reframe stage blocks using the new card system rather than older editorial sections.
- Make primary actions visually match the homepage CTA treatment.

Files likely touched:

- `src/components/review-package-workbench.tsx`
- `src/components/review-cloud-controls.tsx`
- `src/components/project-review-copilot.tsx`
- `app/globals.css`
- `tests/e2e/review-workspace-shell.spec.ts`

Acceptance criteria:

- `/review-package` clearly looks like part of the same Azure Review Board product as `/`.
- Major review actions are easier to scan than the current stacked editorial layout.
- Save/resume/export actions remain functional.

Test and validate:

- Run `npm run build`.
- Browser-check `/review-package` setup, service selection, and export sections.
- Validate mobile stacking and drawer usability.
- Run relevant Playwright review workflow tests.

### Task 4: My Project Reviews migration

Status: Completed
Priority: P0

Work:

- Restyle the saved-review library into the same board/card language.
- Bring search, filter, archive, restore, and resume actions into the new shell.
- Ensure empty, loading, signed-out, and populated states all fit the new theme.

Files likely touched:

- `src/components/project-review-library.tsx`
- `src/components/auth-status-chip.tsx`
- `app/globals.css`
- `tests/e2e/board-surfaces.spec.ts`

Acceptance criteria:

- `/my-project-reviews` looks like a first-class area in the same product family.
- Signed-in and signed-out states are visually consistent with homepage and review pages.
- Table/list density remains readable on mobile.

Test and validate:

- Run `npm run build`.
- Browser-check `/my-project-reviews` in signed-out and signed-in states.
- Validate resume/archive/restore buttons visually and functionally.
- Run existing review-cloud Playwright coverage and extend if needed.

### Task 5: Services directory migration

Status: Ready
Priority: P1

Work:

- Restyle `src/components/services-directory.tsx` from editorial hero + cards into board-style command surface + results grid.
- Align search and posture filters with the homepage service/region card language.
- Reduce hero prose and emphasize direct browsing actions.

Files likely touched:

- `src/components/services-directory.tsx`
- `app/globals.css`

Acceptance criteria:

- `/services` shares the same visual hierarchy as the homepage workflow cards.
- Filter controls and result cards look like part of the same board system.
- Search remains fast and readable on desktop and mobile.

Test and validate:

- Run `npm run build`.
- Browser-check `/services` with search and posture filters.
- Validate mobile overflow and card spacing.
- Add/update Playwright route coverage if selector structure changes materially.

### Task 6: Service detail page migration

Status: Ready
Priority: P1

Work:

- Restyle `src/components/service-page-view.tsx`, `src/components/service-pricing-panel.tsx`, and `src/components/service-regional-fit.tsx`.
- Convert service details into board-style sections with compact evidence cards.
- Make pricing and regional-fit blocks visually consistent with the homepage preview cards.

Files likely touched:

- `src/components/service-page-view.tsx`
- `src/components/service-pricing-panel.tsx`
- `src/components/service-regional-fit.tsx`
- `app/globals.css`

Acceptance criteria:

- `/services/[slug]` feels consistent with homepage and review workflow pages.
- Region-fit and pricing are easier to scan without losing fidelity.
- Action hierarchy remains clear.

Test and validate:

- Run `npm run build`.
- Browser-check at least two representative service pages such as AKS and API Management.
- Validate pricing table responsiveness and region signal readability on mobile.
- Add/update browser tests if applicable.

### Task 7: Technology detail page migration

Status: Ready
Priority: P1

Work:

- Restyle `src/components/technology-page-view.tsx`.
- Align evidence, metadata, and checklist grouping with the board theme.
- Ensure cross-links back to services and review workflow use the new action style.

Files likely touched:

- `src/components/technology-page-view.tsx`
- `app/globals.css`

Acceptance criteria:

- `/technologies/[slug]` no longer feels visually separate from the rest of the site.
- Dense checklist content remains readable.

Test and validate:

- Run `npm run build`.
- Browser-check one or more technology detail pages.
- Validate typography, spacing, and anchor navigation on mobile.

### Task 8: Data Health page migration

Status: Ready
Priority: P1

Work:

- Restyle `src/components/data-health-view.tsx` into the board/dashboard language.
- Convert traceability and health cards to use the shared operational card system.
- Keep live backend evidence readable without reverting to editorial layout.

Files likely touched:

- `src/components/data-health-view.tsx`
- `app/globals.css`

Acceptance criteria:

- `/data-health` looks like an operational board, not a separate microsite.
- Health metrics and evidence blocks are easier to scan.

Test and validate:

- Run `npm run build`.
- Browser-check `/data-health` with live API responses.
- Validate compact metric layout on desktop and mobile.

### Task 9: Admin Copilot page migration

Status: Ready
Priority: P1

Work:

- Restyle `src/components/admin-copilot.tsx` to use the same board system while preserving admin-only context.
- Align prompt composer, answer cards, health evidence, and notes with the shared dashboard theme.
- Keep admin states distinct but still visually consistent with the public product shell.

Files likely touched:

- `src/components/admin-copilot.tsx`
- `app/globals.css`

Acceptance criteria:

- `/admin/copilot` matches the Azure Review Board visual system.
- Prompt workflow, health evidence, and auth states remain clear.
- Admin-only affordances still feel intentional, not patched in.

Test and validate:

- Run `npm run build`.
- Browser-check signed-out, non-admin, and admin states.
- Run `npm run test:e2e:admin-copilot`.

### Task 10: Advanced Tools and informational pages migration

Status: Ready
Priority: P2

Work:

- Restyle `src/components/explorer-client.tsx`.
- Align `/how-to-use` and `app/not-found.tsx` with the shared shell and typography.
- Remove remaining old editorial-only page structures.

Files likely touched:

- `src/components/explorer-client.tsx`
- `app/how-to-use/page.tsx`
- `app/not-found.tsx`
- `app/globals.css`

Acceptance criteria:

- No major public route remains on the old visual style.
- Secondary pages still feel lighter than core workflow pages without breaking theme consistency.

Test and validate:

- Run `npm run build`.
- Browser-check `/explorer`, `/how-to-use`, and a forced 404 route.
- Validate mobile spacing and fallback messaging.

### Task 11: Cross-site responsive and accessibility pass

Status: Ready
Priority: P0

Work:

- Review all changed routes at desktop, tablet, and mobile widths.
- Fix header overflow, tab wrapping, long-card content, CTA clipping, and table overflow.
- Validate keyboard focus, visible focus styling, and target sizes.

Files likely touched:

- mostly `app/globals.css`
- any affected page components

Acceptance criteria:

- Header and key controls are usable on common mobile widths.
- No obvious overflow or clipped text remains on changed pages.
- Keyboard navigation remains visible and usable.

Test and validate:

- Run `npm run build`.
- Browser-check all major changed routes at multiple widths.
- Capture fresh screenshots for changed pages.
- Run the updated Playwright suite.

### Task 12: Final regression and rollout validation

Status: Ready
Priority: P0

Work:

- Run final regression on critical product paths:
  - homepage initialize flow
  - services browse flow
  - review-package flow
  - my-project-reviews flow
  - data-health page
  - admin copilot flow
- Confirm no deployment regressions after the theme migration.
- Prepare before/after validation notes.

Acceptance criteria:

- Site theme is visually consistent across all major routes.
- Core workflows still function.
- Tests pass and deployment is healthy.

Test and validate:

- Run `npm run build`.
- Run targeted Playwright commands for review-cloud and admin flows.
- Perform a final live-site smoke check after deployment.
- Record any residual follow-up items separately from this issue.

## Recommended Execution Order

1. Task 1 Shared shell and navigation foundation
2. Task 2 Shared panel, card, and form component styling
3. Task 3 Review workspace shell migration
4. Task 4 My Project Reviews migration
5. Task 5 Services directory migration
6. Task 6 Service detail page migration
7. Task 7 Technology detail page migration
8. Task 8 Data Health page migration
9. Task 9 Admin Copilot page migration
10. Task 10 Advanced Tools and informational pages migration
11. Task 11 Cross-site responsive and accessibility pass
12. Task 12 Final regression and rollout validation

## Progress Log

- April 9, 2026: Issue created and ready for implementation.
- April 9, 2026: Task 1 completed. The site now uses one shared Azure Review Board shell across homepage, workflow, services, data health, and admin routes.
- April 9, 2026: Task 1 validation passed with `npm run build` plus targeted Playwright coverage for shared shell, admin copilot, and review-cloud flows.
- April 9, 2026: Task 2 completed. Shared board-style panel, card, chip, button, toolbar, and form styling now applies across the main routes, with initial utility-class adoption in the services directory and saved-review library.
- April 9, 2026: Task 2 validation passed with `npm run build` and targeted Playwright coverage for board surfaces, shared shell, admin copilot, and review-cloud flows.
- April 9, 2026: Task 3 completed. The `/review-package` workspace now uses a board-style command panel, staged preview cards, and unified board-stage surfaces that visually align with the homepage while preserving the working review flow.
- April 9, 2026: Task 3 validation passed with `npm run build`, targeted Playwright coverage including the new `review-workspace-shell` spec, and fresh desktop/mobile route screenshots.
- April 9, 2026: Task 4 completed. `/my-project-reviews` now uses a board-style library shell with command metrics, signed-in lifecycle cards, and denser saved-review cards that keep resume/archive/delete actions in the same product family.
- April 9, 2026: Task 4 validation passed with `npm run build`, targeted Playwright coverage for shared shell, board surfaces, and review-cloud flows, plus fresh desktop/mobile screenshots for the saved-review library route.
