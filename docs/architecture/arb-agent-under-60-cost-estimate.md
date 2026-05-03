> **Cost claim notice (2026-04-29):** This document describes the **Pilot tier** ($25–60/month). The repo also documents a **Production tier** ($500–700/month) deployed by `infrastructure/main.bicep`. See [`../internal/cost-narrative-reconciliation-2026-04-29.md`](../internal/cost-narrative-reconciliation-2026-04-29.md) before quoting cost figures externally.

# ARB Agent Under 60 USD Cost Estimate

## 1. Budget Target

Target operating budget:

- less than 60 USD per month

This estimate assumes:

- low fixed-cost architecture
- moderate prototype or pilot usage
- text-first documents
- no default OCR
- no permanent Azure AI Search Basic tier

Status update as of May 3, 2026:

- this document remains the target low-cost design envelope
- it is not an accurate inventory of the currently deployed Azure estate
- the exported resource list in `docs/Azureresources azure review assistant.csv` shows Azure AI Search, Azure AI Document Intelligence, Azure AI Foundry, a Foundry project, Azure OpenAI, a dedicated Function App, Application Insights, Storage, and two Static Web App resources
- the active production Static Web App shown in the Azure portal is `azure-review-checklists` at `https://jolly-sea-014792b10.6.azurestaticapps.net`, using the `azure-static-web-apps-jolly-sea-014792b10.yml` GitHub Actions workflow
- the portal screenshot shows the active Static Web App SKU as `Standard`

## 2. Fixed-Cost Position

The design intentionally keeps fixed cost low by reusing services already in the solution and avoiding new always-on AI infrastructure.

## 3. Cost Components

### Blob Storage

Expected role:

- uploaded files
- generated outputs
- optional extracted text cache

Typical monthly expectation for a pilot:

- about 1 to 5 USD

### Table Storage

Expected role:

- review state
- findings
- scorecards
- actions

Typical monthly expectation:

- usually below 1 to 3 USD for low to moderate usage

### Azure Functions

Expected role:

- upload registration
- extraction
- scoring
- synthesis orchestration

Typical monthly expectation for a pilot:

- about 0 to 10 USD depending on execution volume

### Azure OpenAI

Expected role:

- synthesis
- leadership summary
- board-quality finding narrative

Typical monthly expectation for a low-volume pilot:

- about 10 to 35 USD

This remains the main variable cost driver.

### Microsoft Learn MCP

Expected role:

- selective grounding against current Microsoft guidance

Typical expectation:

- no material standalone platform cost in the architecture discussion, but it can increase overall execution overhead depending on invocation frequency

The practical budget rule is to use it selectively, not on every prompt turn.

## 4. What Was Explicitly Removed To Stay Under Budget

These items are excluded from the baseline design because they push the monthly floor upward:

- Azure AI Search Basic
- Foundry File Search as a default retrieval engine
- OCR by default
- always-on container orchestration for agent helpers
- multi-agent routing

This exclusion list describes the planned under-60 design, not the live deployed environment. The current resource export includes:

- `arb-review-search` as an Azure AI Search service
- `arb-document-intelligence` as an Azure AI Document Intelligence account
- `upend-mnkmx38y-swedencentral` as a Foundry account
- `azure-review-checklists-admin` as a Foundry project

Those services must be included in any actual monthly bill reconciliation.

## 5. Practical Monthly Ranges

### Conservative pilot

- Blob Storage: 1 to 2 USD
- Table Storage: under 1 USD
- Azure Functions: 0 to 3 USD
- Azure OpenAI: 10 to 18 USD

Estimated total:

- about 12 to 24 USD per month

### Active pilot

- Blob Storage: 2 to 3 USD
- Table Storage: 1 USD
- Azure Functions: 3 to 6 USD
- Azure OpenAI: 18 to 32 USD

Estimated total:

- about 24 to 42 USD per month

### Busy but still controlled usage

- Blob Storage: 3 to 5 USD
- Table Storage: 1 to 2 USD
- Azure Functions: 5 to 10 USD
- Azure OpenAI: 30 to 40 USD

Estimated total:

- about 39 to 57 USD per month

## 6. Cost Guardrails

To keep the design inside the budget, enforce these controls:

- limit review document count per submission
- cap maximum file size
- restrict supported formats to text-first documents in phase 1
- do not rerun full synthesis if the extracted evidence did not change
- cache Microsoft Learn grounding results when topics repeat
- compute rubric scores in code instead of the model
- write compact context packages instead of sending full extracted text back to the model

## 7. Trigger Points For Reassessment

Reassess the design if any of these become true:

- scanned documents become the default input type
- the team needs semantic search across a large review corpus
- many concurrent reviewers require long-lived searchable history
- model token usage becomes the dominant monthly cost

At that point, evaluate whether Azure AI Search Basic or a dedicated Foundry retrieval pattern is justified.

## 8. Bottom Line

The under-60 design is realistic if the team keeps retrieval mostly code-owned and uses Azure OpenAI for synthesis rather than for every stage of reasoning.

Recommended target range:

- 25 to 45 USD per month for normal pilot operation

Upper controlled ceiling:

- about 57 USD per month

For the current deployed environment, do not use the under-60 ceiling as the bill forecast until the duplicate Static Web App is removed and the AI Search, Document Intelligence, Foundry, Azure OpenAI, Function App, Storage, and Application Insights SKUs and usage are reconciled from Azure Cost Management.
