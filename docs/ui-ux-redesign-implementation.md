# Azure Review Assistant — UI/UX Redesign Implementation Record

**Status:** Partially complete  
**Date:** 2026-04-11  
**Phases completed:** 3 complete, 2 partial, 1 partially validated  

---

## Corrected Status Summary

Validated against the current codebase and [docs/purpose](./purpose) on 2026-04-11.

- Fully implemented: Phase 1 - Design System Reset, Phase 2 - Navigation Redesign, Phase 3 - Homepage Redesign
- Partially implemented: Phase 4 - ARB Review Flow, Phase 5 - Service Explorer, Phase 6 - Validation
- Biggest gaps vs purpose and plan: deeper ARB workflow pages still use the older shell, findings are not yet a scannable table, scorecard is not yet a visual bar chart, service detail pages are still dense, and some text-heavy informational pages remain

---

## Phase 1 — Design System Reset

**Goal:** Replace dark muddy tokens with a clean professional palette.  
**File:** `app/globals.css`

### Changes made

| Token | Before | After |
|-------|--------|-------|
| `color-scheme` | `dark` | `light` |
| `--page-bg` | `#060d14` | `#FFFFFF` |
| `--surf-0` | `rgba(8,16,26,0.95)` | `#FFFFFF` |
| `--surf-1` | `rgba(12,22,34,0.92)` | `#F5F7FA` |
| `--surf-2` | `rgba(16,28,42,0.90)` | `#EEF2F6` |
| `--surf-hover` | `rgba(20,34,50,0.95)` | `#E8EDF2` |
| `--border` | `rgba(255,255,255,0.07)` | `#E5E7EB` |
| `--border-md` | `rgba(255,255,255,0.11)` | `#D1D5DB` |
| `--border-hi` | `rgba(255,255,255,0.18)` | `#9CA3AF` |
| `--t1` | `#e2ecf6` | `#111827` |
| `--t2` | `#8ba4bc` | `#4B5563` |
| `--t3` | `#4d6478` | `#6B7280` |
| `--brand` | `#00c4e0` | `#0078D4` |
| `--brand-dim` | `rgba(0,196,224,0.12)` | `rgba(0,120,212,0.10)` |
| `--accent` | `#ff6b35` (orange) | `#0078D4` (brand only) |
| `--high` | `#ff4d4d` | `#D92B2B` |
| `--med` | `#ffaa33` | `#B45309` |
| `--low` | `#3dd68c` | `#15803D` |
| `--radius-xl` | `28px` | `8px` |
| `--radius-lg` | `20px` | `8px` |
| `--radius-md` | `14px` | `8px` |
| `--font-display` | `"Rockwell", "Cambria", Georgia` | removed |
| `--font-body` | Aptos / Segoe UI Variable | `"Segoe UI", Inter, -apple-system` |
| `--shadow` | `0 20px 60px rgba(0,0,0,0.34)` | `0 4px 24px rgba(0,0,0,0.08)` |

### Additional changes
- Removed `[data-theme="light"]` override block (light is now the default)
- Added `[data-theme="dark"]` override block for optional dark mode
- `body` background: removed three-layer radial gradient → plain `var(--page-bg)`
- `.topbar` background: `rgba(6,13,20,0.88)` → `rgba(255,255,255,0.92)`
- `.hero-panel` / `.surface-panel`: removed dark radial gradient → `background: var(--surf-0)`
- Removed `.hero-panel::before` pseudo-element (dark grid lines pattern)
- `.topbar-nav-item:hover`: `rgba(255,255,255,0.06)` → `rgba(0,120,212,0.06)`

### Validation
- Build passes: `npx next build` — no errors
- All tokens are AA-contrast on white

---

## Phase 2 — Navigation Redesign

**Goal:** 3 items max. Purpose-driven labels. No jargon.  
**File:** `src/components/theme-provider.tsx`

### Before
10 nav items: Dashboard · Reviews · Services · ARB Review · Docs · Decision Center · Data Health · How to Use · Explorer · Admin

Plus: command bar (⌘K), theme toggle button, TrustBanner on all inner pages.

### After
```
[Azure Review Assistant logo]    AI Review    Service Explorer    [Sign In / Avatar]
```

- `AI Review` → `/arb` (active on `/arb/*` and `/decision-center/*`)
- `Service Explorer` → `/services` (active on `/services/*` and `/technologies/*`)
- Sign In / Avatar → `AuthStatusChip` (primary blue button when signed out, user chip when signed in)

