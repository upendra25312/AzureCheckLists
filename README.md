# Azure Review  Dashboard

Static-first Azure review dashboard built from the [Azure review-checklists](https://github.com/Azure/review-checklists) repository and designed for Azure Static Web Apps with a dedicated Azure Function App backend.

## Why this shape

- Build-time normalization keeps the frontend fast and cheap.
- A dedicated Azure Function App provides visible, monitorable live APIs for regional availability, pricing, and health.
- The dedicated backend uses scheduled blob-backed cache so pricing and availability do not need to hit Microsoft sources on every request.
- Static JSON outputs still keep the catalog fast, traceable, and resilient when live APIs are unavailable.

## Phase 1 delivered

- Build-time ingestion from `source-repo/checklists` and `source-repo/checklists-ext`
- Schema normalization with sparse-field handling and field provenance
- Executive overview with severity, maturity, and source distributions
- Checklist explorer with browser-side filtering
- Technology detail pages generated as static routes
- Item detail drawer with local review notes and source traceability
- Project-scoped review workspace with selected services, package decisions, and CSV/Markdown/Text export
- Service-level regional fit using Microsoft region availability data, including restricted-region markers and non-regional service callouts
- Dedicated Azure Function App routes for live availability, live pricing, and backend health
- Weekly timer-trigger refresh plus cache-first HTTP APIs for low-cost commercial data
- Optional Azure-backed structured review record save and CSV export through the live UI
- Light and dark mode
- CSV and JSON export of filtered findings
- Browser persistence for theme, filters, and notes

## Still intentionally out of scope

- Multi-user workflow orchestration
- Shared saved views with collaboration features
- Evidence upload services
- Strong RBAC and audit trails
- Formal approval workflows

These remain future enhancements so the product stays honest as a review support tool.

## Local setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Ensure the Azure source repo is available at `./source-repo`.

3. Start the app:

   ```powershell
   npm run dev
   ```

## Build and deploy

```powershell
npm run build
```

Recommended Static Web Apps build settings:

- App location: `/`
- Output location: `out`
- API location: leave blank when the Static Web App is linked to the dedicated Function App backend

## GitHub Actions deployment

This repo includes:

- [azure-static-web-apps-jolly-sea-014792b10.yml](./.github/workflows/azure-static-web-apps-jolly-sea-014792b10.yml) for the frontend

Required repository secrets:

- `AZURE_STATIC_WEB_APPS_API_TOKEN_JOLLY_SEA_014792B10`

If deployment fails with `No matching Static Web App was found or the api key was invalid`, refresh that secret from the target Azure Static Web App deployment token in the Azure portal.

The frontend workflow intentionally checks out the upstream `Azure/review-checklists` repository into `source-repo/` during CI so the dashboard can regenerate normalized data at build time without committing the upstream source into this repo.

## Dedicated backend deployment

The dedicated backend is designed to run as:

- Azure Function App
- Flex Consumption plan
- `512 MB` instance memory
- `0` always-ready instances
- Application Insights enabled
- Blob-backed commercial cache
- Weekly timer-trigger refresh by default

Use [deploy-dedicated-function-backend.ps1](./scripts/deploy-dedicated-function-backend.ps1) to:

- upgrade the target Static Web App to `Standard`
- create the storage account
- create the Function App
- link the Function App to the Static Web App
- configure the low-cost cache and refresh settings

For Flex Consumption, the most reliable deployment path is currently Azure Functions Core Tools:

```powershell
cd api
func azure functionapp publish azure-review-checklists-api --javascript --no-build --force
```

## Azure-backed review records

The public UI is local-first and does not require sign-in. The dedicated backend can also persist review records and CSV artifacts. Configure these application settings in the Azure Function App:

- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_REVIEW_CONTAINER_NAME`
- `AZURE_STORAGE_REVIEW_ARTIFACT_CONTAINER_NAME`
- `AZURE_STORAGE_COMMERCIAL_CACHE_CONTAINER_NAME`
- `AZURE_COMMERCIAL_REFRESH_SCHEDULE`
- `AZURE_COMMERCIAL_CACHE_TTL_HOURS`
- `AZURE_AVAILABILITY_CACHE_TTL_HOURS`
- `AZURE_PRICING_CACHE_TTL_HOURS`
- `AZURE_COMMERCIAL_WARM_SERVICE_INDEX_URL`
- `AZURE_COMMERCIAL_WARM_SERVICE_LIMIT`
- `AZURE_COMMERCIAL_REFRESH_KEY` for the optional admin refresh endpoint
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_MODEL_NAME`
- `AZURE_OPENAI_API_VERSION`

Recommended defaults:

- `AZURE_STORAGE_REVIEW_CONTAINER_NAME=review-notes`
- `AZURE_STORAGE_REVIEW_ARTIFACT_CONTAINER_NAME=review-artifacts`
- `AZURE_STORAGE_COMMERCIAL_CACHE_CONTAINER_NAME=commercial-data-cache`
- `AZURE_COMMERCIAL_REFRESH_SCHEDULE=0 0 7 * * 1`
- `AZURE_COMMERCIAL_CACHE_TTL_HOURS=168`

The dedicated backend stores structured review records as JSON in Blob Storage, keeps commercial data in a separate blob-backed cache, and generates CSV only when the user clicks `Download CSV`.

## Architecture

- `tools/generate-data.mjs` compiles source JSON into normalized artifacts under `public/data`.
- The homepage renders summary data at build time and loads the full catalog as static JSON.
- Technology pages are generated statically from `public/data/technology-index.json`.
- Review state edits stay in `localStorage` by default and can optionally be saved to Azure Blob Storage through the dedicated Function App.
- Live data routes are served from the dedicated backend:
  - `/api/availability`
- `/api/pricing`
- `/api/health`
- `/api/copilot`
- `/api/refresh` for optional admin-triggered cache warm-up

See [docs/architecture.md](./docs/architecture.md) for the deployment and migration model.
See [docs/project-package-commercial-fit.md](./docs/project-package-commercial-fit.md) for the combined package workflow and the planned regional plus pricing extension.
See [Architecture/README.md](./Architecture/README.md) for the architecture pack, diagrams, roadmap, and exact implementation design.
