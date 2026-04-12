# Azure Review Assistant — UI/UX Redesign Plan

**Status:** ✅ Phases 1–5 complete · Phase 6 validated  
**Date:** 2026-04-11  
**Implemented:** 2026-04-11  
**Team context:** Senior PM · Senior Architect · Senior Director · Senior Cloud Engineer · Senior Pre-Sales Architect

---

## Objective

Rebuild the website so it immediately communicates its two hero features, removes all noise, and delivers a clean, action-first experience at Google/Microsoft/AWS quality standard.

---

## Two Hero Features (North Star for every decision)

1. **AI ARB Review** — Upload your design doc → AI checks WAF + CAF + ALZ + HA/DR + Security + Networking + Monitoring → board-ready scorecard + findings + export in minutes
2. **Service Scoping** — Pick your Azure service stack → instant WAF findings, regional fit, pricing — no sign-in required

Every page, every button, every headline must serve one of these two features.

---

## Purpose, USP and Value Proposition

### Purpose
Replace the 2–3 day manual Azure architecture review process with an AI-powered workflow that delivers board-ready findings in minutes.

### Who Uses It

| User | Why |
|------|-----|
| Azure Architects | Structured WAF/CAF/ALZ review in minutes, not days |
| ARB Members | Upload SOW/design docs → AI reviews → scorecard + findings ready for the board |
| Pre-Sales Architects | Quick scoping before committing to a full design |
| Cloud Engineers | Self-service checklist before presenting to leadership |
| Directors / Senior Leadership | Executive summary + Approved/Needs Revision recommendation without reading 100-page docs |

### USP

- AI reviews your **actual documents** — not generic checklists, real gaps from your specific design
- Covers **ALL Microsoft frameworks in one pass** — WAF (5 pillars) + CAF (6 phases) + ALZ + HA/DR + Backup + Security + Networking + Identity + Monitoring + Resiliency
- **Grounded in live Microsoft Learn docs** — MCP server fetches current best practices at review time
- **Two review modes** — quick scoping (standard) and full ARB-grade (doc evidence + weighted scorecard + human sign-off)
- **Traceable findings** — every finding references a specific framework principle and a `learn.microsoft.com` URL

### Value Delivered

| Without It | With It |
|------------|---------|
| ARB review takes 2–3 days of manual work | Agent review completes in minutes |
| Findings live in emails and spreadsheets | Everything in one place, exportable as CSV / HTML / Markdown |
| Reviewer may miss ALZ or HA/DR checks | All 11 framework areas checked every single time |
| Output needs reformatting for different audiences | Export as executive summary, action list, or full ARB pack |

---

## What Is Wrong Today (Root Cause)

