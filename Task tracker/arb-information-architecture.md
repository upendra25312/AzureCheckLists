# ARB Information Architecture

Last updated: April 10, 2026

## Purpose

Define the product information architecture for the AI-assisted Architecture Review Board capability within Azure Checklists.

## Product Shape

The platform should be structured into three major modes:

1. **Knowledge Hub**
2. **Review Workspace**
3. **Decision Center**

This separation avoids mixing lookup tasks with review workflow and governance decisions.

## Primary User Jobs

### Job 1: Lookup

Users want to quickly find:
- Azure service best practices
- region availability
- pricing context
- reference architectures

### Job 2: Review

Users want to upload a project package and receive:
- requirement extraction
- design evidence mapping
- findings
- scorecard
- action list

### Job 3: Decide

Users want to review:
- approval recommendation
- blockers
- conditions
- reviewer notes
- sign-off history

## Top-Level Navigation

Recommended top navigation:

- Home
- Knowledge Hub
- Review Workspace
- Decision Center
- My Reviews
- Data Health
- Admin

## Home Page Structure

### Primary Entry Cards

- **Knowledge Hub**
  - browse services
  - compare regions
  - inspect pricing

- **Start Review**
  - upload SOW and design package
  - begin ARB workflow

- **Resume Review**
  - continue active or saved reviews

### Secondary Utility Strip

- data freshness
- recent reviews
- latest guidance updates

## Knowledge Hub

### Purpose

Provide fast lookup and grounded Microsoft reference content.

### Recommended Views

- knowledge landing page
- service catalog
- service detail page
- region availability explorer
- pricing explorer

### Service Detail Page Tabs

1. Overview
2. Best Practices
3. Region Availability
4. Pricing
5. Reference Architectures
6. Review Checks

### Knowledge Hub Data Sources

- curated Microsoft guidance
- service metadata
- region availability dataset
- pricing dataset
- review-check mappings

## Review Workspace

### Purpose

Guide an architect through package upload, evidence mapping, review generation, and action planning.

### Stepper Flow

1. Upload Files
2. Extract Requirements
3. Map Design Evidence
4. Review Findings
5. Score And Decision
6. Export Package

### Core Screens

- upload screen
- requirements extraction screen
- evidence mapping screen
- findings screen
- scorecard screen
- export screen

## Decision Center

### Purpose

Provide governance-oriented review and sign-off views.

### Core Views

- recommendation summary
- blocker list
- action list
- reviewer comments
- sign-off history
- final decision state

## My Reviews

### Purpose

Provide a practical work queue of saved reviews.

### Columns

- project
- workflow state
- score
- reviewer
- open blockers
- last updated
- next milestone

## Data Health

### Purpose

Build trust in the platform by showing data and workflow freshness.

### Recommended Sections

- best-practice knowledge freshness
- region data freshness
- pricing data freshness
- review engine health
- extraction queue health
- fallback state if any

## Admin

### Purpose

Provide governance and operational controls.

### Admin Areas

- scoring weights
- rule packs
- curated references
- review templates
- user roles
- data refresh controls
- audit logs

## Cross-Cutting Concepts

### Evidence

Evidence must be available throughout the review flow and drillable from findings and scorecards.

### Actions

Actions should be first-class objects with:
- owner
- due date
- severity
- status
- source finding

### Confidence

Every review should carry confidence indicators derived from evidence completeness and extraction quality.

## Route Structure Suggestion

- `/`
- `/knowledge`
- `/knowledge/services`
- `/knowledge/services/[serviceId]`
- `/knowledge/regions`
- `/knowledge/pricing`
- `/reviews/new`
- `/reviews/[reviewId]`
- `/reviews/[reviewId]/requirements`
- `/reviews/[reviewId]/evidence`
- `/reviews/[reviewId]/findings`
- `/reviews/[reviewId]/scorecard`
- `/reviews/[reviewId]/decision`
- `/reviews/[reviewId]/export`
- `/my-reviews`
- `/data-health`
- `/admin`

## IA Rules

1. Do not mix general Azure lookup with review-specific findings on the same landing page.
2. Make the findings page the operational center of the review workflow.
3. Keep decisioning separate from analysis.
4. Preserve evidence traceability across all pages.
5. Ensure role-based visibility for reviewer-only actions and admin-only controls.

## MVP IA Recommendation

For MVP, prioritize:
- Home
- Knowledge Hub landing
- Service detail page
- Upload flow
- Findings page
- Scorecard
- Decision Center basic view
- My Reviews basic queue
- Data Health basic view
