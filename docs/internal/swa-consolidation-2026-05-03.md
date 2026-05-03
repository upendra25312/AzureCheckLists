# Static Web App Consolidation Decision

Date: May 3, 2026

## Decision

Keep the `azure-review-checklists` Static Web App and remove the duplicate Static Web App.

The active production Static Web App is:

- Azure resource name: `azure-review-checklists`
- Default hostname: `https://jolly-sea-014792b10.6.azurestaticapps.net`
- Resource group: `Azure-Review-Checklists-RG`
- Source branch: `main`
- GitHub Actions workflow: `.github/workflows/azure-static-web-apps-jolly-sea-014792b10.yml`
- GitHub secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_JOLLY_SEA_014792B10`

## Evidence

The Azure portal screenshot supplied on May 3, 2026 shows `azure-review-checklists` as the selected Static Web App. Its Overview blade links the production URL to `https://jolly-sea-014792b10.6.azurestaticapps.net`, the source to `main (GitHub)`, and the workflow to `azure-static-web-apps-jolly-sea-014792b10.yml`.

The repository contains the matching workflow file and no `green-sky-0abfc0910` references.

The exported Azure resource list contains two Static Web App resources:

- `azure-review-checklists`
- `AzureReviewChecklists`

Only `azure-review-checklists` is documented as the active production SWA.

## Repository Alignment

No workflow rename is required. The live deployment path is already committed in the repository:

- keep `.github/workflows/azure-static-web-apps-jolly-sea-014792b10.yml`
- keep `AZURE_STATIC_WEB_APPS_API_TOKEN_JOLLY_SEA_014792B10`
- keep `jolly-sea-014792b10.6.azurestaticapps.net` as the documented product URL until a deliberate hostname migration is approved

## Azure Cleanup Action

Completed on May 3, 2026.

Deleted the duplicate Static Web App after confirming in Azure that it was not the live product:

```powershell
Remove-AzStaticWebApp -Name 'AzureReviewChecklists' -ResourceGroupName 'Azure-Review-Checklists-RG' -Confirm:$false
```

Post-delete verification showed only `azure-review-checklists` remaining in `Azure-Review-Checklists-RG`, with default hostname `jolly-sea-014792b10.6.azurestaticapps.net`, repository `https://github.com/upendra25312/AzureCheckLists`, and branch `main`.

The live product URL returned HTTP 200 after deletion.

Do not delete `azure-review-checklists`.

## Cost Reconciliation Note

The current deployed estate is broader than the original under-60 pilot design. The exported resource list includes Azure AI Search, Azure AI Document Intelligence, Azure AI Foundry, a Foundry project, Azure OpenAI, a dedicated Function App, Application Insights, and Storage. Actual cost reconciliation must include those resources and the active SWA SKU shown in the Azure portal.
