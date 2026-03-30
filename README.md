# Azure Review  Dashboard

Static-first Azure review dashboard built from the [Azure review-checklists](https://github.com/Azure/review-checklists) repository and designed for Azure Static Web Apps with a lightweight managed API.

## Why this shape

- Build-time normalization keeps runtime hosting simple and cheap.
- Browser editing keeps the experience fast, while optional Azure-backed save and CSV export add a practical handoff path.
- Static JSON outputs keep the app fast, traceable, and easy to migrate later.

## Phase 1 delivered

- Build-time ingestion from `source-repo/checklists` and `source-repo/checklists-ext`
- Schema normalization with sparse-field handling and field provenance
- Executive overview with severity, maturity, and source distributions
- Checklist explorer with browser-side filtering
- Technology detail pages generated as static routes
- Item detail drawer with local review notes and source traceability
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
- API location: `api`

## GitHub Actions deployment

This repo includes [azure-static-web-apps.yml](./.github/workflows/azure-static-web-apps.yml).

Before the workflow can deploy, add this repository secret:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`

The workflow intentionally checks out the upstream `Azure/review-checklists` repository into `source-repo/` during CI so the dashboard can regenerate normalized data at build time without committing the upstream source into this repo.

## Azure-backed review records

To enable sign-in, structured note save, and CSV artifact download from the live UI, configure these application settings in Azure Static Web Apps:

- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_REVIEW_CONTAINER_NAME`
- `AZURE_STORAGE_REVIEW_ARTIFACT_CONTAINER_NAME`

Recommended defaults:

- `AZURE_STORAGE_REVIEW_CONTAINER_NAME=review-notes`
- `AZURE_STORAGE_REVIEW_ARTIFACT_CONTAINER_NAME=review-artifacts`

The managed API stores structured review records as JSON in Blob Storage and generates CSV only when the user clicks `Download CSV`.

## Architecture

- `tools/generate-data.mjs` compiles source JSON into normalized artifacts under `public/data`.
- The homepage renders summary data at build time and loads the full catalog as static JSON.
- Technology pages are generated statically from `public/data/technology-index.json`.
- Review state edits stay in `localStorage` by default and can optionally be saved to Azure Blob Storage through the managed API.

See [docs/architecture.md](./docs/architecture.md) for the deployment and migration model.
