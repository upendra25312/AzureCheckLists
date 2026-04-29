# ARB Requirement Extraction Schema

Last updated: April 10, 2026

## Purpose

Define the normalized requirement object for extracting reviewable requirements from SOWs and related project documents.

## Requirement Object

Each extracted requirement should become a structured record.

## Fields

- requirementId
- reviewId
- sourceFileId
- sourceSection
- rawText
- normalizedText
- category
- criticality
- requirementType
- confidence
- reviewerStatus
- reviewerNotes

## Categories

- Business Objective
- Functional Requirement
- Non-Functional Requirement
- Security
- Compliance
- Networking
- Identity And Access
- Reliability And Resilience
- Cost / Commercial
- Operations / Support
- Data / Residency
- Governance
- Scope Constraint
- Assumption / Dependency

## Criticality Values

- Critical
- High
- Medium
- Low

## Requirement Type Values

- Explicit
- Derived
- Assumption
- Constraint

## Reviewer Status Values

- Pending Review
- Accepted
- Edited
- Merged
- Marked Irrelevant

## Sample JSON

```json
{
  "requirementId": "req-001",
  "reviewId": "arb-2026-001",
  "sourceFileId": "file-001",
  "sourceSection": "Section 3.2 Security Requirements",
  "rawText": "All customer-facing workloads must remain within UK regions.",
  "normalizedText": "Production and customer-facing workloads must use UK-based Azure regions only.",
  "category": "Data / Residency",
  "criticality": "Critical",
  "requirementType": "Explicit",
  "confidence": "High",
  "reviewerStatus": "Accepted",
  "reviewerNotes": null
}
```

## Extraction Rules

- preserve source section for traceability
- normalize vague phrasing into concise requirement statements
- flag low-confidence derived requirements for reviewer confirmation
- do not silently merge different requirements without reviewer review

## UX Requirements

Reviewers and architects should be able to:
- accept a requirement
- edit normalized text
- merge duplicates
- change category or criticality
- mark a line as irrelevant if extraction misclassified it
