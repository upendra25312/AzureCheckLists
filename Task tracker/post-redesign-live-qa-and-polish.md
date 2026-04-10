# Post-Redesign Live QA And Polish

Last updated: April 10, 2026

## Objective

Protect the shipped redesign by validating the live experience, capturing a screenshot baseline, identifying any post-launch polish gaps, and planning the telemetry needed to measure whether the new workflow is actually improving product usage.

## Why This Exists

The redesign backlog is complete, but that does not automatically mean the live experience is fully settled. We still need:

- a live-site QA baseline
- deployment-aware screenshots for reference
- a smaller follow-up list for telemetry and polish
- a clean place to track post-redesign work without reopening completed redesign epics

## Scope

In scope:

- live-site public-route QA
- protected-route smoke checks
- desktop and mobile screenshot baseline
- telemetry planning for conversion and adoption
- small visual and interaction polish follow-ups

Out of scope:

- reopening completed redesign tasks unless a regression is found
- large new features unrelated to adoption or polish
- backend feature work beyond telemetry or release hardening

## Working Epics

### Epic A: Live-site QA baseline

Epic status: Completed

| ID | Priority | Status | Item | Definition of done |
| --- | --- | --- | --- | --- |
| QA-01 | P0 | Completed | Capture desktop screenshot baseline for key live routes | Desktop screenshots exist for homepage, review workspace, services, saved reviews, data health, and explorer |
| QA-02 | P0 | Completed | Capture mobile screenshot baseline for key live routes | Mobile screenshots exist for homepage, review workspace, and at least one dense route |
| QA-03 | P0 | Completed | Run public-route smoke checks on the deployed site | Core public routes return successfully and render the expected review-board shell |
| QA-04 | P0 | Completed | Run protected-route and backend-health smoke checks | Signed-out protected routes still block correctly and the live backend health endpoint remains healthy |
| QA-05 | P1 | Completed | Run a deeper live interaction pass for create-review, scope-selection, and export-preview flow | Live browser walkthrough confirms the main public workflow still feels right after deployment |
| QA-06 | P1 | Completed | Record any visual regressions or route-specific polish findings from the live pass | Findings are written below with route, severity, and follow-up owner |

### Epic B: Telemetry and adoption instrumentation

Epic status: Pending

| ID | Priority | Status | Item | Definition of done |
| --- | --- | --- | --- | --- |
| QA-07 | P0 | Pending | Define the post-redesign funnel events | Event list exists for homepage start, service add, export use, save/resume, and admin copilot usage |
| QA-08 | P1 | Pending | Instrument homepage and review-workspace conversion events | Events fire for initialize review, create review, service scope changes, and export actions |
| QA-09 | P1 | Pending | Instrument continuity and admin/copilot events | Save, restore, admin prompt submit, and key protected-route actions are measurable |
| QA-10 | P1 | Pending | Define a simple live dashboard or reporting view for redesign adoption | The team can inspect funnel health without digging through raw telemetry |

### Epic C: Post-launch polish

Epic status: Pending

| ID | Priority | Status | Item | Definition of done |
| --- | --- | --- | --- | --- |
| QA-11 | P1 | Pending | Review copy and spacing polish on dense workspace sections | Minor wording and spacing issues are either fixed or listed as intentional |
| QA-12 | P1 | Pending | Review final mobile ergonomics on the live site | No obvious clipping, stacked-button pain, or unreadable dense sections remain |
| QA-13 | P2 | Pending | Review motion and stage-orientation polish after live use | Any remaining motion/orientation tweaks are small, deliberate, and non-blocking |
| QA-14 | P2 | Pending | Break follow-up refinements into new issues after the live QA pass | Any newly discovered work is split into smaller issues instead of growing this tracker indefinitely |

## Initial Live QA Round

### Routes checked

- `/`
- `/review-package`
- `/services`
- `/my-project-reviews`
- `/data-health`
- `/explorer`
- `/admin/copilot` signed-out protection
- `/api/health`

### Screenshot baseline

Desktop screenshots captured under `output/playwright/`:

- `live-home-desktop.png`
- `live-review-package-desktop.png`
- `live-services-desktop.png`
- `live-my-project-reviews-desktop.png`
- `live-data-health-desktop.png`
- `live-explorer-desktop.png`

Mobile screenshots captured under `output/playwright/`:

- `live-home-mobile.png`
- `live-review-package-mobile.png`
- `live-services-mobile.png`

### Findings

No P0 or P1 blockers recorded in the initial live smoke.

Notes:

- The signed-out admin route still correctly protects `/admin/copilot` with `401`.
- The live health endpoint remained healthy during the QA pass.
- The public routes served the redesign build with `Last-Modified: Fri, 10 Apr 2026 03:34:42 GMT` during the initial QA round.
- `data-health` and `explorer` both returned `200` and still exposed the board shell markers (`Azure Review Board`, `review-command-panel`) even though the first text-match probe used a copy string that was not present in the server-rendered HTML.
- A deeper interaction walkthrough is still worth doing next so we can judge small UX polish items with real browser input, not just route-load validation.

## QA-05 Live Interaction Pass

### Walkthrough performed

1. Opened the live homepage at `/`.
2. Created a new review named `QA-05 live flow review` from the homepage initializer.
3. Confirmed the handoff landed in `/review-package` with the new review active.
4. Added the `Edge web baseline` starter bundle to scope four real services.
5. Verified the matrix unlocked with live region-fit and pricing posture data.
6. Jumped to the export stage and reviewed the audience-first handoff cards.
7. Downloaded a real export artifact: `qa-05-live-flow-review-leadership-summary.md`.

### Artifacts captured

- `output/playwright/qa05-live-pass/review-package-live-flow.png`
- `output/playwright/qa05-live-pass/qa-05-live-flow-review-leadership-summary.md`

### Findings from the live pass

- `[P1][review-package][UX copy]` The `Checklist CSV` export card says `Waiting on scoped findings` and `This preview appears once the review has scoped findings to export` even when the live review already contains `344 scoped findings`. Follow-up owner: frontend/workspace.
- `[P2][homepage -> review-package][UX clarity]` Export previews default to `Audience: Cloud Architect` even when the homepage initializer never asked the user to choose an audience. The default is workable, but it can make leadership and commercial artifacts feel pre-filled by surprise. Follow-up owner: product + frontend.
- `[P2][review-package][positive validation]` The audience-first export structure works well in real use. The live leadership brief download completed successfully and the content matched the current scoped services, blocked regions, and pending findings.

## Validation Log

- April 10, 2026: Initial post-redesign live QA tracker created.
- April 10, 2026: Captured live desktop and mobile screenshot baseline for the shipped redesign under `output/playwright/`.
- April 10, 2026: Verified public live routes returned successfully and still rendered the Azure Review Board shell.
- April 10, 2026: Verified signed-out admin protection and live `/api/health` backend readiness.
- April 10, 2026: Confirmed the live backend remained healthy at `2026-04-10T03:42:48.125Z` with `storageConfigured: true` and `copilotConfigured: true`.
- April 10, 2026: Completed the deeper live interaction pass for create-review, scope-selection, and export-preview flow on the deployed site.
- April 10, 2026: Verified the homepage initializer handed off a live review into `/review-package`, the starter bundle unlocked real region and pricing signals, and a live leadership export downloaded successfully.

## Recommended Next Step

Start Epic B next:

1. Define the post-redesign funnel events for initialize review, add service, export, save or restore, and admin prompt usage.
2. Instrument the homepage and review workspace with those conversion events.
3. Decide where the redesign adoption view should live so the funnel can be inspected without raw logs.
