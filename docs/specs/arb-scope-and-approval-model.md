# ARB Feature Scope And Approval Model

Last updated: April 10, 2026

## Purpose

Define the MVP scope, user roles, approval boundaries, and operating model for the AI-assisted Architecture Review Board capability in Azure Checklists.

## Product Position

The ARB capability is an **AI-assisted architecture review workflow**. It is not a replacement for enterprise architecture governance. The system produces:

- structured requirement coverage
- evidence-linked findings
- Microsoft-reference-backed recommendations
- weighted scorecard
- approval recommendation

Final sign-off remains a **human reviewer / ARB decision**.

## Core Outcome

An architect uploads a project package such as:

- statement of work
- high-level design
- low-level design
- architecture diagrams
- cost assumptions or pricing pack
- security or operations notes

The system then:

1. extracts requirements from the project package
2. extracts design evidence from the uploaded design documents
3. compares the design against curated Microsoft guidance and internal review rules
4. produces findings, gaps, strengths, action list, score, and recommendation
5. routes the package for human review and final decision

## MVP Scope

### In Scope

- upload and store ARB review package
- extract text and structure from common architecture document types
- normalize requirements from SOW and design package
- normalize design facts from solution documents
- deterministic rules for hard checks and critical blockers
- grounded AI findings with Microsoft references
- scorecard across major review domains
- approval recommendation statuses:
  - `ARB Approved`
  - `Approved with Conditions`
  - `Needs Improvement`
  - `Insufficient Evidence`
- reviewer sign-off flow
- findings export in markdown and CSV
- saved review history
- PM-friendly action list with owner and due date

### Out of Scope For MVP

- automatic final approval without human review
- advanced diagram inference from arbitrary images beyond basic extraction support
- industry-specific rule packs
- automatic remediation code generation
- deep cost modeling beyond review findings and assumptions handling
- side-by-side design comparison across multiple review packages
- external customer-facing approval portal

## Guiding Principles

1. **Evidence first**
   Every finding must be backed by uploaded evidence or explicit missing-evidence callout.

2. **Grounding over guesswork**
   Recommendations should be grounded in curated Microsoft guidance and deterministic rules where possible.

3. **Human approval, AI recommendation**
   The system can recommend. The reviewer approves.

4. **Actionable output**
   Findings should convert into tasks, owners, due dates, and closure status.

5. **Transparent scoring**
   Scores must be explainable and traceable to requirements, findings, and evidence.

## User Roles

### Architect

- uploads package
- reviews extracted requirements
- reviews findings
- responds to actions
- resubmits revised package if needed

### Reviewer / ARB Member

- reviews findings and evidence
- validates score and recommendation
- adds reviewer notes
- records approval decision or conditional approval

### Project Manager

- tracks action owners, due dates, and workflow state
- monitors blockers and readiness
- drives review closure

### Read-only Stakeholder

- views package summary, findings, scorecard, and final decision
- cannot alter findings or approval state

### Admin

- manages curated references, rule packs, scoring weights, and diagnostics
- monitors system health and audit logs

## Approval Model

### AI Recommendation Layer

The platform produces one of these recommendation statuses:

- `ARB Approved`
- `Approved with Conditions`
- `Needs Improvement`
- `Insufficient Evidence`

### Human Review Layer

A named reviewer confirms one of these:

- approved
- approved with conditions
- needs improvement
- rejected from review due to insufficient evidence

### Final Decision Rule

The **reviewer decision** is the final workflow decision. The AI recommendation is advisory.

## Approval Threshold Guidance

### `ARB Approved`

Use only when:

- no unresolved critical blockers exist
- evidence coverage is sufficient
- score meets agreed threshold
- required operating controls are present

### `Approved with Conditions`

Use when:

- architecture is acceptable to proceed
- some non-blocking gaps remain
- action owners and due dates are recorded

### `Needs Improvement`

Use when:

- critical gaps exist
- key best practices are not met
- design must be revised before approval

### `Insufficient Evidence`

Use when:

- uploaded package is too incomplete to support a fair review
- the system cannot reliably determine compliance or readiness

## Critical Blocker Examples

Any one of these can force `Needs Improvement` or `Insufficient Evidence` depending on context:

- no clear identity model
- no security boundary for internet-facing services
- no backup or DR story where required
- unsupported or non-compliant region choice
- public exposure without compensating controls
- missing monitoring / operational ownership for production workloads

## Review Domains For Scoring

- requirements coverage
- security
- reliability and resilience
- performance efficiency
- cost optimization
- operational excellence
- governance / landing zone alignment
- documentation completeness

## Required Reviewer Outputs

Every completed review should produce:

- executive summary
- requirements coverage matrix
- structured findings
- evidence and missing evidence notes
- Microsoft references
- weighted scorecard
- action list
- reviewer sign-off note

## Success Criteria For MVP

The MVP is successful when:

- architects can upload a real project package without manual intervention from engineering
- extracted requirements are editable and reviewable
- findings are grounded and traceable
- the scorecard is understandable to architects and reviewers
- PMs can track actions to closure
- the system never auto-approves without human sign-off
