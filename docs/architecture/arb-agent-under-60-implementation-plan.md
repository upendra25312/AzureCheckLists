> **Cost claim notice (2026-04-29):** This document describes the **Pilot tier** ($25–60/month). The repo also documents a **Production tier** ($500–700/month) deployed by `infrastructure/main.bicep`. See [`../internal/cost-narrative-reconciliation-2026-04-29.md`](../internal/cost-narrative-reconciliation-2026-04-29.md) before quoting cost figures externally.

# ARB Agent Under 60 USD Implementation Plan

## 1. Goal

Implement an ARB review workflow inside the current Azure Checklists repo without introducing a monthly platform baseline that exceeds 60 USD.

## 2. Delivery Principles

- reuse the current production Azure OpenAI resource
- keep fixed-cost services near zero
- prefer code-owned rules over managed retrieval services
- ship useful review outputs before adding advanced automation
- keep every phase independently testable

## 3. Phase Plan

## Phase 0. Data Contract and Review Model

Deliver:

- ARB review entity
- document inventory entity
- evidence map entity
- findings schema
- scorecard schema
- export schema

Repo targets:

- `src/types.ts`
- `api/src/shared/`
- `Task tracker/` docs if schema references need formal capture

Exit criteria:

- review state model is stable enough for frontend and backend work

## Phase 1. Upload and Persistence

Deliver:

- ARB review creation endpoint
- upload endpoint or SAS-based upload flow
- Blob persistence to `input-arb-files`
- Table Storage metadata for file inventory and review state

Exit criteria:

- a user can create a review and upload supporting files

## Phase 2. Text Extraction and Evidence Normalization

Deliver:

- text extraction for PDF, DOCX, PPTX, TXT, and Markdown
- document section normalization
- evidence objects keyed by review and document
- unsupported-file and low-evidence flags

Budget rule:

- do not enable OCR in this phase

Exit criteria:

- uploaded text-based files produce normalized evidence packages

## Phase 3. Rule Matching and Deterministic Scoring

Deliver:

- curated checklist JSON for WAF, CAF, and internal review rules
- mapping from evidence to checklist categories
- score computation in Functions
- critical blocker detection
- missing-evidence detection

Exit criteria:

- the backend can produce findings and a scorecard without calling the model

## Phase 4. AI Synthesis Layer

Deliver:

- Azure OpenAI synthesis call for board-style summary
- optional Microsoft Learn MCP lookup for current Azure guidance
- merged output combining deterministic score plus AI-generated narrative

Budget rule:

- one synthesis pass per review version
- cache repeated Learn lookups where practical

Exit criteria:

- the system can produce a readable ARB report with grounded Azure guidance

## Phase 5. Review UI and Exports

Deliver:

- review dashboard
- findings list
- scorecard view
- leadership summary view
- Markdown and JSON export options

Exit criteria:

- a reviewer can upload, inspect findings, and download outputs from the app

## Phase 6. Optional Foundry Wrapping

Deliver:

- optional single-agent Foundry packaging of the existing prompt
- same input contract as the Function-driven workflow

Budget rule:

- no File Search dependency
- no separate managed retrieval tier as a default

Exit criteria:

- Foundry is optional operational packaging, not a blocking dependency

## 4. Backlog by Area

### Frontend

- add ARB review creation route
- add upload panel
- add document inventory panel
- add findings and scorecard components
- add export action surface

### Backend

- add ARB review endpoints
- add upload registration
- add extraction pipeline
- add rules engine
- add synthesis endpoint
- add export writers

### Data

- curate WAF mapping JSON
- curate CAF mapping JSON
- curate internal checklist JSON
- define evidence taxonomy

### AI

- add ARB system prompt
- add context pack builder
- add Learn MCP adapter
- add response validator

## 5. Suggested File Targets

Backend:

- `api/src/functions/arb*.js`
- `api/src/shared/arb-*.js`

Frontend:

- `app/arb/`
- `src/components/arb/`
- `src/lib/arb/`

Rule content:

- `data/arb-rules/`

## 6. Acceptance Criteria

- uploads are persisted to Blob Storage
- review metadata is persisted to Table Storage
- supported documents produce extractable text
- the backend generates deterministic findings and scorecards
- Azure OpenAI adds a board-quality narrative summary
- outputs are downloadable from the UI
- the monthly baseline remains below the target envelope

## 7. What Not To Build First

Do not make these first-release dependencies:

- OCR-heavy ingestion
- Azure AI Search Basic
- multi-agent orchestration
- autonomous remediation agents
- broad enterprise workflow approvals
- human reviewer routing logic

## 8. Recommended Sequence

1. Review schemas and storage model
2. Upload and persistence
3. Extraction and normalization
4. Deterministic rules and scoring
5. AI synthesis and Learn grounding
6. Review UI and exports
7. Optional Foundry packaging

## 9. Delivery Outcome

At the end of this plan, Azure Checklists gains an ARB capability that is practical, explainable, and cost-controlled without waiting for a heavier Foundry-first platform build.