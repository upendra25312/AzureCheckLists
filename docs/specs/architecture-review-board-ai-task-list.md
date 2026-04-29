# Architecture Review Board AI Feature Task List

Last updated: April 10, 2026

## Objective

Add an AI-assisted Architecture Review Board capability to the Azure Checklists website so an architect can upload a project SOW and design documentation, receive a structured review, see grounded findings with Microsoft references, get a weighted score, and produce an approval recommendation such as `ARB Approved`, `Approved with Conditions`, `Needs Improvement`, or `Insufficient Evidence`.

Companion page backlog: [arb-page-gap-backlog.md](./arb-page-gap-backlog.md)

## Delivery Tracker

| Activity | Status | Recommended Owner | Priority | Test / Validation Status | Next Step |
|---|---|---:|---:|---:|---|
| Finalize ARB feature scope, user roles, and approval model | Planned | Product / Architecture | High | Not Started | Lock MVP scope and confirm that AI provides recommendation while human reviewer provides final sign-off |
| Define review workflow states (`Draft`, `Evidence Ready`, `Review In Progress`, `Review Complete`, `Approved`, `Approved with Conditions`, `Needs Improvement`, `Closed`) | Planned | Product / PM | High | Not Started | Add workflow state model and map to UX states and storage |
| Create Information Architecture for `Knowledge Hub`, `Review Workspace`, and `Decision Center` | Planned | Product / UX | High | Not Started | Convert redline brief into page inventory and route map |
| Create UI wireframes for upload, findings, scorecard, and decision screens | Planned | UX / Product | High | Not Started | Produce wireframes in Fluent 2 style and review with engineering |
| Add role-based UX for Architect, Reviewer, PM, and Read-only Stakeholder | Planned | Product / Engineering | High | Not Started | Define permissions and screen-level behavior by role |
| Design evidence-readiness gate for uploaded packages | Planned | Product / Engineering | High | Not Started | Add package checklist for SOW, design doc, diagram, cost input, security input, ops/runbook input |
| Implement secure upload flow for SOW and design artifacts | Planned | Engineering / Platform | High | Not Started | Use Blob Storage-backed upload flow and store review package metadata |
| Build document extraction pipeline for PDF, DOCX, PPTX, XLSX, and diagrams | Planned | Engineering / AI Platform | High | Not Started | Normalize uploaded documents into machine-readable structured content |
| Integrate Azure AI Document Intelligence / extraction layer | Planned | AI / Platform | High | Not Started | Validate text, headings, tables, and layout extraction quality on real sample packs |
| Normalize SOW requirements into structured requirement objects | Planned | AI / Engineering | High | Not Started | Parse scope, NFRs, security, DR, cost, and support requirements from uploaded SOWs |
| Normalize design evidence into structured design facts | Planned | AI / Engineering | High | Not Started | Parse services, topology, networking, IAM, HA/DR, monitoring, and cost controls from design docs |
| Build deterministic rules engine for hard checks and blockers | Planned | Architecture / Engineering | High | Not Started | Implement first-pass rules for region, security, DR, identity, network exposure, backup, and observability |
| Build grounded knowledge base using Azure best-practice content and Microsoft references | Planned | AI / Architecture | High | Not Started | Index curated Microsoft guidance for retrieval and citation |
| Integrate Azure AI Search for retrieval and evidence grounding | Planned | AI / Platform | High | Not Started | Support chunk retrieval by service, pillar, and review domain |
| Implement Azure OpenAI review synthesizer for structured findings | Planned | AI / Engineering | High | Not Started | Generate findings only from extracted evidence and grounded Microsoft references |
| Define weighted scoring model across requirements, security, reliability, performance, cost, operations, governance, and documentation completeness | Planned | Architecture / Leadership | High | Not Started | Finalize weights, scoring thresholds, and critical-blocker overrides |
| Implement explainable scorecard with drill-through to evidence and reference links | Planned | Engineering / UX | High | Not Started | Ensure every score maps to findings, evidence, and Microsoft guidance |
| Build findings screen with severity, evidence, missing evidence, recommendation, owner, due date, and status | Planned | Engineering / UX | High | Not Started | Use action-first table layout instead of AI essay output |
| Build `Decision Center` with AI recommendation, reviewer decision, final decision, sign-off log, and conditions | Planned | Engineering / Product | High | Not Started | Separate AI recommendation from human approval decision |
| Add export support for ARB package (`Markdown`, `CSV`, `PDF/Doc` later) | Planned | Engineering | Medium | Not Started | Deliver initial export with findings, scorecard, actions, and references |
| Add saved review history and resume experience for ARB packages | Planned | Engineering / UX | Medium | Not Started | Reuse existing saved-review model where possible |
| Add PM-oriented action tracking with owner, due date, and closure status | Planned | Product / Engineering | High | Not Started | Convert findings into execution-ready remediation actions |
| Add test dataset with good, weak, and incomplete architecture packages | Planned | QA / Architecture | High | Not Started | Build benchmark review sets to validate extraction and scoring quality |
| Run architecture calibration with senior reviewers on 5 to 10 sample reviews | Planned | Architecture / Leadership | High | Not Started | Compare AI findings and scores against human reviewer expectations |
| Add confidence and `Insufficient Evidence` handling when uploaded artifacts are incomplete | Planned | Engineering / AI | High | Not Started | Prevent false confidence and forced approvals when evidence is weak |
| Add admin controls for scoring weights, rule packs, and curated references | Planned | Platform / Admin | Medium | Not Started | Keep scoring and rule changes governed and auditable |
| Add audit trail for uploaded files, findings generation, decision changes, and reviewer sign-off | Planned | Platform / Security | High | Not Started | Ensure the ARB workflow is traceable and defensible |
| Add production guardrails for prompt injection, unsupported claims, and unsafe approval automation | Planned | Security / AI | High | Not Started | Add prompt defenses, content boundaries, and reviewer-only approval flow |
| Pilot ARB feature with one internal architecture pack and one public/sample pack | Planned | Product / Engineering | Medium | Not Started | Validate end-to-end flow before broad rollout |
| Define GA readiness checklist for ARB feature | Planned | Product / PM / Leadership | Medium | Not Started | Lock go-live criteria for accuracy, trust, performance, and reviewer usability |

