# ARB Backend Function Implementation Plan

Last updated: April 10, 2026

## Purpose

Define the backend function-by-function implementation plan for the ARB capability.

## Backend Shape

Use a dedicated Function App with review-centric APIs and asynchronous orchestration for extraction and findings generation.

## Function Groups

### 1. Review Lifecycle Functions

- create review package
- get review summary
- list reviews
- update review metadata

### 2. Upload Registration Functions

- initialize upload session
- confirm upload completion
- validate logical category
- recalculate evidence readiness

### 3. Extraction Orchestration Functions

- start extraction job
- track extraction status
- normalize requirements
- normalize evidence
- update mapping candidates

### 4. Findings And Score Functions

- run deterministic rules
- generate grounded findings
- build scorecard
- update recommendation

### 5. Action And Decision Functions

- create action
- update action
- record decision
- close review

### 6. Export Functions

- generate markdown export
- generate CSV export
- register export artifact

### 7. Audit And Diagnostics Functions

- write audit event
- list audit events
- health and diagnostics endpoints

## Suggested Function Names

- ArbCreateReview
- ArbGetReview
- ArbListReviews
- ArbInitUpload
- ArbCompleteUpload
- ArbStartExtraction
- ArbGetExtractionStatus
- ArbGetRequirements
- ArbPatchRequirement
- ArbGetEvidence
- ArbGetMappings
- ArbPatchMapping
- ArbGenerateFindings
- ArbGetFindings
- ArbPatchFinding
- ArbGetScorecard
- ArbListActions
- ArbCreateAction
- ArbPatchAction
- ArbGetDecision
- ArbRecordDecision
- ArbCreateExport
- ArbGetAuditTrail

## Orchestration Recommendation

Use orchestration for:
- extraction pipeline
- findings generation pipeline
- export generation pipeline

These should be resilient to partial failure and preserve progress state.

## Data Flow

1. Upload source files
2. Register files and recalculate evidence readiness
3. Start extraction orchestration
4. Persist requirements and evidence records
5. Run deterministic rules
6. Generate grounded findings and scorecard
7. Allow reviewer action and decisioning
8. Generate exports

## MVP Priorities

Phase 1 functions:
- ArbCreateReview
- ArbInitUpload
- ArbCompleteUpload
- ArbStartExtraction
- ArbGetExtractionStatus
- ArbGetRequirements
- ArbGetFindings
- ArbGetScorecard
- ArbRecordDecision
- ArbListActions

Phase 2 functions:
- evidence mapping edits
- export generation
- audit-trail browsing
- richer admin controls

## Implementation Notes

- keep DTOs aligned with the JSON models already defined in the repo
- centralize workflow-state transitions
- centralize audit writes for all mutating functions
- preserve correlation IDs for async jobs and errors