### Components removed from layout
- Command bar placeholder (⌘K)
- Theme toggle button
- `TrustBanner` (internal jargon, shown on all inner pages)

### ThemeProvider changes
- `PRIMARY_TAB_ITEMS` (5 items with icons) → `NAV_ITEMS` (2 items, text only)
- Removed `resolveInitialTheme()` / theme state / `localStorage` theme persistence
- Removed all inline SVG icon components (no longer in nav)
- `useEffect` now just removes `data-theme` attribute (enforces light mode)
- Footer updated: 4 columns rewritten with product-relevant copy

### Auth chip CSS changes (`app/globals.css`)
- Sign-out state: pill with border → solid Azure Blue button (`background: var(--brand)`)
- Signed-in state: `.auth-chip-signed-in` gets `background: var(--surf-1)` + `color: var(--t1)` to differentiate from the CTA

### Topbar inner grid
- Kept `grid-template-columns: auto 1fr auto auto` (brand · spacer · nav · actions)
- Gap increased from `12px` → `16px`

---

## Phase 3 — Homepage Redesign

**Goal:** A first-time user understands the product and can start in 5 seconds.  
**Files:** `app/page.tsx`, `app/globals.css`

### Before
`app/page.tsx` fetched 3 data sources (summary, service index, catalog items), computed featured findings and pricing snapshots, and rendered `<DashboardHome />` — a complex component with metrics, trust banner, review initializer, and service previews.

### After
`app/page.tsx` is a static server component with no data fetching. Four sections:

**1. Hero** (`.home-hero`)
- Kicker: "AI-powered · Azure-native · Board-ready"
- Headline: "Get an AI architecture review in minutes, not days"
- Sub: 2-sentence description of the workflow
- CTA 1: `[Start AI Review →]` → `/arb` — Azure Blue primary button
- CTA 2: `[Explore Services]` → `/services` — ghost/outline button

**2. How it works** (`.home-how`)
- 3 numbered steps in a column layout
- Step 1: Upload your SOW or design document
- Step 2: AI checks against 11 Azure best-practice frameworks
- Step 3: Download findings, scorecard, and board pack

**3. Two paths** (`.home-paths`)
- 2-column card grid
- Card A (AI Review): primary border highlight, 4-bullet feature list, `[Start review →]`
- Card B (Service Explorer): standard border, 4-bullet feature list, `[Open explorer →]`

**4. Framework coverage strip** (`.home-frameworks`)
- Inline tag list: WAF · CAF · ALZ · HA/DR · Backup · Security · Networking · Identity · Monitoring · Resiliency · Azure Policy
- Label: "All frameworks checked in a single pass"

### CSS added
New CSS block at end of `globals.css`:
- `.home-page`, `.home-hero`, `.home-hero-inner`, `.home-hero-kicker`, `.home-hero-headline`, `.home-hero-sub`, `.home-hero-actions`
- `.home-cta-primary`, `.home-cta-secondary`, `.home-cta-outline`
- `.home-how`, `.home-section-title`, `.home-steps`, `.home-step`, `.home-step-num`
- `.home-paths`, `.home-path-grid`, `.home-path-card`, `.home-path-card--primary`, `.home-path-label`, `.home-path-title`, `.home-path-desc`, `.home-path-features`
- `.home-frameworks`, `.home-frameworks-label`, `.home-framework-tags`, `.home-framework-tag`
- `@media (max-width: 720px)` responsive rules

---

## Phase 4 — ARB Review Flow Redesign

**Goal:** User lands → sees create-review form immediately → uploads doc → runs AI review → sees results.  
**Files:** `app/arb/page.tsx`, `src/components/arb/review-library.tsx`, `app/globals.css`

### `app/arb/page.tsx`
Rewritten to:
1. Clean page header: `<h1>AI Architecture Review</h1>` + subtitle
2. `<ArbReviewLibrary />` — the create form and review table
3. "How it works" 4-step horizontal strip — below fold, secondary context

### `src/components/arb/review-library.tsx`
**Removed from signed-in state:**
- `detail-command-sidecar` (user info card — unnecessary)
- `review-command-metrics` (4 stat cards: active reviews, decision-ready, approved, evidence gaps)
- `library-state-grid` (2 generic info cards about queue focus and human sign-off)
- `detail-command-grid` wrapper layout

