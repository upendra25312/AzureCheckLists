# Cost Reconciliation Run

**Date:** 2026-05-03
**Status:** Partial. Azure resource cleanup is complete; actual Cost Management data is blocked by local token refresh failure.
**Prepared by:** Microsoft Expert Azure Cloud Architect; Senior Project Manager; Azure AI Expert; Senior Director, Cloud Solutions Architecture.

## Plan

Reconcile the deployed Azure estate after Static Web App consolidation:

1. Confirm the production Static Web App source of truth.
2. Confirm duplicate SWA cleanup.
3. Pull actual Cost Management data for the current month and previous month.
4. Compare actual spend against the Tier 1 pilot and Tier 2 production cost narratives.
5. Decide whether to keep the current AI-enabled estate or right-size toward the pilot envelope.

## Do

Completed:

- Deleted duplicate Static Web App `AzureReviewChecklists`.
- Verified the remaining Static Web App is `azure-review-checklists`.
- Verified default hostname `jolly-sea-014792b10.6.azurestaticapps.net`.
- Verified repository `https://github.com/upendra25312/AzureCheckLists`.
- Verified branch `main`.
- Pushed cleanup documentation to `main` in commit `65efac7`.
- Verified GitHub Actions run `25277834228` succeeded.
- Verified the live product URL returned HTTP 200.

Remaining deployed estate, based on Azure portal, Static Web App inventory, and the local resource export reviewed on May 3, 2026:

- Static Web App: `azure-review-checklists`
- Function App: `azure-review-checklists-api`
- App Service plan: `ASP-AzureReviewChecklistsRG-70d1`
- Storage account: `azreviewcheckapi01`
- Application Insights: `azure-review-checklists-api`
- Azure AI Search: `arb-review-search`
- Azure AI Document Intelligence: `arb-document-intelligence`
- Azure OpenAI: `azreviewchecklistsopenaicu01`
- Azure AI Foundry account: `upend-mnkmx38y-swedencentral`
- Azure AI Foundry project: `azure-review-checklists-admin`
- Shared dashboard and alerting resources

Attempted actual cost query:

```powershell
$scope = '/subscriptions/f609eb5b-df3e-4fab-9a1b-9a8fea2f157f/resourceGroups/Azure-Review-Checklists-RG'
$body = @{
  type = 'ActualCost'
  timeframe = 'MonthToDate'
  dataset = @{
    granularity = 'None'
    aggregation = @{
      totalCost = @{
        name = 'Cost'
        function = 'Sum'
      }
    }
    grouping = @(
      @{
        type = 'Dimension'
        name = 'ServiceName'
      }
    )
  }
} | ConvertTo-Json -Depth 10

Invoke-AzRestMethod -Method POST `
  -Path "$scope/providers/Microsoft.CostManagement/query?api-version=2023-11-01" `
  -Payload $body
```

Result:

- blocked by `SharedTokenCacheCredential authentication unavailable`
- `Get-AzAccessToken -ResourceUrl 'https://management.azure.com/'` also failed with token acquisition failure
- Azure CLI was not usable for Cost Management because its token cache is separate from Az PowerShell and had stale tenant/session state

## Check

Confirmed:

- SWA consolidation is complete.
- GitHub deployment is healthy.
- Production URL is healthy.
- No `green-sky` deployment remains in the resource group.

Not confirmed yet:

- Month-to-date actual cost by service.
- Previous-month actual cost by service.
- Forecast or end-of-month projection.
- Per-resource cost allocation for AI Search, Document Intelligence, Foundry, Azure OpenAI, Functions, Storage, App Insights, and SWA.

## Act

The next operational action is to refresh Azure authentication in the same execution context used for Cost Management queries, then rerun the actual-cost query.

Recommended command:

```powershell
Connect-AzAccount `
  -Tenant '5f51e0e9-4a52-494f-8068-27a3527967de' `
  -Subscription 'f609eb5b-df3e-4fab-9a1b-9a8fea2f157f'
```

After authentication succeeds, run these three reports:

1. Month-to-date actual cost by service at resource-group scope.
2. Previous-month actual cost by service at resource-group scope.
3. Month-to-date actual cost by resource at resource-group scope.

Decision rules:

- If actual monthly run-rate is within the approved production-tier budget, keep the current AI-enabled estate.
- If AI Search is the dominant fixed cost and there is no current RAG workload, downshift or remove AI Search first.
- If Document Intelligence has non-trivial spend and scanned documents are not in pilot scope, disable usage by workflow policy before changing infrastructure.
- If Foundry or Azure OpenAI variable cost dominates, add token budgets, request-size limits, and per-review cost telemetry before removing capability.
- If Application Insights spend is visible, set or confirm a daily cap.

No destructive cost-optimization changes should be made until actual Cost Management data is retrieved.
