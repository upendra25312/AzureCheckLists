# ARB Review Storage Model

Last updated: April 10, 2026

## Purpose

Define the storage model for ARB review packages and derived review artifacts.

## Storage Principles

1. Large uploaded files should live in blob/object storage.
2. Operational metadata should live in indexed low-cost structured storage.
3. Findings, scorecards, actions, and decisions should be separately addressable.
4. Audit history should be append-only where practical.

## Suggested Storage Split

### Blob/Object Storage

Use for:
- uploaded source files
- extracted normalized text artifacts
- export files
- packaged review bundles

### Structured Metadata Store

Use for:
- review summary record
- file index
- requirement records
- evidence records
- mappings
- findings
- scorecard
- actions
- decision log
- audit events

## Review Summary Record

Fields:
- reviewId
- projectName
- customerName
- architectName
- createdBy
- createdAt
- workflowState
- evidenceReadinessState
- assignedReviewer
- overallScore
- finalDecision
- lastUpdated

## Partitioning Guidance

For a key-value or table-style store:
- partition by `reviewId` for review-specific entities
- use secondary index or lookup table for user-based or workflow-based queries

## Blob Path Guidance

Suggested path model:
- `arb-reviews/{reviewId}/uploads/{fileName}`
- `arb-reviews/{reviewId}/extracted/{artifactName}`
- `arb-reviews/{reviewId}/exports/{exportName}`

## Data Retention Guidance

- retain review metadata for audit purposes
- define retention policy for uploaded source documents
- keep deleted-review lifecycle soft-delete friendly if user recovery is needed

## MVP Recommendation

For MVP:
- store uploaded files in blob storage
- store review metadata and structured artifacts in a simple indexed store
- keep exported review packages separate from working data
