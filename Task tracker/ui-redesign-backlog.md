# UI Redesign Backlog

Last updated: April 10, 2026

## Goal

Turn the homepage and project-review workflow into the clearest path in the product so Azure Review Board beats AI Skills Navigator on task completion, review confidence, and export readiness.

## Outcome Measures

- New users can start a project review from the homepage without needing the explorer first.
- The review workspace makes stage progress obvious and reduces first-pass cognitive load.
- Service details, pricing, and export surfaces appear when needed instead of competing at once.
- The homepage, review workspace, and service pages share a stronger visual hierarchy and more intentional product voice.

## Delivery Approach

### Epic 1: Homepage becomes a decision-oriented entry point

Epic status: Completed

| ID | Priority | Status | Item | Estimate | Dependencies | Definition of done |
| --- | --- | --- | --- | --- | --- | --- |
| UX-01 | P0 | Completed | Rebuild the homepage hero around `Start a project review` as the primary call to action | 2 days | None | Hero has one dominant CTA into `/review-package`, one supporting CTA, clearer message hierarchy, and reduced competing copy |
| UX-02 | P0 | Completed | Reduce homepage sections to a tighter narrative: start, trust, workflow, outputs | 2 days | UX-01 | Homepage removes low-signal repetition, keeps only the sections that help users understand why and how to start |
| UX-03 | P1 | Completed | Replace generic proof blocks with product-specific review outcomes and artifact examples | 1.5 days | UX-01 | Homepage shows real outputs such as scoped checklist export, pricing snapshot, leadership summary, and saved review continuity |
| UX-04 | P1 | Completed | Introduce a shared visual system for hero typography, section spacing, chips, and evidence cards | 2 days | UX-01 | Homepage styles are reusable in review and service pages and reduce the current mixed visual density |
| UX-05 | P2 | Completed | Add a lightweight homepage validation pass for mobile layout and CTA visibility | 1 day | UX-01, UX-02 | Desktop and mobile views preserve CTA order, section rhythm, and readable hierarchy |

### Epic 2: Project review becomes a staged workspace instead of a long page

Epic status: In progress

| ID | Priority | Status | Item | Estimate | Dependencies | Definition of done |
| --- | --- | --- | --- | --- | --- | --- |
| UX-06 | P0 | Completed | Add a sticky progress rail for review stages | 2 days | UX-04 | Users can always see the current stage, completed stages, and what unlocks next |
| UX-07 | P0 | Completed | Convert the workspace into clear stages: setup, service scope, review signals, exports, continuity | 3 days | UX-06 | Sections read as a guided workflow rather than unrelated stacked panels |
| UX-08 | P0 | Pending | Collapse completed stages into concise summaries with reopen controls | 2 days | UX-07 | Users can move forward without losing context and can reopen any finished stage intentionally |
| UX-09 | P1 | Pending | Promote service drawer depth so matrix rows stay compact by default | 2 days | UX-07 | Matrix rows emphasize decision signals and status while assumptions and estimate controls remain drawer-first |
| UX-10 | P1 | Pending | Add explicit empty states and unlock states for pricing, estimate, and export stages | 1.5 days | UX-07 | Users understand why a stage is unavailable and what action unlocks it |
| UX-11 | P2 | Pending | Add stage-level animation and scroll behavior that helps orientation without adding noise | 1 day | UX-06, UX-07 | Stage transitions and sticky navigation feel deliberate and do not hurt usability |

### Epic 3: Exports and outputs become previewable before download

Epic status: Pending

| ID | Priority | Status | Item | Estimate | Dependencies | Definition of done |
| --- | --- | --- | --- | --- | --- | --- |
| UX-12 | P1 | Pending | Add preview cards for checklist, markdown, pricing, and leadership outputs | 2 days | UX-07 | Users can understand what each export contains before downloading it |
| UX-13 | P1 | Pending | Reframe export actions around audience intent instead of file type only | 1.5 days | UX-12 | Export labels explain who the artifact is for and what decision it supports |
| UX-14 | P2 | Pending | Add service comparison and top-risk summary block before export stage | 2 days | UX-07, UX-12 | Reviewers can quickly compare the riskiest or least-ready services before producing handoff material |

### Epic 4: Service pages align visually with the review experience

Epic status: Completed

| ID | Priority | Status | Item | Estimate | Dependencies | Definition of done |
| --- | --- | --- | --- | --- | --- | --- |
| UX-15 | P1 | Completed | Refresh service-page hero, evidence blocks, and CTA hierarchy to match the new homepage system | 2 days | UX-04 | Service pages feel like part of the same product and surface review actions clearly |
| UX-16 | P1 | Completed | Tighten pricing and regional-fit panels with clearer signal grouping and less raw density | 2 days | UX-15 | Users can identify blockers, target-region matches, and pricing posture faster |
| UX-17 | P2 | Completed | Improve technology and service detail pages for mobile spacing and action clarity | 1.5 days | UX-15 | Secondary detail pages do not regress after the primary visual refresh |

## Proposed Sprint Sequence

### Sprint 1

- UX-01 Rebuild homepage hero
- UX-02 Reduce homepage sections
- UX-04 Introduce shared visual system
- UX-06 Add sticky progress rail

### Sprint 2

- UX-07 Convert workspace into stages
- UX-08 Collapse completed stages
- UX-10 Add unlock and empty states
- UX-05 Validate homepage mobile experience

### Sprint 3

- UX-09 Promote service drawer depth
- UX-12 Add export previews
- UX-13 Reframe exports by audience intent
- UX-15 Refresh service-page hierarchy

### Sprint 4

- UX-14 Add comparison and risk summary block
- UX-16 Tighten pricing and regional-fit panels
- UX-17 Improve mobile polish on secondary pages
- UX-11 Add restrained motion and scroll guidance

## Recommended GitHub Issue Breakdown

Create one GitHub issue per backlog item using the ID in the title, for example:

- `UX-01 Homepage hero redesign for project-review-first entry`
- `UX-06 Sticky progress rail for staged review workspace`
- `UX-12 Export previews before download`

Each issue should include:

- the problem statement
- the target screen or component
- acceptance criteria copied from this backlog
- screenshots before and after implementation
- validation notes for desktop and mobile

## Acceptance Rules Across All Items

- Preserve the existing product voice: clear, scoped, and decision-oriented.
- Do not regress current saved-review, copilot, pricing, or availability behavior.
- Prefer progressive disclosure over adding new always-visible panels.
- Keep the explorer available, but secondary to the project-review workflow.
- Validate changed screens on desktop and mobile before closing the backlog item.

## Files Likely To Change First

- `app/page.tsx`
- `src/components/dashboard-home.tsx`
- `src/components/review-package-workbench.tsx`
- `src/components/project-review-service-drawer.tsx`
- `src/components/project-review-copilot.tsx`
- `src/components/service-page-view.tsx`
- `src/components/service-pricing-panel.tsx`
- `src/components/service-regional-fit.tsx`
- `app/globals.css`

## Backlog Status

- State: In progress
- Owner: Product / UX / Engineering
- Progress summary: 10 items completed, 7 items pending
- Completed epics: Epic 1 and Epic 4
- In-progress epic: Epic 2
- Pending epic: Epic 3
- Recommended next focus: finish the remaining Epic 2 workspace tasks before moving into Epic 3 export-preview work
