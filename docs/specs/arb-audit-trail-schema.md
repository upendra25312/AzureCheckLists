# ARB Audit Trail Schema

Last updated: April 10, 2026

## Purpose

Define the audit trail model for the ARB workflow.

## Audit Event Fields

- auditEventId
- reviewId
- eventType
- actorType
- actorId
- eventTime
- targetEntityType
- targetEntityId
- beforeState
- afterState
- notes
- correlationId

## Event Types

- ReviewCreated
- FileUploaded
- ExtractionStarted
- ExtractionCompleted
- ExtractionFailed
- RequirementEdited
- MappingUpdated
- FindingsGenerated
- FindingUpdated
- ScorecardGenerated
- ActionCreated
- ActionUpdated
- DecisionRecorded
- DecisionOverridden
- ReviewClosed

## Actor Types

- Architect
- Reviewer
- PM
- Admin
- System

## Rules

- every final decision must emit an audit event
- reviewer overrides must record before and after state
- automated generation events should use actor type `System`
- audit events should be queryable by reviewId and eventTime

## MVP Recommendation

For MVP:
- log all state transitions and reviewer decisions
- log upload and generation lifecycle events
- preserve correlation ID for troubleshooting
