# ARB Frontend Route Map And Component Breakdown

Last updated: April 10, 2026

## Purpose

Define the frontend route structure and component breakdown for the ARB capability inside Azure Checklists.

## Route Map

### Home And Knowledge Routes

- /
- /knowledge
- /knowledge/services
- /knowledge/services/[serviceId]
- /knowledge/regions
- /knowledge/pricing

### Review Workspace Routes

- /reviews/new
- /reviews/{reviewId}
- /reviews/{reviewId}/upload
- /reviews/{reviewId}/requirements
- /reviews/{reviewId}/evidence
- /reviews/{reviewId}/findings
- /reviews/{reviewId}/scorecard
- /reviews/{reviewId}/decision
- /reviews/{reviewId}/export

### Review Queue And Admin

- /my-reviews
- /data-health
- /admin
- /admin/arb

## Page-Level Component Breakdown

### Upload Page

Components:
- ReviewPageShell
- ReviewStepper
- UploadDropzone
- UploadedFileList
- EvidenceChecklistPanel
- ReadinessBadge
- PackageSummaryCard

### Requirements Page

Components:
- ReviewPageShell
- ReviewStepper
- RequirementsTable
- RequirementDetailsDrawer
- RequirementFiltersBar
- ConfidenceBadge

### Evidence Page

Components:
- ReviewPageShell
- ReviewStepper
- RequirementsListPanel
- EvidenceCardsPanel
- SourceExcerptDrawer
- MatchStateBadge

### Findings Page

Components:
- ReviewPageShell
- ReviewStepper
- FindingsSummaryStrip
- FindingsFiltersBar
- FindingsTable
- ActionRail
- DecisionPreviewCard

### Scorecard Page

Components:
- ReviewPageShell
- ScoreSummaryCard
- ScoreDomainTable
- ScoreRadarChart
- ScoreRationaleDrawer

### Decision Page

Components:
- ReviewPageShell
- DecisionSummaryCard
- DecisionForm
- ConditionsList
- MustFixActionsPanel
- DecisionLogTable

### My Reviews Page

Components:
- ReviewsQueueFilters
- ReviewsQueueTable
- WorkflowStateBadge
- BlockerCountBadge

## Shared Components

- PageHeader
- StatusBadge
- ConfidenceBadge
- SeverityBadge
- DomainBadge
- EvidenceChip
- ReferenceLinkList
- EmptyStatePanel
- LoadingStatePanel

## State Management Guidance

Frontend state should separate:
- review summary state
- upload state
- requirements state
- evidence and mappings state
- findings state
- scorecard state
- decision state

## MVP Recommendation

For MVP:
- prioritize Upload, Findings, Scorecard, Decision, and My Reviews
- keep service detail page enhancements small unless needed for ARB grounding UX
- build with reusable table, drawer, badge, and stepper components
