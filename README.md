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

## Local e2e testing

The most reliable local Playwright path in this repo is to test the exported site instead of `next dev`.

1. Build the static output:

   ```powershell
   npm run build
   ```

2. Start the export-aware local server on a fixed port:

   ```powershell
   npm run serve:export -- 3046
   ```

3. In another terminal, reuse that running server for Playwright:

   ```powershell
   $env:PORT=3046
   $env:PW_REUSE_SERVER=1
   npm run test:e2e:review-cloud
   ```

   Or for the admin diagnostics coverage:

   ```powershell
   $env:PORT=3046
   $env:PW_REUSE_SERVER=1
   npm run test:e2e:admin-copilot
   ```

Why this path is preferred:

- it avoids stale `next dev` chunk and module state
- it serves exported routes like `/review-package` through the same clean URLs used in production
- it avoids the flaky Windows teardown path seen when Playwright tries to own the web server lifecycle itself

## Local backend tests

The dedicated Functions package now includes a small Node built-in test suite for backend lifecycle regressions.

Run it from the repo root:

```powershell
npm run test:api
```

Current coverage includes the saved-review lifecycle edge case where an archived and then purged review must not resurface through the legacy Azure fallback state blob.

Recommended Static Web Apps build settings:

- App location: `/`
- Output location: `out`
- API location: leave blank when the Static Web App is linked to the dedicated Function App backend

## GitHub Actions deployment

This repo includes:

- [azure-static-web-apps-jolly-sea-014792b10.yml](./.github/workflows/azure-static-web-apps-jolly-sea-014792b10.yml) for the frontend
- [azure-functions-api.yml](./.github/workflows/azure-functions-api.yml) for the dedicated backend

Required repository secrets:

- `AZURE_STATIC_WEB_APPS_API_TOKEN_JOLLY_SEA_014792B10`
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_AZURE_REVIEW_CHECKLISTS_API`

If deployment fails with `No matching Static Web App was found or the api key was invalid`, refresh that secret from the target Azure Static Web App deployment token in the Azure portal.

The frontend workflow intentionally checks out the upstream `Azure/review-checklists` repository into `source-repo/` during CI so the dashboard can regenerate normalized data at build time without committing the upstream source into this repo.

The backend workflow deploys the `api/` Azure Functions package directly to the linked Function App. It currently uses the Azure Functions GitHub Action with a publish profile secret and enables remote build for the Flex Consumption plan.

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
- ensure the `arb-inputfiles` and `arb-outputfiles` blob containers exist
- create the Function App
- link the Function App to the Static Web App
- configure the low-cost cache and refresh settings
- configure the ARB Azure Table Storage setting used by `/api/arb/*`
- configure the ARB upload and reviewed-output container settings used by `/api/arb/*`

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
- `AZURE_STORAGE_ARB_INPUT_CONTAINER_NAME`
- `AZURE_STORAGE_ARB_OUTPUT_CONTAINER_NAME`
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

Optional frontend environment variables (set in the Azure Static Web App configuration or a `.env.local` file for local development):

- `NEXT_PUBLIC_ENABLE_GITHUB_AUTH` — GitHub sign-in is **enabled by default**; set to `false` to hide it from all sign-in prompts.
- `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` — Google sign-in is **disabled by default**; set to `true` to expose it. Requires a Google OAuth app configured in the Static Web App authentication settings.

Recommended defaults:

- `AZURE_STORAGE_REVIEW_CONTAINER_NAME=review-notes`
- `AZURE_STORAGE_REVIEW_ARTIFACT_CONTAINER_NAME=review-artifacts`
- `AZURE_STORAGE_COMMERCIAL_CACHE_CONTAINER_NAME=commercial-data-cache`
- `AZURE_STORAGE_ARB_INPUT_CONTAINER_NAME=arb-inputfiles`
- `AZURE_STORAGE_ARB_OUTPUT_CONTAINER_NAME=arb-outputfiles`
- `AZURE_COMMERCIAL_REFRESH_SCHEDULE=0 0 7 * * 1`
- `AZURE_COMMERCIAL_CACHE_TTL_HOURS=168`

The dedicated backend stores structured review records as JSON in Blob Storage, keeps commercial data in a separate blob-backed cache, writes uploaded ARB input files into `arb-inputfiles`, and writes reviewed output artifacts into `arb-outputfiles`. The ARB experience now lets users regenerate the reviewed output package after findings, actions, scorecard posture, or reviewer decision changes so the downloaded `.md`, `.csv`, and `.html` files stay current.

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

## Admin role assignment

The `/admin/copilot` route and `/api/admin*` APIs are protected by the `admin` role in `public/staticwebapp.config.json`.

Important operational detail:

- a normal signed-in user only has the built-in `anonymous` and `authenticated` roles
- route protection returning `403` does not prove admin access is fully configured
- an internal user must be explicitly granted the `admin` role in the target Static Web App before `/admin/copilot` can be validated end to end

Recommended validation sequence:

1. Sign in to the deployed site and confirm `/.auth/me` shows the expected account.
2. Open `/admin/copilot` and confirm the route is blocked with `403` before role assignment.
3. Assign the `admin` role to the internal user in the Static Web App.
4. Sign out and sign back in.
5. Re-open `/admin/copilot` and confirm the page loads and `/api/admin-copilot-health` returns `200`.

Portal path:

1. Open the target Static Web App in the Azure portal.
2. Go to `Settings` > `Role Management`.
3. Create an invitation for the internal Microsoft Entra account.
4. Enter the custom role name `admin`.
5. Have the recipient accept the invitation and sign in again.

Azure CLI option:

```powershell
az staticwebapp users invite \
   --name <static-web-app-name> \
   --resource-group <resource-group-name> \
   --authentication-provider AAD \
   --user-details <admin-user-email> \
   --roles admin \
   --domain <static-web-app-domain> \
   --invitation-expiration-in-hours 24
```

For GitHub-authenticated users, use `--authentication-provider GitHub` and supply the GitHub username as `--user-details`.

This role-assignment behavior matches Azure Static Web Apps role management guidance: signed-in users are only `authenticated` by default, and custom roles like `admin` must be granted explicitly.
