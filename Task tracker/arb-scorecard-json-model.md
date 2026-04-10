# ARB Scorecard JSON Model

Last updated: April 10, 2026

## Purpose

Define the JSON structure for scorecards produced by the ARB workflow.

## Scorecard Record

```json
{
  "reviewId": "arb-2026-001",
  "overallScore": 78,
  "recommendation": "Approved with Conditions",
  "confidence": "Medium",
  "criticalBlockers": 0,
  "evidenceReadinessState": "Ready with Gaps",
  "domainScores": [
    {
      "domain": "Requirements Coverage",
      "weight": 20,
      "score": 16,
      "reason": "Most explicit requirements were mapped, but some operational requirements need confirmation.",
      "linkedFindings": ["find-003", "find-005"]
    },
    {
      "domain": "Security",
      "weight": 20,
      "score": 12,
      "reason": "Core controls are partially defined, but explicit boundary controls are under-documented.",
      "linkedFindings": ["find-001"]
    }
  ],
  "reviewerOverride": null
}
```

## Fields

- reviewId
- overallScore
- recommendation
- confidence
- criticalBlockers
- evidenceReadinessState
- domainScores[]
- reviewerOverride

## Domain Score Fields

- domain
- weight
- score
- reason
- linkedFindings

## Reviewer Override Fields

When used:
- reviewerName
- overrideDecision
- overrideRationale
- overriddenAt

## Recommendation Values

- ARB Approved
- Approved with Conditions
- Needs Improvement
- Insufficient Evidence

## Confidence Values

- High
- Medium
- Low

## Rules

- overall score must be explainable from domain scores
- domain reasons must be readable and linked to underlying findings
- reviewer override must never replace the original model output silently
- scorecard must reflect evidence-readiness state and blocker count
