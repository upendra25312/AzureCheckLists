# ARB Reviewer Decision Log Schema

Last updated: April 10, 2026

## Purpose

Define the reviewer decision log record for ARB decisions.

## Decision Log Fields

- decisionId
- reviewId
- aiRecommendation
- reviewerDecision
- reviewerName
- reviewerId
- rationale
- conditions
- mustFixActions
- requiresReReview
- recordedAt
- linkedScorecardVersion

## Reviewer Decision Values

- Approved
- Approved with Conditions
- Needs Improvement
- Rejected due to Insufficient Evidence
- Closed

## Rules

- reviewer decision must be stored separately from AI recommendation
- rationale is required when reviewer decision differs from AI recommendation
- conditions should be captured explicitly, not only in free text
- must-fix actions should link to action IDs where available

## MVP Recommendation

For MVP:
- create one decision record per decision event
- preserve history rather than overwriting old decisions
- show latest decision as active state in the UI
