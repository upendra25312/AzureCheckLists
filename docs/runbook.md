# Operations Runbook

## Production Source Of Truth

- Static Web App: `azure-review-checklists`
- Production URL: `https://jolly-sea-014792b10.6.azurestaticapps.net`
- GitHub repo: `https://github.com/upendra25312/AzureCheckLists`
- Branch: `main`
- Frontend workflow: `.github/workflows/azure-static-web-apps-jolly-sea-014792b10.yml`
- Backend workflow: `.github/workflows/azure-functions-api.yml`

## Incident: Static Web App Deployment Fails

Symptoms:

- GitHub Actions workflow fails during build or deploy.
- Live site serves old content.

Checks:

1. Open the latest `Azure Static Web Apps CI/CD` run.
2. Confirm `npm ci`, `npm run build`, and `Azure/static-web-apps-deploy@v1` status.
3. Confirm secret `AZURE_STATIC_WEB_APPS_API_TOKEN_JOLLY_SEA_014792B10` exists.
4. Confirm Azure still has only `azure-review-checklists` in the resource group.

Recovery:

1. Fix build errors and push.
2. If token is invalid, rotate the SWA deployment token in Azure portal and update the GitHub secret.
3. Do not recreate the deleted duplicate SWA.

## Incident: Function App API Failure

Symptoms:

- `/api/health` fails.
- Review save/export, pricing, availability, or ARB APIs return errors.

Checks:

1. Review the latest `Azure Functions API CI/CD` workflow.
2. Check Function App logs in Application Insights.
3. Confirm Function App settings for storage, OpenAI, cache, and ARB containers.
4. Run `npm run test:api` locally or in CI.

Recovery:

1. Redeploy the API workflow.
2. Rotate or restore missing app settings.
3. If storage is unavailable, pause write-heavy workflows and preserve user-facing read-only paths.

## Incident: AI Review Fails Or Times Out

Symptoms:

- Agent review never completes.
- Findings are empty or malformed.
- OpenAI/Foundry returns throttling or quota errors.

Checks:

1. Confirm Azure OpenAI/Foundry endpoint and deployment settings.
2. Check token/request volume and throttling responses.
3. Validate output JSON schema before persistence.
4. Confirm retrieval bundle size is within budget.

Recovery:

1. Reduce prompt/context size.
2. Retry with backoff.
3. Fall back to deterministic checklist-only findings if AI is unavailable.
4. Record the failure in the review audit trail.

## Incident: Document Extraction Or Search Fails

Symptoms:

- Uploaded files do not produce evidence.
- AI Search returns no chunks.
- Document Intelligence reports quota or parsing errors.

Checks:

1. Confirm file type and size.
2. Check Document Intelligence quota and service health.
3. Confirm AI Search index exists and accepts writes.
4. Check storage containers for uploaded and extracted artifacts.

Recovery:

1. Requeue extraction for affected review.
2. Mark scanned/OCR-heavy files as unsupported in pilot mode if needed.
3. Rebuild the search index from stored extracted text when corruption is suspected.

## Incident: Cost Spike

Symptoms:

- Azure budget alert fires.
- AI Search, Document Intelligence, OpenAI, or Foundry cost rises unexpectedly.

Checks:

1. Query Cost Management by service and resource.
2. Check Application Insights for review volume and AI invocation count.
3. Confirm no repeated retry loop or large-file ingestion loop.

Recovery:

1. Disable expensive optional AI paths first.
2. Add temporary request caps.
3. Keep the production SWA online unless there is a security incident.
