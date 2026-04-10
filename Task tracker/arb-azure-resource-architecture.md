# ARB Azure Resource Architecture

Last updated: April 10, 2026

## Purpose

Define the recommended Azure resource architecture for the ARB capability.

## Recommended Resource Groups

- frontend and shared app shell resources
- dedicated backend and orchestration resources
- search and AI resources
- storage and diagnostics resources

## Core Services

### Frontend

- Azure Static Web Apps
- existing Azure Checklists frontend shell

### Backend And Workflow

- Azure Function App for APIs
- orchestration support for long-running extraction and findings jobs

### Storage

- Blob Storage for uploaded files and exports
- structured metadata store for reviews, findings, scorecards, actions, and audit events

### AI And Search

- Azure AI Document Intelligence or equivalent extraction layer
- Azure AI Search for grounding and retrieval
- Azure OpenAI for structured findings synthesis

### Diagnostics

- Application Insights
- Log Analytics if broader workspace visibility is needed

## Logical Flow

1. User uploads package through frontend
2. Files land in blob storage
3. Backend registers file metadata and review state
4. Extraction pipeline produces normalized artifacts
5. Search and rule layer ground findings
6. Findings and scorecard persist to structured store
7. Reviewer records decision and actions
8. Exports generated and stored as artifacts

## Security Recommendations

- private secrets in Key Vault
- managed identity for backend where possible
- scoped upload tokens for file upload flow
- role-based access for reviewer and admin operations
- audit logging for review and decision changes

## Networking Recommendation

For MVP:
- keep architecture simple unless customer data sensitivity requires stronger isolation
- use service-to-service auth and managed identity before introducing heavy network complexity

For hardened later state:
- private endpoints for storage, search, and Key Vault if needed
- controlled outbound and diagnostics routing if enterprise posture requires it

## Environment Recommendation

- Dev
- Test
- Prod

Keep shared scoring rules and curated references versioned and promoted between environments.

## MVP Resource Priority

Must have:
- Static Web App
- Function App
- Storage Account
- AI service(s) used for extraction and review
- search capability for grounded retrieval
- diagnostics

Can follow later:
- deeper network isolation
- richer admin environment split
- advanced review analytics workspace
