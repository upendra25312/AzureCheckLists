# Azure Review Assistant — Expert Team Audit Findings
**Date:** 13 April 2026
**Auditors:** Cloud Architects · AI Architects · Senior Cloud Engineers · Pre-Sales · Full-Stack

---

## P0 — CRITICAL (Fix immediately — breaks trust/professionalism)

### 1. Raw internal category names leaking into Service Explorer UI
Filters visible to every visitor:
- `Bc_Dr` — raw enum value, should be "BC and DR"
- `Cluster_Multi` — should be "Multi-Cluster"
- `Cluster_Security` — should be "Cluster Security"
- `Resource_Management` — should be "Resource Management"

These are internal checklist taxonomy names that were never normalised for display. A customer seeing `Bc_Dr` during a pre-sales demo will lose confidence immediately.

### 2. Typo in filter label
`"Protection against accidential deletion"` — **"accidential" → "accidental"**. Visible to every user on the Services page.

### 3. Duplicate/conflicting filter categories (same concept, multiple names)

| Duplicates found | Problem |
|---|---|
| "BC and DR" + "Bc_Dr" + "BCDR" | 3 filters for the same domain |
| "Network security" + "Network Security" | Case-only duplicate |
| "Operations management" + "Operations Management" | Case-only duplicate |
| "Platform automation and DevOps" + "Platform Automation and DevOps" | Case-only duplicate |
| "Identity and Access" + "Identity and Access Management" | Semantic duplicate |

Result: 50+ category chips where 30 would suffice, visually overwhelming.

---

## P1 — HIGH (Fix before next customer demo)

### 4. ARB landing page (/arb) is almost empty
The page that is linked from every homepage CTA shows: two sign-in buttons, 4 bullet points, a footer. Nothing else. There is a large blank void below the bullets. A first-time user — a Cloud Director or pre-sales architect seeing this — has no idea what the review output looks like, what "ARB Grade" means, or why it's better than a spreadsheet.

**Fix needed:** Add a preview section — same "what you get" layout that's on the homepage, or at minimum show an example scorecard/finding card.

### 5. Personal test data visible on AKS service page
`PROJECT REVIEW: Not added — Current review: Upendra first test.`

This is rendered live on the public-facing page at `/services/azure-kubernetes-service-aks`. Customer-facing pages should not show reviewer names or internal test labels.

### 6. Two primary CTAs on /arb are equally styled
"Sign in with Microsoft to start →" and "Sign in with GitHub to start →" are both identical full-width blue primary buttons stacked vertically. Microsoft is the primary enterprise path — it should be visually dominant (primary button), GitHub should be secondary/outlined.

### 7. Homepage demo scorecard inconsistency
The "What you get" demo section shows `6 of 9 frameworks complete · 78% coverage`, but the ARB mode card directly above says `checks every page against 11 Microsoft frameworks`. The numbers contradict each other — either 9 or 11. Pick one and be consistent.

---

## P2 — MEDIUM (Fix in next sprint)

### 8. Service Explorer filter bar is overwhelming
50+ category chips in an unordered wall with no grouping. No user can scan this efficiently. Needs grouping by domain: *Security, Networking, Identity, HA/DR, Governance, Monitoring, Storage* etc., or at minimum a text search within categories.

### 9. "Performant" is not a word
Category filter `Performant` should be `Performance`. This appears in both filter chips and WAF pillar labels on the AKS detail page (`WAF: Cost, Operational Excellence, Operations, Performance`). "Operations" is also not a standard WAF pillar — it should be "Operational Excellence".

### 10. Homepage step 4 is jargon-heavy and inconsistently labelled
Step 4: `"Architecture Assurance Assessment"` — this is the internal ARB name but it means nothing to a first-time visitor. The description `"AI-driven validation across WAF, CAF, ALZ, HA/DR, Security + more"` is good but the step title needs simplification: `"Run AI analysis"` or `"AI checks 11 frameworks"`.

### 11. Category "Personalized" is unexplained
One of the 50+ filter chips is `Personalized` with no tooltip or explanation. It's unclear what findings this category covers.

### 12. Footer has no useful links
The footer is a single tagline: `"Azure Review Assistant — architecture reviews that ship, not stall."` There is no GitHub link, no privacy/terms, no docs, no contact path. For an enterprise-facing tool used by architects and pre-sales, this looks unfinished.

---

## P3 — LOW (Backlog)

### 13. Brand logo is a plain "P" in a blue square
No relationship to Azure, architecture, or reviews. At minimum use an Azure-adjacent icon (hex grid, blueprint, checkmark). The "P" is confusing — it looks like "PowerPoint" or a placeholder.

### 14. "Checking sign-in status…" spinner on first load
Homepage shows a loading spinner briefly before rendering the drop zone. The shimmer skeleton added recently only covers the ARB review steps. The homepage hero drop-zone should also get a skeleton treatment to prevent layout shift on first load.

### 15. AKS category strip shows raw names
On `/services/azure-kubernetes-service-aks`, the categories row shows: `"Application, Application Deployment, BC and DR, Bc_Dr"` — the raw `Bc_Dr` bleeds through here too, same root cause as P0 item 1.

### 16. No `og:image` fallback for service pages
The homepage has a proper OG image at `/og-image.svg`. Service pages (`/services/azure-kubernetes-service-aks`) have no per-service OG image — they'll render a blank preview when shared on Teams/Slack/LinkedIn.

---

## Summary Table

| # | Issue | Page | Severity | Effort |
|---|-------|------|----------|--------|
| 1 | Raw category names (`Bc_Dr`, `Cluster_Multi`, etc.) | /services | P0 | Small |
| 2 | Typo "accidential" | /services | P0 | Trivial |
| 3 | Duplicate filter categories (50+ → ~30) | /services | P0 | Medium |
| 4 | ARB landing is empty — no preview | /arb | P1 | Medium |
| 5 | Test data visible ("Upendra first test.") | /services/aks | P1 | Small |
| 6 | Two equal-weight primary buttons | /arb | P1 | Trivial |
| 7 | 9 vs 11 frameworks inconsistency | homepage | P1 | Trivial |
| 8 | Filter bar overwhelming, no grouping | /services | P2 | Medium |
| 9 | "Performant" / "Operations" wrong WAF terms | /services | P2 | Small |
| 10 | Step 4 jargon title | homepage | P2 | Trivial |
| 11 | Footer has no links | all | P2 | Small |
| 12 | "P" logo placeholder | all | P3 | Medium |
| 13 | Raw `Bc_Dr` in AKS category strip | /services/aks | P3 | Same as #1 |
| 14 | Homepage hero spinner — no skeleton | homepage | P3 | Small |
| 15 | No OG image for service pages | /services/* | P3 | Small |