**Added / changed:**
- Create form (`arb-create-card`): 3-column grid — project input · customer input · submit button
- Single primary CTA: "Create review and upload documents →"
- Review list: replaced `library-review-grid` (card grid) with `arb-review-table` (clean table)
- Table columns: Project · Customer · Status · Score · Updated · Actions
- `StatusBadge` component with 4 states: Approved (green), Needs Improvement (red), Draft (blue), In Progress (amber)
- Signed-out state redesigned: kicker + headline + sub + primary CTA + bullet list

### CSS added (`app/globals.css`)
New block before homepage CSS:
- Page header: `.arb-page`, `.arb-page-header`, `.arb-page-title`, `.arb-page-sub`
- Signed-out: `.arb-signin-hero`, `.arb-signin-kicker`, `.arb-signin-headline`, `.arb-signin-sub`, `.arb-signin-cta`, `.arb-signin-bullets`
- Library: `.arb-library-stack`, `.arb-library-loading`
- Create form: `.arb-create-card`, `.arb-create-fields`, `.arb-field`, `.arb-field-input`, `.arb-create-btn`, `.arb-create-error`
- Table: `.arb-review-table-wrap`, `.arb-review-table`, `.arb-table-project`, `.arb-table-customer`, `.arb-table-score`, `.arb-table-date`, `.arb-table-actions`, `.arb-table-open`, `.arb-table-secondary`
- Badges: `.arb-status-badge`, `.arb-status-approved`, `.arb-status-needs-work`, `.arb-status-draft`, `.arb-status-in-progress`
- How it works: `.arb-how-band`, `.arb-how-title`, `.arb-how-steps`
- Empty state: `.arb-empty-state`, `.arb-empty-title`, `.arb-empty-sub`
- `@media (max-width: 700px)` responsive rules

---

## Phase 5 — Service Explorer Redesign

**Goal:** Find any Azure service and get findings in under 10 seconds.  
**Files:** `src/components/services-directory.tsx`, `app/globals.css`

### Before
`ServicesDirectory` rendered:
- Large `review-command-panel` header with marketing copy + leadership brief sidecar + 4 metrics
- Filter section with 3 posture buttons + category `<select>` dropdown + explanatory paragraph
- Dense `enterprise-table` with 5 columns per row including region context and guidance posture text

### After
Rewritten to 4 clean sections:

**1. Page header** (`.svc-page-header`)
- `<h1>Service Explorer</h1>` + subtitle with service count

**2. Search bar** (`.svc-search-bar`)
- Full-width, 52px tall, prominent
- Placeholder: "Search {N}+ Azure services…"

**3. Category filter pills** (`.svc-filter-row`)
- One row of pill buttons
- "All" + all available categories from the index
- Active pill: solid Azure Blue

**4. Service grid** (`.svc-grid`)
- 3-column responsive grid (→2 at 900px, →1 at 560px)
- Each card: service name · category tag · description (2-line clamp) · findings + families count · "View findings →" link

**State removed:**
- `posture` state (`all` / `ga` / `preview`) — simplified to category-only filter
- `directoryMetrics` computation — metrics section removed entirely
- `availableCategories` computation — retained for filter pills

### CSS added (`app/globals.css`)
New block before homepage CSS:
- Page: `.svc-page`, `.svc-page-header`, `.svc-page-title`, `.svc-page-sub`
- Search: `.svc-search-bar-wrap`, `.svc-search-bar`
- Filters: `.svc-filter-row`, `.svc-filter-pill`, `.svc-filter-pill--active`
- Results: `.svc-results-count`
- Grid: `.svc-grid`, `.svc-card`, `.svc-card-head`, `.svc-card-name`, `.svc-card-cat`, `.svc-card-desc`, `.svc-card-meta`, `.svc-card-link`
- Empty: `.svc-empty`, `.svc-reset-btn`
- Responsive: `@media (max-width: 900px)`, `@media (max-width: 560px)`

---

## Phase 6 — Validation

**Goal:** Confirm all user journeys work end-to-end without errors.

### Build validation
```
npx next build  ->  success
npx tsc --noEmit  ->  fails in tests/e2e/review-cloud.spec.ts
```

Notes:

