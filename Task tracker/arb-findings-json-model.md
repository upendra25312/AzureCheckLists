# ARB Findings JSON Model

Last updated: April 10, 2026

## Purpose

Define the JSON shape for findings produced by the ARB workflow.

## Finding Record

```json
{
  "findingId": "find-001",
  "reviewId": "arb-2026-001",
  "severity": "High",
  "domain": "Security",
  "findingType": "Best Practice Missing",
  "title": "Public exposure lacks explicit compensating controls",
  "findingStatement": "The design describes internet-facing application components but does not explicitly define WAF, access restrictions, or equivalent boundary controls.",
  "whyItMatters": "Internet-facing services without clear boundary controls increase security and governance risk.",
  "evidenceFound": [
    {
      "sourceFileId": "file-002",
      "sourceSection": "Application Access",
      "excerpt": "The application will be accessible over the internet."
    }
  ],
  "missingEvidence": [
    "No explicit WAF or access restriction statement found",
    "No compensating control documented"
  ],
  "recommendation": "Document and implement a clear boundary control pattern such as WAF, APIM, or access restrictions aligned to workload design.",
  "references": [
    {
      "title": "Azure Architecture Center",
      "url": "https://learn.microsoft.com/azure/architecture/"
    }
  ],
  "confidence": "Medium",
  "criticalBlocker": false,
  "suggestedOwner": "Security Architect",
  "suggestedDueDate": null,
  "status": "Open"
}
```

## Allowed Values

### Severity
- Critical
- High
- Medium
- Low
- Informational

### Domain
- Requirements Coverage
- Security
- Reliability And Resilience
- Operational Excellence
- Cost Optimization
- Performance Efficiency
- Governance / Platform Alignment
- Documentation Completeness

### Finding Type
- Best Practice Followed
- Best Practice Missing
- Requirement Gap
- Missing Evidence
- Improvement Opportunity

### Status
- Open
- In Progress
- Closed
- Not Applicable

## Rules

- each finding must reference evidence found or explicitly note missing evidence
- each recommendation should include at least one grounded reference where applicable
- critical blockers must be explicit and never hidden inside narrative text
- findings should remain human-readable but structured enough for filtering and export
