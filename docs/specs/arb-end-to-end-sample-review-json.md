# ARB End-To-End Sample Review JSON

Last updated: April 10, 2026

## Purpose

Provide a simplified end-to-end sample payload showing how ARB review data fits together.

## Sample

```json
{
  "review": {
    "reviewId": "arb-2026-001",
    "projectName": "DMG Media Azure Review",
    "customerName": "DMG Media",
    "workflowState": "Review Complete",
    "evidenceReadinessState": "Ready with Gaps",
    "assignedReviewer": "reviewer-001"
  },
  "requirements": [
    {
      "requirementId": "req-001",
      "normalizedText": "Customer-facing workloads must remain within UK regions.",
      "category": "Data / Residency",
      "criticality": "Critical"
    }
  ],
  "evidence": [
    {
      "evidenceId": "ev-001",
      "normalizedFact": "Primary region is UK South and DR region is North Europe.",
      "evidenceType": "DR / HA Pattern",
      "confidence": "High"
    }
  ],
  "mappings": [
    {
      "mappingId": "map-001",
      "requirementId": "req-001",
      "evidenceId": "ev-001",
      "matchState": "Partially Matched",
      "rationale": "Primary region matches UK residency, but DR region does not."
    }
  ],
  "findings": [
    {
      "findingId": "find-001",
      "severity": "Critical",
      "domain": "Requirements Coverage",
      "findingType": "Requirement Gap",
      "title": "DR region conflicts with stated residency requirement",
      "recommendation": "Revise DR region selection or document policy exception with reviewer approval.",
      "confidence": "High",
      "criticalBlocker": true,
      "status": "Open"
    }
  ],
  "scorecard": {
    "overallScore": 61,
    "recommendation": "Needs Improvement",
    "confidence": "Medium",
    "criticalBlockers": 1
  },
  "actions": [
    {
      "actionId": "act-001",
      "sourceFindingId": "find-001",
      "summary": "Resolve DR region conflict",
      "owner": "Cloud Architect",
      "dueDate": "2026-04-20",
      "status": "Open",
      "reReviewRequired": true
    }
  ],
  "decisionLog": [
    {
      "decisionId": "dec-001",
      "aiRecommendation": "Needs Improvement",
      "reviewerDecision": "Needs Improvement",
      "rationale": "Residency requirement is not satisfied in current design.",
      "recordedAt": "2026-04-10T10:00:00Z"
    }
  ]
}
```

## Why This Matters

This sample is useful for:
- API implementation
- frontend state design
- test fixture creation
- reviewer calibration walkthroughs
