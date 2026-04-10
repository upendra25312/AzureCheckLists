# ARB API Contract

Last updated: April 10, 2026

## Purpose

Define the initial API contract for the AI-assisted Architecture Review Board workflow in Azure Checklists.

## API Principles

1. APIs should be review-centric, not file-centric.
2. Long-running operations should return async job states.
3. Review, findings, scorecard, actions, and decision endpoints should be clearly separated.
4. All mutating endpoints should preserve audit metadata.

## Core Resource Model

- Review Package
- Uploaded File
- Requirement
- Evidence Mapping
- Finding
- Scorecard
- Action
- Decision Log
- Audit Event

## Endpoint Summary

### Reviews

#### `POST /api/arb/reviews`
Create a new review package.

Request body:
- projectName
- projectCode
- customerName
- architectName
- targetReviewDate (optional)
- notes (optional)

Response:
- reviewId
- workflowState
- evidenceReadinessState

#### `GET /api/arb/reviews/{reviewId}`
Return the full review summary.

#### `GET /api/arb/reviews`
List reviews with filters:
- state
- reviewer
- owner
- decision
- projectName

### Uploads

#### `POST /api/arb/reviews/{reviewId}/uploads/init`
Initialize upload session and return SAS or upload token details.

#### `POST /api/arb/reviews/{reviewId}/uploads/complete`
Confirm upload completion and register uploaded file metadata.

Request body:
- fileName
- logicalCategory
- blobPath
- contentHash
- fileType

Response:
- fileId
- extractionStatus

### Extraction

#### `POST /api/arb/reviews/{reviewId}/extract`
Start extraction pipeline for package.

Response:
- jobId
- status = `Queued`

#### `GET /api/arb/reviews/{reviewId}/extract/status`
Return extraction and normalization state.

Response:
- jobId
- state
- completedSteps
- failedSteps
- evidenceReadinessState
- extractionErrors

### Requirements

#### `GET /api/arb/reviews/{reviewId}/requirements`
Return extracted requirements.

#### `PATCH /api/arb/reviews/{reviewId}/requirements/{requirementId}`
Update normalized requirement text, category, criticality, or reviewer status.

### Evidence Mapping

#### `GET /api/arb/reviews/{reviewId}/evidence`
Return extracted evidence facts.

#### `GET /api/arb/reviews/{reviewId}/mappings`
Return requirement-to-evidence mappings.

#### `PATCH /api/arb/reviews/{reviewId}/mappings/{mappingId}`
Update match state, rationale, or reviewer notes.

### Findings

#### `POST /api/arb/reviews/{reviewId}/findings/generate`
Generate findings and score inputs.

Response:
- jobId
- status = `Queued`

#### `GET /api/arb/reviews/{reviewId}/findings`
Return findings list with filters:
- severity
- domain
- criticalBlocker
- status

#### `PATCH /api/arb/reviews/{reviewId}/findings/{findingId}`
Update owner, due date, status, or reviewer note.

### Scorecard

#### `GET /api/arb/reviews/{reviewId}/scorecard`
Return scorecard and recommendation.

### Actions

#### `GET /api/arb/reviews/{reviewId}/actions`
Return review actions.

#### `POST /api/arb/reviews/{reviewId}/actions`
Create action manually or from finding.

#### `PATCH /api/arb/reviews/{reviewId}/actions/{actionId}`
Update owner, due date, status, blocker flag, or closure note.

### Decision Center

#### `GET /api/arb/reviews/{reviewId}/decision`
Return AI recommendation, reviewer decision state, and decision history.

#### `POST /api/arb/reviews/{reviewId}/decision`
Record reviewer decision.

Request body:
- finalDecision
- rationale
- conditions[]
- requiresReReview

Response:
- decisionId
- workflowState

### Exports

#### `POST /api/arb/reviews/{reviewId}/exports`
Request export generation.

Request body:
- format (`markdown`, `csv`, later `pdf`)
- includeFindings
- includeScorecard
- includeActions

### Audit

#### `GET /api/arb/reviews/{reviewId}/audit`
Return audit trail for key review events.

## Async Job States

- Queued
- Running
- Completed
- Failed
- Cancelled

## Error Model

Each error response should include:
- code
- message
- correlationId
- details (optional)

## Security Rules

- only authenticated users can create or modify reviews
- reviewer decision endpoints restricted by role
- admin-only endpoints separated under admin route namespace
- file upload should use scoped upload tokens or SAS, not raw shared credentials

## MVP Recommendation

For MVP:
- use REST endpoints
- keep async jobs explicit for extraction and findings generation
- support list and detail endpoints first
- avoid overly generic mutation endpoints
