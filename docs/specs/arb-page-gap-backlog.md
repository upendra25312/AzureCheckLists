# ARB Page Gap Backlog

Last updated: April 10, 2026

## Objective

Translate the live-site gap analysis into a page-owned redesign backlog for the product transition from the current Azure review support tool into the target `Knowledge Hub + Review Workspace + Decision Center` Architecture Review Board experience.

## Why This Backlog Exists

The current live product and the target ARB product are not separated by styling only.

The live site is still:

- checklist-driven
- service-scoped
- pricing-aware
- review-preparation only

The target product is:

- evidence-driven
- upload-first
- findings-first
- decision-aware
- ARB-assisted

That means the open work is primarily a product transition across information architecture, workflow model, page ownership, and governance boundaries.

## Relationship To Existing Trackers

- Use [architecture-review-board-ai-task-list.md](./architecture-review-board-ai-task-list.md) as the capability-level master plan.
- Use this backlog as the page-by-page delivery view that turns the capability plan into route and screen work.
- Do not reopen [ui-redesign-backlog.md](./ui-redesign-backlog.md) for this work. That backlog covered the current review-board theme rollout, not the ARB product pivot.

## Product Boundary Gate

Before implementation starts in earnest, confirm these MVP decisions:

1. `Decision Center` is now an intentional product surface.
   The live product currently says it is not an approval engine. That message must change only when the new approval boundary is formally accepted.

2. AI remains assistive and human approval remains final.
   AI can recommend, summarize, score, and flag missing evidence. Human reviewers own final decision and sign-off.

3. `Knowledge Hub` and `Review Workspace` are separate jobs.
   The home page and nav should route users by job, not by current internal module layout.

4. Upload-first ARB review is the new default workflow.
   Service scoping can remain as a supporting mode, but not as the primary review entry point.

## Delivery Waves

### Wave 0: Product Boundary And IA Lock

- lock MVP terminology and approval boundary
- finalize global nav model
- confirm route ownership for `Knowledge Hub`, `Review Workspace`, `Decision Center`, and `My Reviews`
- freeze homepage entry-path strategy before page implementation

### Wave 1: Core Product Pivot

- Home
- Global navigation
- Review Workspace entry
- Upload
- Requirements extraction
- Evidence mapping
- Findings
- Scorecard
- Decision Center

### Wave 2: Discovery And Queue Surfaces

- Knowledge Hub landing
- Service detail page
- My Reviews
- Data Health

### Wave 3: Role And Collaboration Layers

- Admin
- role-based UX expansion
- collaboration and reviewer workflow depth
- advanced comparison and audit tooling

## Page Backlog