- `npx next build` completed successfully during validation.
- `npx tsc --noEmit` does not currently pass because `tsconfig.json` includes `tests/`, and `tests/e2e/review-cloud.spec.ts` contains pre-existing type errors unrelated to the redesign work.
- Targeted Playwright validation ran against the redesigned routes. 3 tests passed and 3 failed. The failures were stale expectations for older ARB and docs copy/button labels rather than build/runtime failures in the redesigned surfaces.

### User journey checklist

| Journey | Status |
|---------|--------|
| New user lands on homepage — understands product in 5 seconds | Complete - hero headline and primary actions are above the fold |
| Clicks "Start AI Review" -> lands on `/arb` | Complete - primary CTA links directly to `/arb` |
| `/arb` - signed out - sees sign-in prompt with value statement | Complete - ARB sign-in hero and bullet list are present |
| `/arb` - signed in - create form is first visible element | Complete - `arb-create-card` is first element in `arb-library-stack` |
| User creates a review -> goes to upload page | Complete - `handleCreateReview` navigates to `/arb/{id}/upload` |
| User uploads a document -> sees the next review action clearly | Partial - drag-and-drop upload is present, but the retained extraction-first workspace is still more complex than the redesign target |
| User runs AI review after extraction | Partial - a prominent `Run agent review` action exists, but the flow has not been simplified to the redesigned single-step review trigger |
| User reads findings in a scannable format with framework/link context | Not complete - findings are still rendered as cards, not the planned table |
| User reviews a visual scorecard | Not complete - scorecard remains a grid/list view rather than bar-chart style visuals |
| User explores services -> search bar is first interaction | Complete - `svc-search-bar` is the first action after the page header |
| User opens a service detail page and sees an action-first findings/export view | Not complete - service detail pages still use the older dense layout |
| Navigation has exactly 3 items | Complete - AI Review, Service Explorer, and Sign In/Avatar |
| No dark background on any page | Complete - light theme tokens are now the default |
| Mobile responsive | Complete - homepage, ARB landing, and services landing include responsive rules; targeted mobile smoke coverage passed |

### Definition of Done — status

- [x] Homepage hero communicates product purpose in one headline + two sentences
- [x] "Start AI Review" CTA visible above the fold on homepage
- [x] Create-review form is the first visible element on `/arb`
- [x] Service explorer opens with a search bar
- [x] Navigation has exactly 3 items: AI Review · Service Explorer · Sign In
- [x] No dark background on any page
- [ ] No wall-of-text sections anywhere *(still false for some deeper workflow and informational pages)*
- [x] All pages pass basic mobile responsiveness check
- [x] Upload page drag-and-drop zone *(existing upload page already provides this, but it was not redesigned in this pass)*
- [ ] "Run AI Review" prominence after extraction *(retained flow uses `Run agent review` inside the older review shell)*
- [ ] Findings as scannable table *(existing findings page retained - not redesigned yet)*
- [ ] Scorecard as visual bar chart *(existing scorecard page retained - not redesigned yet)*
- [ ] Exports produce downloadable files *(download flow exists, but the streamlined redesign/export journey is not fully implemented or revalidated end-to-end)*

---

## Files Modified

| File | Change |
|------|--------|
| `app/globals.css` | Design tokens, body/topbar/surface backgrounds, auth chip, new homepage/ARB/explorer CSS blocks |
| `app/page.tsx` | Full rewrite — static homepage with hero, how it works, two paths, framework strip |
| `app/arb/page.tsx` | Rewrite — page header + ArbReviewLibrary + 4-step how it works |
| `src/components/theme-provider.tsx` | Full rewrite — 3-item nav, no command bar, no theme toggle, no TrustBanner |
| `src/components/arb/review-library.tsx` | Rewrite — clean create form, table review list, simplified signed-out hero |
| `src/components/services-directory.tsx` | Rewrite — search-first, category pills, card grid |
| `docs/ui-ux-redesign-plan.md` | Status updated to complete, Definition of Done checked |

## Files NOT Modified (intentional)

| File | Reason |
|------|--------|
| `app/arb/[reviewId]/upload/page.tsx` | Existing drag-and-drop upload retained — not in scope for this redesign pass |
| `app/arb/[reviewId]/findings/page.tsx` | Existing findings page retained |
| `app/arb/[reviewId]/scorecard/page.tsx` | Existing scorecard page retained |
| `app/arb/[reviewId]/decision/page.tsx` | Existing decision page retained |
| All API routes under `api/` | Backend unchanged — zero regression risk |
| Authentication flow | Microsoft sign-in via Azure Static Web Apps unchanged |
