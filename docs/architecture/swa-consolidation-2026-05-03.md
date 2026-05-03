# Static Web App Consolidation Decision

Date: May 3, 2026

Canonical internal memo: `docs/internal/swa-consolidation-2026-05-03.md`

## Decision

Keep `azure-review-checklists` and remove the duplicate Static Web App.

Active production SWA:

- Resource: `azure-review-checklists`
- URL: `https://jolly-sea-014792b10.6.azurestaticapps.net`
- Branch: `main`
- Workflow: `.github/workflows/azure-static-web-apps-jolly-sea-014792b10.yml`
- Secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_JOLLY_SEA_014792B10`

## Cleanup

Completed on May 3, 2026.

Deleted only the duplicate `AzureReviewChecklists` Static Web App after Azure-side confirmation:

```powershell
Remove-AzStaticWebApp -Name 'AzureReviewChecklists' -ResourceGroupName 'Azure-Review-Checklists-RG' -Confirm:$false
```

Post-delete verification showed only `azure-review-checklists` remaining, connected to `https://github.com/upendra25312/AzureCheckLists` on `main`. The live `jolly-sea` URL returned HTTP 200.

Do not delete `azure-review-checklists`.

## Cost Note

The deployed environment includes AI Search, Document Intelligence, Foundry, Azure OpenAI, Functions, Storage, and Application Insights. Use Azure Cost Management for actual reconciliation rather than the original under-60 design target.