## Highest-Priority Next 10

1. Finalize ARB scope, MVP boundary, and human sign-off model
2. Produce page map and wireframes for Upload, Findings, Scorecard, and Decision Center
3. Build evidence-readiness gate and upload package flow
4. Build document extraction and normalized requirement/evidence pipeline
5. Implement deterministic rules for critical blockers
6. Stand up grounded Microsoft best-practice knowledge base
7. Implement structured findings generation and evidence-linked references
8. Finalize scoring model and approval thresholds
9. Build findings table and scorecard UI
10. Run calibration with senior reviewers on real sample packages

## Test And Validation Plan

| Validation Area | Status | Recommended Owner | Priority | Test / Validation Status | Next Step |
|---|---|---:|---:|---:|---|
| Upload validation for supported file types and package completeness | Planned | QA / Engineering | High | Not Started | Test mixed review packages across PDF, DOCX, PPTX, XLSX |
| Requirement extraction accuracy from SOW | Planned | QA / Architecture | High | Not Started | Measure extraction precision against hand-labeled SOW samples |
| Design evidence extraction accuracy from architecture documents | Planned | QA / Architecture | High | Not Started | Compare extracted design facts against manually reviewed architecture packs |
| Rules-engine blocker accuracy | Planned | Architecture / QA | High | Not Started | Validate true positive and false positive rates on critical blockers |
| Microsoft reference grounding quality | Planned | AI / QA | High | Not Started | Check that each finding cites relevant Microsoft guidance only |
| Score consistency across repeated runs | Planned | QA / AI | High | Not Started | Test deterministic output stability with same inputs and versioned rules |
| Human reviewer agreement rate on findings and score | Planned | Leadership / Architecture | High | Not Started | Compare AI outputs with senior reviewer judgments on benchmark packs |
| `Insufficient Evidence` detection quality | Planned | QA / Architecture | High | Not Started | Ensure missing inputs degrade confidence instead of creating fake certainty |
| UX validation for architect workflow | Planned | UX / Product | Medium | Not Started | Observe first-time architect users completing upload-to-findings flow |
| PM action-tracking usability validation | Planned | PM / UX | Medium | Not Started | Confirm that owners, due dates, and closure statuses are usable without training |
| Security review of upload, storage, and retrieval flow | Planned | Security / Platform | High | Not Started | Review auth, access control, retention, and document handling |
| Performance validation for large review packages | Planned | Engineering / Platform | Medium | Not Started | Test extraction and findings generation on realistic document bundles |
| Export validation for findings and scorecard outputs | Planned | QA / Engineering | Medium | Not Started | Verify export content, formatting, and reference integrity |
| Production readiness review | Planned | Leadership / PM / Engineering | High | Not Started | Run final readiness gate before enabling reviewer sign-off in production |

## Milestone Buckets

- `Milestone 1: Product design and workflow definition`
- `Milestone 2: Upload, extraction, and evidence normalization`
- `Milestone 3: Rules engine, grounding, and AI findings`
- `Milestone 4: Scorecard, Decision Center, and exports`
- `Milestone 5: Calibration, validation, and pilot rollout`
- `Milestone 6: Governance hardening and GA readiness`

## Suggested Initial Approval Criteria

- No unresolved critical blockers
- Score meets agreed threshold
- Evidence completeness above minimum threshold
- Reviewer sign-off recorded
- Findings include grounded Microsoft references
- Action list created for all conditional approvals

## Notes

- This task list assumes the ARB feature is **AI-assisted** and **human-approved**
- The first release should optimize for **trust, evidence traceability, and reviewer usability**
- The MVP should avoid over-expanding into advanced comparison, diagram intelligence, or domain-specific packs before the core review loop is reliable
