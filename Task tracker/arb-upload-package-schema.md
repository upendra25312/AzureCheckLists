# ARB Upload Package Schema

Last updated: April 10, 2026

## Purpose

Define the upload-package structure for the AI-assisted Architecture Review Board workflow.

## Package Object

Each review starts with a package record.

## Core Fields

- reviewId
- projectName
- projectCode
- customerName
- architectName
- createdBy
- createdAt
- workflowState
- evidenceReadinessState
- assignedReviewer
- targetReviewDate
- notes

## File Types Supported In MVP

- PDF
- DOCX
- PPTX
- XLSX
- TXT / Markdown
- image attachments for reference only

## File Record Schema

Each uploaded file should include:

- fileId
- reviewId
- fileName
- fileType
- logicalCategory
- blobPath
- uploadedBy
- uploadedAt
- contentHash
- extractionStatus
- extractionError
- sourceRole

## Logical Categories

- `sow`
- `design_doc`
- `diagram`
- `security_note`
- `cost_assumptions`
- `dr_ha_note`
- `ops_monitoring_note`
- `supporting_artifact`

## Minimum Evidence Rules

Required categories:
- `sow`
- `design_doc`

Recommended categories:
- `diagram`
- `security_note`
- `cost_assumptions`
- `dr_ha_note`
- `ops_monitoring_note`

## Package Readiness Fields

- requiredEvidencePresent
- recommendedEvidenceCoverage
- missingRequiredItems
- missingRecommendedItems
- readinessOutcome
- readinessNotes

## Sample JSON

```json
{
  "reviewId": "arb-2026-001",
  "projectName": "DMG Media Azure Review",
  "projectCode": "DMG-ARB-001",
  "customerName": "DMG Media",
  "architectName": "Upendra Kumar",
  "createdBy": "imtcdl2024@gmail.com",
  "createdAt": "2026-04-10T00:00:00Z",
  "workflowState": "Draft",
  "evidenceReadinessState": "Ready with Gaps",
  "assignedReviewer": null,
  "targetReviewDate": null,
  "notes": "Initial package upload",
  "files": [
    {
      "fileId": "file-001",
      "reviewId": "arb-2026-001",
      "fileName": "SOW.pdf",
      "fileType": "pdf",
      "logicalCategory": "sow",
      "blobPath": "reviews/arb-2026-001/SOW.pdf",
      "uploadedBy": "imtcdl2024@gmail.com",
      "uploadedAt": "2026-04-10T00:00:00Z",
      "contentHash": "sha256:abc123",
      "extractionStatus": "Pending",
      "extractionError": null,
      "sourceRole": "Architect"
    }
  ],
  "requiredEvidencePresent": true,
  "recommendedEvidenceCoverage": 0.4,
  "missingRequiredItems": [],
  "missingRecommendedItems": ["security_note", "ops_monitoring_note"],
  "readinessOutcome": "Ready with Gaps",
  "readinessNotes": "Can proceed with reduced confidence"
}
```

## Engineering Notes

- logical category should be user-editable at upload time
- extraction status should be tracked per file
- readiness should update automatically when files change
- content hash should prevent duplicate uploads where practical
