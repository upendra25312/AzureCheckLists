# ARB Workflow States And Evidence Gating

Last updated: April 10, 2026

## Purpose

Define the end-to-end workflow states and evidence-readiness model for the AI-assisted Architecture Review Board capability.

## Workflow State Model

### 1. Draft

The review package record exists, but required files or metadata are not complete.

Typical conditions:
- project created
- partial file upload
- no extraction run yet

### 2. Evidence Ready

The uploaded package has enough baseline evidence to begin extraction and review.

Minimum required for this state:
- SOW or equivalent requirements source
- design document or equivalent architecture source
- package metadata captured

### 3. Review In Progress

Extraction, normalization, rules checks, and findings generation are in progress, or reviewer activity is underway.

Typical conditions:
- requirements extraction completed
- findings available in draft
- reviewer comments being added

### 4. Review Complete

The system-generated review is complete and ready for reviewer decision.

Typical conditions:
- findings generated
- scorecard generated
- blockers identified
- exports available

### 5. Approved

Human reviewer has approved the package with no further gating actions.

### 6. Approved with Conditions

Human reviewer has approved the package, but required actions remain.

Typical conditions:
- non-blocking gaps exist
- owners and due dates assigned

### 7. Needs Improvement

Review identified blocking gaps that require design updates before approval.

### 8. Closed

The review is finished and archived for record purposes.

## Evidence Gating Model

The system should not treat every package as equally reviewable.

Three evidence-readiness outcomes are needed before findings are trusted:

- `Ready for Review`
- `Ready with Gaps`
- `Insufficient Evidence`

## Minimum Evidence Set

### Required

- project name / identifier
- statement of work or equivalent requirement source
- design document or equivalent architecture source

### Strongly Recommended

- architecture diagram
- security design note
- operations / monitoring note
- cost or assumptions note
- DR / resilience note

### Optional But Helpful

- landing zone context
- runbooks
- environment inventory
- workload classification
- compliance notes

## Evidence Checklist Model

Each package should show a visible checklist:

| Evidence Item | Status | Importance | Notes |
|---|---:|---:|---|
| SOW / Requirements Source | Present / Missing | Required | Drives requirements extraction |
| Design Document | Present / Missing | Required | Drives design evidence extraction |
| Architecture Diagram | Present / Missing | Recommended | Improves topology and dependency understanding |
| Security Design Note | Present / Missing | Recommended | Improves security and access-control findings |
| Cost / Assumptions Input | Present / Missing | Recommended | Improves cost and sizing findings |
| DR / HA Input | Present / Missing | Recommended | Improves resilience scoring |
| Ops / Monitoring Input | Present / Missing | Recommended | Improves operational excellence scoring |

## Readiness Rules

### Ready for Review

Use when:
- all required evidence is present
- extracted requirements and design evidence reach acceptable confidence
- no major parsing failures occurred

### Ready with Gaps

Use when:
- required evidence is present
- one or more recommended inputs are missing
- review can proceed but confidence is reduced

### Insufficient Evidence

Use when:
- a required evidence item is missing
- extraction quality is too weak to support fair findings
- package is too incomplete for a reliable score

## Confidence Impact Model

The system should degrade confidence when evidence is weak.

### High Confidence

- required evidence present
- core recommended evidence present
- extraction quality strong
- findings align with deterministic rules and grounded references

### Medium Confidence

- required evidence present
- some recommended evidence missing
- extraction quality acceptable but incomplete

### Low Confidence

- required evidence barely present
- major sections missing or ambiguous
- findings depend on missing assumptions

## State Transition Rules

| From | To | Rule |
|---|---|---|
| Draft | Evidence Ready | Required evidence uploaded |
| Draft | Insufficient Evidence (intermediate readiness result) | Required evidence missing after validation |
| Evidence Ready | Review In Progress | Extraction or review starts |
| Review In Progress | Review Complete | Findings and score generated |
| Review Complete | Approved | Reviewer approves with no conditions |
| Review Complete | Approved with Conditions | Reviewer approves with tracked actions |
| Review Complete | Needs Improvement | Reviewer rejects due to blockers |
| Approved / Approved with Conditions / Needs Improvement | Closed | Review lifecycle completed and archived |

## UX Requirements

The UI should always show:

- current workflow state
- evidence readiness state
- missing evidence count
- critical blocker count
- last updated time
- named reviewer if assigned

## PM Requirements

PM-oriented screens should also show:

- owner per action
- due date per action
- overdue actions
- next milestone date
- re-review required yes/no

## Engineering Requirements

Backend workflow should preserve:

- extraction run status
- parsing errors
- model version used
- rules version used
- evidence completeness score
- audit trail of reviewer decisions

## Recommendation

No review should move to `Approved` or `Approved with Conditions` unless:
- findings are generated
- scorecard exists
- reviewer sign-off is captured
- evidence is not in `Insufficient Evidence` state
