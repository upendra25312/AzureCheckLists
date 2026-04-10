# ARB Evidence Mapping Schema

Last updated: April 10, 2026

## Purpose

Define how extracted design evidence maps to normalized requirements in the ARB workflow.

## Evidence Object

Each design fact extracted from uploaded architecture artifacts should become an evidence record.

## Fields

- evidenceId
- reviewId
- sourceFileId
- sourceSection
- rawExcerpt
- normalizedFact
- evidenceType
- serviceTags
- confidence
- reviewerStatus

## Evidence Types

- Service Usage
- Network Pattern
- Identity Pattern
- Security Control
- DR / HA Pattern
- Monitoring / Ops Pattern
- Cost Assumption
- Governance Control
- Deployment / Automation Pattern
- Unsupported / Risk Statement

## Mapping Object

Requirements and evidence should connect through a mapping record.

### Fields

- mappingId
- reviewId
- requirementId
- evidenceId
- matchState
- rationale
- confidence
- reviewerNotes

## Match States

- Matched
- Partially Matched
- Not Found
- Ambiguous
- Needs Reviewer Confirmation

## Sample Evidence JSON

```json
{
  "evidenceId": "ev-001",
  "reviewId": "arb-2026-001",
  "sourceFileId": "file-002",
  "sourceSection": "Networking Design",
  "rawExcerpt": "The solution uses private endpoints for Storage and Key Vault.",
  "normalizedFact": "Storage and Key Vault are designed to use private endpoints.",
  "evidenceType": "Security Control",
  "serviceTags": ["Storage", "Key Vault", "Private Endpoints"],
  "confidence": "High",
  "reviewerStatus": "Pending Review"
}
```

## Sample Mapping JSON

```json
{
  "mappingId": "map-001",
  "reviewId": "arb-2026-001",
  "requirementId": "req-001",
  "evidenceId": "ev-001",
  "matchState": "Partially Matched",
  "rationale": "Evidence supports private access controls but does not confirm all customer-facing workloads stay in UK regions.",
  "confidence": "Medium",
  "reviewerNotes": null
}
```

## UX Requirements

The evidence mapping screen should allow:
- selecting a requirement
- seeing linked evidence cards
- opening the source excerpt
- adjusting match state
- adding reviewer rationale

## Rules

- one requirement may map to many evidence records
- one evidence record may support many requirements
- `Not Found` should not be silently auto-closed; it should drive a finding or missing-evidence note
- low-confidence mappings should be clearly flagged
