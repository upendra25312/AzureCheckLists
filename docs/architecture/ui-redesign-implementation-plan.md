# UI Redesign Implementation Plan
**Azure Review Assistant — Dark-First Bento Grid Refactor**

> Generated: April 2025  
> Budget target: ≤ $60 / month Azure infra  
> Mockup reference: `ui-mockup.html` (bento grid, dark-first, Linear × Vercel × Snyk inspired)

---

## 1. Executive Summary

The current site ([jolly-sea-014792b10.6.azurestaticapps.net](https://jolly-sea-014792b10.6.azurestaticapps.net)) has solid backend data depth but a light-first, text-heavy, icon-free UI that fails to communicate value in the first 3 seconds. This plan refactors the Next.js 15 frontend — zero backend changes, zero infrastructure changes — to match the redesigned mockup in `ui-mockup.html`.

**Research basis:**
- **Linear.app** — dark-first, tight typography, one-direction scroll, minimal colour
- **Vercel dashboard** — sticky topbar, metric strip with sparklines, information density
- **Stripe** — KPI cards, command bar (⌘K), consistent card proportions
- **Snyk / Datadog** — severity-coded findings rows, left-border + tint + badge system
- **Bento Grid (Apple / SaaS 2025)** — variable-size modular CSS grid cards
- **Glassmorphism 2025** — subtle `backdrop-filter`, thin `rgba` borders, no heavy blur

---

## 2. What Changes — Overview

| Area | Current state | Target state |
|---|---|---|
| Colour system | Light-first (`--bg: #edf3f8`) | Dark-first (`--page-bg: #060d14`) |
| Hero layout | 2-column text + fake data panel | Bento grid: headline + preview + 3 stat cards |
| Navigation | Text-only tabs, ARB buried 2 levels deep | Icons on every tab, ARB as top-level item with badge |
| Sign-in | Small chip, hard to see | Large "Sign in with Microsoft" button with MS logo grid |
| Command bar | None | ⌘K command bar placeholder in topbar |
| Findings display | All severities look identical | Red/amber/green left-border + background tint + badge |
| Stat cards | Numbers in prose | Cards with SVG sparklines + trend lines |
| How it works | Decorative step numbers | Numbered circles connected by horizontal line |
| ARB mode | Invisible unless user navigates | Full-width spotlight section on homepage |
| Services browser | Text list, no icons | Icon boxes per service + severity count badges |
| Footer | Missing on homepage | 4-column grid on all pages |
| SEO | No OG tags, no sitemap | Full OG/Twitter meta, robots.txt, sitemap.xml |

---

## 3. Azure Infra Cost Breakdown ($60/month target)

| Service | Tier/SKU | Purpose | Est. monthly cost |
|---|---|---|---|
| Azure Static Web Apps | **Free** | Hosts Next.js static export, built-in auth (`/.auth/`) | **$0.00** |
| Azure Functions | **Flex Consumption** | API: pricing, region fit, copilot, review records, ARB | **$0–$2** |
| Azure Blob Storage | LRS Hot | Pricing cache JSON, ARB uploaded files, review exports | **~$0.50** |
| Azure Table Storage | LRS | Review state, ARB records, telemetry | **~$0.10** |
| Azure Application Insights | Pay-as-you-go (5 GB free) | API health, telemetry, refresh state monitoring | **~$1–$3** |
| Azure OpenAI | GPT-4o-mini pay-per-token | Admin copilot, review copilot, ARB extraction | **~$5–$15** |
| **Total** | | | **~$7–$21/month** |

**Verdict: Well within $60/month.** At 5× traffic growth the estimate stays under $35/month. The only variable is Azure OpenAI — using `gpt-4o-mini` at $0.15/1M input tokens keeps costs predictable.

**Cost guardrails:**
- Keep Static Web Apps on Free tier (Standard = $9/month, not needed unless custom domain SLA required)
- Azure Functions stays on Flex Consumption — zero idle cost
- Set Application Insights daily cap at 1 GB in portal
- Set blob lifecycle policy: tier ARB files to Cool after 30 days

---

## 4. Phased Implementation Plan

### Phase 1 — Design Token System
**File:** `app/globals.css`

Complete rewrite of `:root` (top ~80 lines). Dark is now the default. `[data-theme="light"]` becomes the override block.

**New `:root` tokens:**
```css
:root {
  --page-bg:    #060d14;
  --surf-0:     rgba(8,16,26,0.95);
  --surf-1:     rgba(12,22,34,0.92);
  --surf-2:     rgba(16,28,42,0.90);
  --surf-hover: rgba(20,34,50,0.95);
  --border:     rgba(255,255,255,0.07);
  --border-md:  rgba(255,255,255,0.11);
  --border-hi:  rgba(255,255,255,0.18);
  --t1: #e2ecf6;       /* primary text */
  --t2: #8ba4bc;       /* muted text */
  --t3: #4d6478;       /* very muted */
  --brand:      #00c4e0;
  --brand-dim:  rgba(0,196,224,0.12);
  --accent:     #ff6b35;
  --accent-dim: rgba(255,107,53,0.12);
  --high:       #ff4d4d;
  --high-dim:   rgba(255,77,77,0.13);
  --med:        #ffaa33;
  --med-dim:    rgba(255,170,51,0.13);
  --low:        #3dd68c;
  --low-dim:    rgba(61,214,140,0.12);
  --topbar-h:   60px;
}
```

**`body` background** replaces white gradient with:
```css
body {
  background: var(--page-bg);
  background-image:
    radial-gradient(ellipse 80% 40% at 20% -10%, rgba(0,196,224,0.08), transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 110%, rgba(255,107,53,0.06), transparent 55%),
    radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: auto, auto, 28px 28px;
}
```

**Lines changed:** ~155 tokens replaced/added; ~45 surface gradient lines replaced  
**Net CSS growth:** ~+30 lines

---

### Phase 2 — Layout Shell (Topbar + Footer)
**File:** `src/components/theme-provider.tsx`

**Changes:**
1. Fix system dark mode detection in `resolveInitialTheme()`:
   ```typescript
   // Line 97 — replace: return "light";
   return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
   ```

2. Add `icon: React.ReactNode` to `NavItem` type. Inline 5 small SVG icons (Dashboard, Reviews, Services, ARB Review, Docs).

3. Add ARB Review to `PRIMARY_TAB_ITEMS`:
   ```typescript
   { href: "/arb", label: "ARB Review", icon: <ShieldIcon />, hasBadge: true,
     matchPrefixes: ["/arb", "/decision-center"] }
   ```

4. Rewrite JSX: flat header → sticky `<header className="topbar">` with:
   - Brand mark (logo + name)
   - Command bar div (`⌘K` shortcut hint, non-functional placeholder)
   - Nav with icon + label + optional badge per item
   - Auth chip + theme toggle in `topbar-actions`

5. Move footer to render on **all** pages (remove `!isHome` guard). Upgrade to 4-column grid with columns: Product, Services, Workflow, Trust & Status.

**New CSS (`globals.css`):**
```css
.topbar {
  position: sticky; top: 0; z-index: 100;
  height: var(--topbar-h);
  background: rgba(6,13,20,0.88);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(20px) saturate(160%);
}
.topbar-inner {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center; gap: 16px; height: 100%;
  width: min(1440px, calc(100% - 32px)); margin: 0 auto;
}
.topbar-cmd {
  display: flex; align-items: center; gap: 10px;
  height: 38px; padding: 0 14px;
  border: 1px solid var(--border); border-radius: 999px;
  background: var(--surf-1); color: var(--t2);
  font-size: 0.88rem; cursor: pointer; max-width: 340px;
}
.topbar-nav-item {
  display: inline-flex; align-items: center; gap: 7px;
  min-height: 38px; padding: 0 13px; border-radius: 10px;
  color: var(--t2); font-weight: 600;
  transition: background 0.15s, color 0.15s;
}
.topbar-nav-item:hover { background: rgba(255,255,255,0.06); color: var(--t1); }
.topbar-nav-item--active { background: var(--brand-dim); color: var(--brand); }
.site-footer-grid { grid-template-columns: repeat(4, 1fr); }
```

**Lines changed in theme-provider.tsx:** ~197 → ~265 (+68)  
**New CSS lines:** ~120

---

### Phase 3 — Homepage Bento Grid
**File:** `src/components/dashboard-home.tsx`

**Remove:** current 2-col hero section and proof cards section.

**Add: Bento hero** (new first `<section>` in `<main>`):
```tsx
<section className="bento-hero">
  {/* Cell 1 — tall headline, grid-row 1/3 */}
  <article className="bento-cell bento-cell--headline">
    <p className="bento-kicker">Azure architects & review boards</p>
    <h1 className="bento-headline">
      Architecture reviews that<br /><em>ship,</em> not stall.
    </h1>
    <p className="bento-sub">Scope services, confirm findings with evidence, and export a
    review pack without rebuilding context mid-review.</p>
    <div className="bento-actions">
      <Link href="/review-package" className="primary-button">Start a review</Link>
      <Link href="/services" className="ghost-button">Explore services</Link>
    </div>
    <div className="bento-stat-chips">
      <span className="bento-chip">{serviceIndex.services.length}+ services</span>
      <span className="bento-chip">{summary.itemCount.toLocaleString()} findings</span>
      <span className="bento-chip">Pricing live · {pricingGeneratedDate}</span>
    </div>
  </article>

  {/* Cell 2 — preview panel, grid-row 1/3 */}
  <article className="bento-cell bento-cell--preview">
    <BentoPreviewPanel findings={featuredFindings} summary={summary} />
  </article>

  {/* Cells 3–5 — stat cards */}
  <article className="bento-cell bento-cell--stat">
    <Sparkline values={statTrend.services} label="Services trend" />
    <strong className="bento-stat-value">{serviceIndex.services.length}</strong>
    <span className="bento-stat-label">Azure services</span>
  </article>
  <article className="bento-cell bento-cell--stat">
    <Sparkline values={statTrend.findings} label="Findings trend" color="var(--high)" />
    <strong className="bento-stat-value">{summary.itemCount.toLocaleString()}</strong>
    <span className="bento-stat-label">WAF-aligned findings</span>
  </article>
  <article className="bento-cell bento-cell--stat bento-cell--stat-arb">
    <span className="bento-stat-label">Formal review</span>
    <strong className="bento-stat-value bento-stat-value--accent">ARB</strong>
    <Link href="/arb" className="bento-stat-link">Open ARB workspace →</Link>
  </article>
</section>
```

**New: Feature grid** (replaces proof cards, 3 cards + 1 wide ARB card):
```tsx
<section className="feature-grid-section">
  {/* 3 feature cards */}
  <article className="feature-card surface-panel">...</article>
  {/* Wide ARB teaser — col-span 2 */}
  <article className="feature-card feature-card--wide surface-panel arb-teaser">
    <h2>ARB-grade review mode</h2>
    <p>Evidence-first intake, weighted scorecard, human sign-off.</p>
    <div className="arb-flow-steps">...</div>
    <Link href="/arb" className="primary-button">Open ARB workspace</Link>
  </article>
</section>
```

**New CSS (`globals.css`):**
```css
.bento-hero {
  display: grid;
  grid-template-columns: 1.4fr 1.1fr repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 14px; margin-bottom: 20px;
}
.bento-cell { padding: 24px; border-radius: var(--r-lg); border: 1px solid var(--border); background: var(--surf-1); }
.bento-cell--headline { grid-column: 1; grid-row: 1/3; display: grid; gap: 18px; align-content: start; }
.bento-cell--preview  { grid-column: 2; grid-row: 1/3; }
.bento-cell--stat     { grid-column: span 1; display: grid; gap: 8px; align-content: end; }
.bento-headline {
  font-family: var(--font-display);
  font-size: clamp(2.1rem, 3.4vw, 3.2rem);
  line-height: 1.0; letter-spacing: -0.04em;
}
.bento-headline em { font-style: normal; color: var(--brand); }
.bento-stat-value { font-family: var(--font-display); font-size: 2.2rem; letter-spacing: -0.04em; }
.feature-grid-section { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
.feature-card { padding: 28px; border-radius: var(--r-lg); }
.feature-card--wide { grid-column: 4/6; }
```

**Lines changed in dashboard-home.tsx:** ~344 → ~490 (+146)  
**New CSS lines:** ~180

---

### Phase 4 — Inner Pages
**Files:** `src/components/services-directory.tsx`, `src/components/trust-banner.tsx`,  
`app/how-to-use/page.tsx`, `app/arb/page.tsx`

#### services-directory.tsx
- Add icon box per service row (first letter abbreviation, colour-coded)
- Add `<SeverityBadge>` for `highSeverityCount` per service
- Add `aria-role="searchbox"` + `useEffect` for `Meta+K` focus
- Rename filter buttons to `filter-chip` / `filter-chip--active` classes

#### trust-banner.tsx
- Remove `<details>` collapse — make trust signals always visible
- Add `<ul className="trust-checklist">` with SVG check icons per item
- Keep `trust-banner::before` gradient accent line

#### app/how-to-use/page.tsx
- Wrap workflow cards in `<div className="how-timeline">` 
- Add `<div className="timeline-step-number">01</div>` circle to each step
- CSS: connected horizontal line via `::before` pseudo-element

#### app/arb/page.tsx
- Wrap metrics in `<div className="arb-flow-band">`
- Add arrow connectors between steps via CSS `::after`

**Lines changed total:** ~100

---

### Phase 5 — New Shared Components

#### `src/components/severity-badge.tsx` (NEW)
```tsx
export function SeverityBadge({ severity, compact = false }: {
  severity?: "High" | "Medium" | "Low"; compact?: boolean;
}) {
  const tone = (severity ?? "none").toLowerCase();
  return (
    <span className={`sev-badge sev-badge--${tone}${compact ? " sev-badge--compact" : ""}`}
          aria-label={`Severity: ${severity ?? "unspecified"}`}>
      {severity ?? "—"}
    </span>
  );
}
```
CSS: `sev-badge--high`, `sev-badge--medium`, `sev-badge--low` with `border-left`, `background`, `color` from severity tokens.

#### `src/components/sparkline.tsx` (NEW)
Pure SVG sparkline. Takes `values: number[]`, normalises to viewBox, renders `<polyline>`.  
No third-party dependencies. ~35 lines.

#### `src/components/command-bar.tsx` (NEW)
`"use client"` component. Listens for `⌘K`/`Ctrl+K`, shows modal overlay with search input placeholder. ~40 lines. Full search wired in a future sprint.

**New files:** 3 component files (~105 lines total)  
**New CSS:** ~90 lines (badge, sparkline, command overlay)

---

### Phase 6 — SEO + Metadata

#### `app/layout.tsx`
Add full OG/Twitter metadata:
```typescript
openGraph: {
  type: "website", siteName: SITE_NAME, title: SITE_NAME,
  description: SITE_DESCRIPTION,
  images: [{ url: "/og-image.png", width: 1200, height: 630 }]
},
twitter: { card: "summary_large_image", images: ["/og-image.png"] },
robots: { index: true, follow: true },
metadataBase: new URL("https://azure-review.azurestaticapps.net")
```

#### `public/robots.txt` (NEW)
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /.auth/
Sitemap: https://azure-review.azurestaticapps.net/sitemap.xml
```

#### `public/sitemap.xml` (NEW)
Static sitemap covering 7 primary routes. Individual service/technology slugs excluded (add build-time generator later if SEO on service pages becomes a priority).

#### `public/og-image.png` (NEW)
1200×630 branded static PNG. Can be designed in Figma or generated with a simple Node script using `@vercel/og` or `sharp`.

---

## 5. Implementation Sequence & Dependencies

```
Phase 1 (CSS tokens)
    ↓
Phase 5 (new components — SeverityBadge, Sparkline, CommandBar)
    ↓
Phase 2 (Layout shell — ThemeProvider rewrite)
    ↓
Phase 3 (Homepage bento — imports new components)
    ↓
Phase 4 (Inner pages — parallel, no dependencies on Phase 3)
    ↓
Phase 6 (SEO — fully independent, can be done anytime)
```

**Critical rule:** Phase 1 must land first. All other phases consume the new design tokens — doing CSS before JSX makes the visual change atomic and reviewable in one PR.

---

## 6. File Change Summary

| Phase | File | Change type | Est. lines |
|---|---|---|---|
| 1 | `app/globals.css` | Modify (tokens + body) | ~155 replaced + ~30 net new |
| 2 | `src/components/theme-provider.tsx` | Modify | +68 (265 total) |
| 2 | `app/globals.css` | Modify (topbar, footer CSS) | +120 |
| 3 | `src/components/dashboard-home.tsx` | Modify | +146 (490 total) |
| 3 | `app/globals.css` | Modify (bento, feature grid) | +180 |
| 4 | `src/components/services-directory.tsx` | Modify | ~40 |
| 4 | `src/components/trust-banner.tsx` | Modify | ~20 |
| 4 | `app/how-to-use/page.tsx` | Modify | ~25 |
| 4 | `app/arb/page.tsx` | Modify | ~15 |
| 4 | `app/globals.css` | Modify (inner pages) | +60 |
| 5 | `src/components/severity-badge.tsx` | **New** | 30 |
| 5 | `src/components/sparkline.tsx` | **New** | 35 |
| 5 | `src/components/command-bar.tsx` | **New** | 40 |
| 5 | `app/globals.css` | Modify (badge, cmd CSS) | +90 |
| 6 | `app/layout.tsx` | Modify | +24 (38 total) |
| 6 | `public/robots.txt` | **New** | 4 |
| 6 | `public/sitemap.xml` | **New** | 16 |
| 6 | `public/og-image.png` | **New** | — |

**Total:** `globals.css` grows from ~3,600 to ~4,200 lines (+525 net). Three new component files (~105 lines). Two new public files. ~320 lines changed across existing components.

---

## 7. Responsive Breakpoints

```css
@media (max-width: 1100px) {
  .bento-hero { grid-template-columns: 1fr 1fr; }
  .bento-cell--headline, .bento-cell--preview { grid-column: span 1; grid-row: auto; }
  .bento-cell--stat { grid-column: span 1; }
  .feature-grid-section { grid-template-columns: repeat(3, 1fr); }
  .feature-card--wide { grid-column: span 3; }
  .site-footer-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 720px) {
  .bento-hero { grid-template-columns: 1fr; }
  .topbar-cmd { display: none; }
  .topbar-nav { display: none; } /* mobile nav TBD */
  .site-footer-grid { grid-template-columns: 1fr; }
  .feature-grid-section { grid-template-columns: 1fr; }
  .feature-card--wide { grid-column: 1; }
}
```

---

## 8. What Does NOT Change

- Azure Functions API code — no changes needed
- CI/CD GitHub Actions workflows — no changes needed
- `src/types.ts` — no changes needed
- `src/lib/*.ts` — no changes needed
- `tools/generate-data.mjs` — no changes needed
- `next.config.js` — no changes needed
- `staticwebapp.config.json` — no changes needed

The entire refactor is frontend-only: CSS + TSX components. The CI/CD pipeline will automatically pick up changes on push to `main` and deploy the new static export.

---

## 9. PR Strategy

Recommended: 6 PRs, one per phase, reviewed in order.

| PR | Phase | Branch name | Reviewable in isolation? |
|---|---|---|---|
| PR-1 | Design tokens | `feat/dark-tokens` | Yes — visual only |
| PR-2 | New components | `feat/severity-sparkline-cmd` | Yes — pure additions |
| PR-3 | Layout shell | `feat/topbar-footer` | Yes — depends on PR-1 |
| PR-4 | Homepage bento | `feat/bento-hero` | Yes — depends on PR-1, PR-2 |
| PR-5 | Inner pages | `feat/inner-page-polish` | Yes — independent |
| PR-6 | SEO metadata | `feat/seo-meta` | Yes — fully independent |

---

*Plan authored by: Azure Review Assistant expert panel (Architecture + Cloud + UI/UX + Full Stack)*  
*Mockup file: `ui-mockup.html` at repo root*