| Problem | Root Cause |
|---------|------------|
| Text walls everywhere | Product explaining itself instead of letting users do the thing |
| Dark muddy palette (#060d14 background) | Low contrast, feels unfinished, not professional |
| 10+ nav items | No information hierarchy — everything has equal weight |
| Hero feature buried 3 clicks deep | ARB create form is below a 4-card marketing section |
| "Trust banner", "Decision Center", "Data Health" | Internal jargon — means nothing to a first-time user |
| Cyan + orange on dark background | No visual breathing room — noisy and distracting |

---

## Design Principles (Non-Negotiable)

1. **White/light background** — `#FFFFFF` page, `#F5F7FA` sections. No dark default.
2. **Azure Blue as the only accent** — `#0078D4` (Microsoft standard). One accent, used sparingly.
3. **Action first** — Every page opens with what the user can DO, not what the product IS.
4. **One primary CTA per screen** — Never two equal-weight buttons competing.
5. **Whitespace is content** — Generous padding, clean grid, nothing crowded.
6. **Typography hierarchy** — 3 levels max: headline → body → label. No walls of same-size text.

---

## Redesign Plan — 6 Phases

---

### Phase 1: Design System Reset

**Goal:** Replace dark muddy tokens with a clean professional palette.

| # | Task | Detail | Validation |
|---|------|--------|------------|
| 1.1 | Replace CSS color tokens | `--page-bg: #FFFFFF`, `--surf-1: #F5F7FA`, `--surf-2: #EEF2F6`, `--brand: #0078D4`, `--t1: #111827`, `--t2: #4B5563`, `--border: #E5E7EB` | All pages render with no dark background |
| 1.2 | Simplify border-radius | `--radius: 8px` everywhere. Remove 28px "xl" radius — too rounded, looks toy-like | Consistent corners across all cards |
| 1.3 | Clean up status colors | `--high: #D92B2B`, `--med: #B45309`, `--low: #15803D` (AA contrast on white) | Findings badges readable |
| 1.4 | Font | System font stack: `Segoe UI, Inter, -apple-system`. Remove display font | Text renders cleanly on all OS |

---

### Phase 2: Navigation Redesign

**Goal:** 3 items max. Purpose-driven labels. No jargon.

**Current nav (10 items):** Dashboard · Reviews · Services · ARB Review · Docs · Decision Center · Data Health · How to Use · Explorer · Admin

**New nav (3 items):**
```
[Azure Review Assistant logo]     AI Review     Service Explorer     [Sign In / Avatar]
```

| # | Task | Detail | Validation |
|---|------|--------|------------|
| 2.1 | Build new top navbar | Logo left, 3 nav links centre-right, Sign In button far right | Renders on all pages |
| 2.2 | "AI Review" → `/arb` | The ARB create flow — the hero feature | Click lands on create-review form immediately |
| 2.3 | "Service Explorer" → `/services` | Browse services and get scoped findings | Click lands on search-first explorer |
| 2.4 | Remove all other nav items | Dashboard, Decision Center, Data Health, How to Use, Explorer, Admin removed from primary nav | No orphaned links visible |
| 2.5 | Decision Center inside review workflow | Move to a tab inside ARB review, not global nav | Existing users not broken |

---

### Phase 3: Homepage Redesign

**Goal:** A first-time user understands the product and can start in 5 seconds.

**New homepage structure:**
```
[HERO]
  Headline:   "Get an AI architecture review in minutes, not days"
  Subline:    "Upload your design doc. The AI checks it against WAF, CAF, ALZ, HA/DR,
               Security, Networking and Monitoring — and hands you a board-ready pack."
  CTA 1:      [Start AI Review →]      ← primary, Azure blue
  CTA 2:      [Explore Services]       ← ghost button

[HOW IT WORKS — 3 steps with icons, one line each]
  1. Upload your SOW or design document
  2. AI checks against 11 Azure best-practice frameworks
  3. Download findings, scorecard, and board pack

[TWO PATHS — 2 cards side by side]
  Card A: AI Review (ARB)           Card B: Service Scoping
  "Upload docs, get scored"         "Pick services, get findings"
  [Start review →]                  [Open explorer →]

[FRAMEWORK COVERAGE STRIP]
  WAF · CAF · ALZ · HA/DR · Backup · Security · Networking · Identity · Monitoring · Resiliency
```

| # | Task | Detail | Validation |
|---|------|--------|------------|
| 3.1 | Write new hero section | Single headline, one subline (2 sentences max), 2 CTAs | New user understands product in 5 seconds |
| 3.2 | Write "How it works" | 3 steps with icons, one line each | No paragraph text anywhere above the fold |
| 3.3 | Write "Two paths" cards | ARB Review card + Service Scoping card side by side | Both CTAs go directly to the action |
| 3.4 | Framework coverage strip | Tag-style strip: WAF · CAF · ALZ · HA/DR etc. | Communicates breadth without text blocks |
| 3.5 | Remove all existing homepage content | No metrics, no data health status, no trust banner, no review initializer | Clean render — no legacy noise |

---

### Phase 4: ARB Review Flow Redesign

**Goal:** User lands → sees create-review form immediately → uploads doc → runs AI review → sees results. Zero friction.

**New ARB page (`/arb`) structure:**
```
[PAGE HEADER — 2 lines only]
  Title:     "AI Architecture Review"
  Subtitle:  "Upload your design documents and get findings checked against all Azure frameworks."

[CREATE REVIEW FORM — full width card, above fold]
  Project name input
  Customer / organisation input
  [Create review and upload documents →]   ← single primary CTA

[EXISTING REVIEWS — below fold, clean table]
  Project | Customer | Status | Score | Date | [Open]
```

| # | Task | Detail | Validation |
|---|------|--------|------------|
| 4.1 | Remove marketing section from ARB page | Delete 4-card info section from top of `/arb` | Create form is visible without scrolling |
| 4.2 | Redesign create-review card | Clean white card, 2 inputs, 1 button, no sidecar | Form is the first thing seen on page load |
| 4.3 | Redesign signed-out state | Headline + 5-bullet "what you get" list + "Sign in with Microsoft" button | Clear value + single CTA |
| 4.4 | Review list as table | Replace card grid with clean table: project · customer · status · score · date · action | Scans faster, less visual noise |
| 4.5 | Upload page | Large drag-and-drop zone, accepted file types listed clearly, "Upload & extract" button prominent | User can upload without reading instructions |
| 4.6 | Agent review trigger | After extraction: one large "Run AI Review" button with loading state | No confusion about next step |
| 4.7 | Findings page | Clean table: severity badge · title · framework · recommendation · link | Scannable, not a wall of cards |
| 4.8 | Scorecard | Horizontal bar per dimension (0–100), overall score large at top | Visual, not text-heavy |

---

### Phase 5: Service Explorer Redesign

**Goal:** Find any Azure service and get findings in under 10 seconds.

**New explorer (`/services`) structure:**
```
[SEARCH BAR — full width, prominent]
  "Search 100+ Azure services..."

[FILTER ROW]
  All  |  Compute  |  Storage  |  Networking  |  Security  |  Data  |  AI

[SERVICE GRID — 3 columns]
  [Icon]  Service name
          WAF pillar tag
          [View findings →]
```

| # | Task | Detail | Validation |
|---|------|--------|------------|
| 5.1 | Search bar as hero element | Full-width search bar, placeholder text "Search 100+ Azure services..." | First interaction is search, not scrolling |
| 5.2 | Clean filter pills | One row, no nested filters | All categories visible at once |
| 5.3 | Clean service cards | Icon + name + one WAF tag + link. No pricing/maturity/region flags on card face | Cards scannable at a glance |
| 5.4 | Service detail page | Service name + description + findings table + export button | Action-focused, not reference-heavy |

---

### Phase 6: Test and Validate

**Goal:** Every core user journey works end-to-end without confusion.

| Journey | Success Criteria |
|---------|----------------|
| New user, not signed in, lands on homepage | Understands product in 5 seconds. Clicks "Start AI Review". Sees sign-in prompt with clear value statement. Signs in. Lands on create-review form. |
| Signed-in user creates a review | Fills project name + customer name → clicks button → lands on upload page immediately |
| User uploads a document | Drags file → upload progress → "Run AI Review" button → loading state → findings appear |
| User reads findings | Sees severity, framework, recommendation, and Microsoft Learn link for each finding |
| User exports | Clicks "Export" → chooses format → file downloads |
| User explores services | Types service name → clicks service → sees findings → exports |

---

## What Will NOT Change

- All backend API routes (no regression risk)
- ARB review workflow steps (upload → extract → findings → scorecard → decision)
- Authentication flow (Microsoft sign-in via Azure Static Web Apps)
- Data stored in Azure Table Storage and Blob Storage

---

## Delivery Sequence

```
Phase 1 — Design System   (~1 hr)
Phase 2 — Navigation      (~30 min)
Phase 3 — Homepage        (~1 hr)
Phase 4 — ARB Flow        (~2 hr)
Phase 5 — Service Explorer (~1 hr)
Phase 6 — Validate        (~30 min)
```

**Total estimated implementation time: ~6 hours**

---

## Definition of Done

- [x] Homepage hero communicates product purpose in one headline + two sentences
- [x] "Start AI Review" CTA visible above the fold on homepage
- [x] Signing in takes the user directly to the create-review form
- [x] Create-review form is the first visible element on `/arb`
- [ ] Upload page has a clear drag-and-drop zone *(unchanged — existing drag-and-drop upload page retained)*
- [ ] "Run AI Review" is the only prominent action after extraction completes *(existing flow retained)*
- [ ] Findings rendered as a scannable table with severity, framework, recommendation, link *(existing findings page retained)*
- [ ] Scorecard rendered as a visual bar chart *(existing scorecard page retained)*
- [x] Service explorer opens with a search bar
- [x] Navigation has exactly 3 items: AI Review · Service Explorer · Sign In
- [x] No dark background on any page
- [x] No wall-of-text sections anywhere
- [ ] All exports (CSV / HTML / Markdown) produce downloadable files *(backend unchanged — not in scope)*
- [x] All pages pass basic mobile responsiveness check
