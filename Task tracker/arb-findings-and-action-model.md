# ARB Findings And Action Model

Last updated: April 10, 2026

## Purpose

Define how findings and follow-up actions should be structured in the AI-assisted Architecture Review Board capability.

## Findings Design Principles

1. Findings must be action-oriented.
2. Findings must point to evidence or missing evidence.
3. Findings must include Microsoft references where applicable.
4. Findings must be filterable by severity and domain.
5. Findings must convert cleanly into PM-trackable actions.

## Finding Schema

Each finding should contain:

- finding id
- severity
- domain
- title
- finding statement
- why it matters
- evidence found
- missing evidence
- recommendation
- Microsoft reference
- confidence
- critical blocker flag
- owner suggestion
- due date suggestion
- status

## Severity Model

- Critical
- High
- Medium
- Low
- Informational

## Domain Model

- Requirements Coverage
- Security
- Reliability And Resilience
- Operational Excellence
- Cost Optimization
- Performance Efficiency
- Governance / Platform Alignment
- Documentation Completeness

## Required UX Columns

The main findings table should show:

- Severity
- Domain
- Finding
- Evidence Found
- Missing Evidence
- Recommendation
- Microsoft Reference
- Owner
- Due Date
- Status

## Action Model

Actions should be first-class records created from findings.

### Action Fields

- action id
- source finding id
- action summary
- owner
- due date
- severity
- status
- closure notes
- reviewer verification required yes/no

### Action Status Values

- Open
- In Progress
- Blocked
- Ready For Review
- Closed

## Finding Types

### Best Practice Followed

Used when the design clearly aligns with a notable Azure best practice and the evidence is explicit.

### Best Practice Missing

Used when a recommended control, pattern, or operational design element is absent.

### Requirement Gap

Used when the design does not clearly satisfy an explicit requirement from the uploaded package.

### Missing Evidence

Used when a fair assessment cannot be made because the package lacks key supporting information.

### Improvement Opportunity

Used when the design is acceptable but can be strengthened.

## Critical Blocker Handling

A finding can be marked as a critical blocker when it prevents approval regardless of score.

Examples:
- no identity model
- no security control for public exposure
- no backup or DR story where required
- unsupported region choice
- unresolved major compliance risk

## Reference Rules

Each recommendation should include:

- Microsoft guidance link where available
- short explanation of relevance
- service or pillar context

## Confidence Rules

Confidence should be shown as:

- High
- Medium
- Low

Confidence must reduce when:
- evidence is weak
- extracted content is ambiguous
- the recommendation depends heavily on inference

## Reviewer Behavior

Reviewers should be able to:

- accept finding
- amend owner / due date
- add reviewer note
- mark not applicable
- convert finding into explicit action
- close action after verification

## PM Behavior

PM views should emphasize:

- owner
- due date
- overdue items
- blocked items
- critical blockers
- re-review required

## MVP Recommendation

For MVP:
- keep findings table-first
- hide long narrative by default
- always show evidence and reference links near each finding
- ensure every conditional approval creates tracked actions
