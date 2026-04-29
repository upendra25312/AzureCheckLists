# ARB PM Action Tracking Model

Last updated: April 10, 2026

## Purpose

Define how ARB findings become PM-trackable actions with ownership, due dates, and closure visibility.

## Action Principles

1. Every conditional approval should generate tracked actions.
2. Critical blockers should become mandatory actions.
3. Actions should be visible in findings, scorecard, and My Reviews queue.

## Action Object

Fields:
- actionId
- reviewId
- sourceFindingId
- summary
- description
- owner
- dueDate
- severity
- status
- blockerFlag
- reReviewRequired
- closureNotes
- verifiedBy
- verifiedAt

## Status Values

- Open
- In Progress
- Blocked
- Ready For Review
- Closed

## Severity Values

- Critical
- High
- Medium
- Low

## Sample JSON

```json
{
  "actionId": "act-001",
  "reviewId": "arb-2026-001",
  "sourceFindingId": "find-001",
  "summary": "Define internet boundary control pattern",
  "description": "Update design package to document WAF, APIM, or equivalent access restriction pattern for the internet-facing workload.",
  "owner": "Security Architect",
  "dueDate": "2026-04-20",
  "severity": "High",
  "status": "Open",
  "blockerFlag": false,
  "reReviewRequired": true,
  "closureNotes": null,
  "verifiedBy": null,
  "verifiedAt": null
}
```

## PM Views Should Support

- owner-based filtering
- due-date sorting
- overdue highlighting
- blocker-only filter
- re-review-required filter
- closure verification

## Workflow Rules

- `Approved with Conditions` must include at least one open action
- `Needs Improvement` should typically include one or more blocker or high-severity actions
- `Closed` review packages should not have unresolved critical actions

## Reporting Requirements

PM summary should show:
- total open actions
- overdue actions
- blocker actions
- actions awaiting reviewer verification
- next re-review date

## Reviewer Interaction

Reviewers should be able to:
- mark action as verified
- reopen action if evidence is weak
- require re-review after closure

## MVP Recommendation

For MVP:
- implement basic action object storage
- surface actions on findings and decision screens
- add simple My Reviews queue filters for owner, due date, blocker, and status