| ID | Page | Current state | User story | Change needed | Effort | Impact | MVP wave | Priority | Validation target |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARB-01 | Home | Dashboard-first review launcher centered on `Start a Structured Azure Review` | As a first-time user, I want to choose `Knowledge Hub` or `Start Review` immediately so I can begin the right job without scanning mixed tools | Rebuild home into two entry paths, add quick actions, resume-review module, and compact platform-status strip; reduce above-the-fold scope to job-first actions | M | High | Wave 1 | P1 | First-click test proves users choose the correct entry path without scrolling |
| ARB-02 | Global navigation | Module-first nav with `Initialize Review`, `Project Review`, `Advanced Tools`, and similar internal labels | As a user, I want navigation that matches my job so I can understand the product model from the nav alone | Replace nav with `Home`, `Knowledge Hub`, `Review Workspace`, `Decision Center`, `My Reviews`, `Data Health`, and `Admin`; remove legacy module framing | S | High | Wave 1 | P1 | Every top-level route aligns to a single user job and no legacy module labels remain |
| ARB-03 | Knowledge Hub landing | Service catalog framed as checklist family discovery | As an architect exploring Azure guidance, I want a neutral knowledge hub with search, category filters, and freshness signals | Reframe `/services` into a knowledge-discovery page with search, category chips, region filter, pricing quick filter, popular services, and recently updated guidance | M | High | Wave 2 | P1 | Users can discover service guidance without entering the review workflow |
| ARB-04 | Service detail page | Mixed service, checklist, findings, regional fit, and pricing surface | As a reviewer, I want a service detail hub with clear tabs so I can separate learning, evidence, and review actions | Redesign service detail into tabs: `Overview`, `Best Practices`, `Region Availability`, `Pricing`, `Reference Architectures`, and `Review Checks`; preserve cross-linking to review workflow | L | High | Wave 2 | P1 | Tabbed content keeps information readable and action placement deliberate on desktop and mobile |
| ARB-05 | Review Workspace entry | Scope-first staged review setup | As an architect starting an ARB review, I want an upload-first guided workflow so the system can assess real project evidence | Replace service-scope-first entry with wizard shell: `Upload files`, `Extract requirements`, `Map evidence`, `Review findings`, `Score and decide`, `Export package` | L | High | Wave 1 | P0 | Review creation no longer depends on choosing Azure services before evidence exists |
| ARB-06 | Upload | Missing as a true page; current flow starts with review shell creation | As an architect, I want drag-and-drop upload with status, file list, and extraction preview so I know when the review is ready to proceed | Build upload page with drag-and-drop, accepted file badges, per-file status, extraction preview panel, confidentiality note, and readiness gate | L | High | Wave 1 | P0 | Supported files can be uploaded, reviewed, removed, and gated before extraction begins |
| ARB-07 | Requirements extraction | Missing | As a reviewer, I want extracted requirements in a structured table so I can confirm what the system inferred from the source documents | Add requirements review screen with columns for requirement, source section, category, criticality, confidence, and confirmation state | M | High | Wave 1 | P0 | Extracted requirements can be confirmed, edited, or flagged before findings generation |
| ARB-08 | Evidence mapping | Missing | As a reviewer, I want to compare requirements against design evidence side by side so gaps are obvious before scoring | Build split layout with requirements list, evidence pane, and source excerpt drawer; support missing-evidence and weak-evidence states | L | High | Wave 1 | P0 | A reviewer can see every requirement mapped, partially mapped, or unmapped with traceable evidence |
| ARB-09 | Findings | Findings exist but are not the operational center | As a reviewer, I want a findings-first workspace with blockers, missing evidence, owners, and status so I can act instead of reading a narrative dump | Make findings the main operational screen with score banner, recommendation, blocker summary, missing-evidence list, status table, right-side sticky rail, and reviewer workflow cues | L | High | Wave 1 | P0 | Findings become the primary working surface for triage and follow-up |
| ARB-10 | Scorecard | Missing as a dedicated ARB screen | As a reviewer or decision owner, I want an explainable weighted scorecard so I can understand the score before approval or rejection | Build weighted score table first, chart second; add decision banner with `Approved`, `Approved with Conditions`, `Needs Improvement`, and `Insufficient Evidence` | M | High | Wave 1 | P0 | Every score row drills through to evidence, findings, and grounded guidance |
| ARB-11 | Decision Center | Absent by design in current product | As a decision owner, I want AI recommendation, reviewer recommendation, final decision, rationale, conditions, and sign-off history in one place | Introduce Decision Center route with decision summary, rationale log, decision owner, conditions, must-fix list, and sign-off history; clearly separate AI recommendation from human decision | L | High | Wave 1 | P0 | Decision workflow is explicit, auditable, and clearly human-owned |
| ARB-12 | My Reviews | Saved-review resume board optimized around storage state | As a reviewer or PM, I want a work queue with status, score, blockers, reviewer, and next milestone so I can manage active reviews | Reframe saved reviews into workflow queue with columns for project, review type, score, status, reviewer, blockers, and next milestone while preserving resume/archive/delete behaviors | M | Medium | Wave 2 | P1 | Users can manage active review work instead of browsing saved-review records only |
| ARB-13 | Data Health | Commercial-data freshness and backend-health page | As a user, I want to trust the ARB outputs by seeing freshness and health across extraction, guidance, pricing, region data, and review engine state | Expand Data Health into whole-platform trust view: content freshness, region freshness, pricing freshness, search index freshness, extraction health, fallback mode, and review engine status | M | Medium | Wave 2 | P2 | The page explains whether the platform is fresh enough for trustworthy review output |
| ARB-14 | How to Use / framing | Explicitly says the product is not an approval engine and is a decision-support surface only | As a user, I want product framing that matches the actual workflow so expectations are not set by outdated positioning | Rewrite framing around `Knowledge Hub`, `Review Workspace`, and `Decision Center` once those routes are real; retain the human-sign-off boundary | S | Medium | Wave 2 | P2 | Product framing matches the shipped surface and no stale review-preparation-only language remains |
| ARB-15 | Admin | Existing protected admin shell is operational but still platform-diagnostics-first | As an admin, I want controls and diagnostics that support the ARB workflow lifecycle, not just the current commercial-data backend | Extend admin around ARB-specific operations: extraction health, scoring pack version, grounded reference pack state, review audit trace, and rule/admin controls | M | Medium | Wave 3 | P2 | Admin tools expose ARB runtime readiness and governed operational controls |

## Recommended Build Order

1. Lock the product boundary and global navigation model.
2. Build the new `Review Workspace` entry shell and `Upload` page.
3. Add `Requirements extraction` and `Evidence mapping`.
4. Make `Findings` the operational center.
5. Add `Scorecard` and `Decision Center`.
6. Rework `Home` so it points to the new jobs.
7. Reframe `Knowledge Hub`, `Service detail`, and `My Reviews`.
8. Expand `Data Health`, `How to Use`, and `Admin`.

## Acceptance Rules Across All Page Work

- Do not hide the human-sign-off boundary. The product may become decision-aware, but final approval must remain explicit and human-owned.
- Keep source traceability visible across upload, extraction, evidence mapping, findings, scorecard, and decision pages.
- Avoid mixing discovery and review jobs on the same screen unless the user explicitly entered a guided review flow.
- Reuse the shipped board visual system where possible, but let workflow ownership drive layout decisions.
- Every page change must include desktop and mobile validation plus role-aware behavior checks where relevant.

## Immediate Next Step

Convert the highest-risk Wave 1 pages into implementation-ready issues next:

1. `ARB-02 Global navigation`
2. `ARB-05 Review Workspace entry`
3. `ARB-06 Upload`
4. `ARB-09 Findings`
5. `ARB-10 Scorecard`
6. `ARB-11 Decision Center`

## Backlog Status

- State: Active
- Owner: Product / UX / Engineering
- Focus: ARB product transition
- Current stage: planning complete, implementation backlog ready
- Depends on: MVP boundary approval for decision-aware workflow and human sign-off model
