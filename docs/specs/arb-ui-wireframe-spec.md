# ARB UI Wireframe Spec

Last updated: April 10, 2026

## Purpose

Define the initial wireframe structure for the AI-assisted Architecture Review Board capability in Azure Checklists.

## Design Direction

- desktop-first
- Fluent-style enterprise interface
- action-first layout
- evidence-backed UX
- minimal decorative visuals
- strong table and workflow hierarchy

## Core Pages

1. Home
2. Knowledge Hub Landing
3. Service Detail Page
4. Upload Review Package
5. Requirements Extraction
6. Evidence Mapping
7. Findings
8. Scorecard
9. Decision Center
10. My Reviews

## 1. Home

### Goal

Separate lookup from review immediately.

### Layout

- page title
- two primary action cards:
  - Knowledge Hub
  - Start Review
- resume review card
- data freshness strip
- recent review activity

### Primary Actions

- Browse Services
- Compare Regions
- Check Pricing
- Start Review
- Resume Review

## 2. Knowledge Hub Landing

### Goal

Provide fast service lookup without forcing users into a review workflow.

### Layout

- search bar at top
- category filters under search
- service cards grid
- quick links to region explorer and pricing explorer
- recently updated guidance strip

## 3. Service Detail Page

### Goal

Make service-specific guidance, region context, pricing, and review checks accessible in one place.

### Layout Model

#### Left Rail
- service metadata
- category
- GA / preview state
- quick filters
- related services

#### Center Panel
Tabs:
1. Overview
2. Best Practices
3. Region Availability
4. Pricing
5. Reference Architectures
6. Review Checks

#### Right Sticky Rail
- save to review
- common risks
- pricing snapshot
- region count
- Microsoft reference links

## 4. Upload Review Package

### Goal

Collect required files and establish evidence readiness.

### Layout

- stepper at top
- drag-and-drop upload zone
- file list with upload status
- evidence checklist panel on right
- confidentiality note
- readiness badge at bottom

### Evidence Checklist

- SOW / requirements source
- design doc
- architecture diagram
- security note
- cost / assumptions note
- DR / HA note
- ops / monitoring note

## 5. Requirements Extraction

### Goal

Allow architects to inspect and correct extracted requirements before findings are generated.

### Layout

- stepper at top
- table of extracted requirements
- details drawer on row click
- editable fields:
  - requirement text
  - source section
  - criticality
  - category
  - confidence
- action buttons:
  - accept
  - edit
  - merge
  - mark irrelevant

## 6. Evidence Mapping

### Goal

Show how design evidence maps to requirements.

### Layout

#### Left Panel
- requirements list

#### Center Panel
- matched evidence cards for selected requirement

#### Bottom Drawer
- source excerpts from uploaded files

### Match States

- matched
- partially matched
- not found
- ambiguous

## 7. Findings

### Goal

Provide the main working screen for architects and reviewers.

### Top Summary Strip

- total score
- recommendation badge
- critical blockers count
- missing evidence count
- open actions count
- workflow state

### Main Table Columns

- severity
- domain
- finding
- evidence found
- missing evidence
- recommendation
- Microsoft reference
- owner
- due date
- status

### Filters

- severity
- domain
- requirement gap
- missing evidence
- critical blocker
- review status

### Right Sticky Rail

- decision preview
- action summary
- export button
- assign owner button

## 8. Scorecard

### Goal

Make scoring transparent and drillable.

### Layout

#### Top
- overall score
- decision badge
- confidence indicator

#### Main Table
- review domain
- score
- reason
- linked findings count
- linked evidence count

Domains:
- requirements coverage
- security
- reliability
- performance
- cost
- operations
- governance
- documentation completeness

#### Secondary Visual
- radar chart

## 9. Decision Center

### Goal

Provide final reviewer decision workflow.

### Layout

- AI recommendation card
- reviewer recommendation section
- final decision form
- conditions list
- must-fix actions list
- sign-off log
- rationale notes

### Decision Actions

- approve
- approve with conditions
- needs improvement
- close review

## 10. My Reviews

### Goal

Act as a practical review queue.

### Table Columns

- project
- review type
- workflow state
- score
- reviewer
- blockers
- next milestone
- last updated

### Filters

- mine
- pending review
- needs action
- approved
- closed

## Interaction Rules

1. Do not show long AI prose by default.
2. Always show evidence and reference links near findings.
3. Keep reviewer actions visible and separate from AI outputs.
4. Keep PM action tracking available from findings and decision views.
5. Use stepper-driven navigation in the review workspace.

## MVP Wireframe Priority

### Must Design First

- Home
- Upload Review Package
- Findings
- Scorecard
- Decision Center
- Service Detail Page

### Can Follow Immediately After

- Requirements Extraction
- Evidence Mapping
- My Reviews
- Data Health additions

## Open UX Questions

- how much editing should architects have on extracted evidence vs only on extracted requirements
- whether PM action ownership is edited in findings or only in decision center
- whether the service detail page should expose review-check findings to anonymous users or only signed-in users
- how much export preview to show before generation
