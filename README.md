# Azure Review Dashboard

Static-first Azure review dashboard built from the [Azure review-checklists](https://github.com/Azure/review-checklists) repository and designed for Azure Static Web Apps Free.

## Why this shape

- Build-time normalization keeps runtime hosting simple and cheap.
- Browser-only review notes avoid pretending v1 has enterprise persistence.
- Static JSON outputs keep the app fast, traceable, and easy to migrate later.

## Phase 1 delivered

- Build-time ingestion from `source-repo/checklists` and `source-repo/checklists-ext`
- Schema normalization with sparse-field handling and field provenance
- Executive overview with severity, maturity, and source distributions
- Checklist explorer with browser-side filtering
- Technology detail pages generated as static routes
- Item detail drawer with local review notes and source traceability
- Light and dark mode
- CSV and JSON export of filtered findings
- Browser persistence for theme, filters, and notes

## Phase 2 intentionally not implemented

- Authenticated reviewer workflows
- Multi-user saved review state
- Shared saved views
- Evidence upload services
- Strong RBAC and audit trails
- Backend persistence

These remain future enhancements so v1 stays realistic for Azure Static Web Apps Free.

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
- API location: leave empty for v1

## GitHub Actions deployment

This repo includes [azure-static-web-apps.yml](./.github/workflows/azure-static-web-apps.yml).

Before the workflow can deploy, add this repository secret:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`

The workflow intentionally checks out the upstream `Azure/review-checklists` repository into `source-repo/` during CI so the dashboard can regenerate normalized data at build time without committing the upstream source into this repo.

## Architecture

- `tools/generate-data.mjs` compiles source JSON into normalized artifacts under `public/data`.
- The homepage renders summary data at build time and loads the full catalog as static JSON.
- Technology pages are generated statically from `public/data/technology-index.json`.
- Review state is intentionally stored in `localStorage` only.

See [docs/architecture.md](./docs/architecture.md) for the deployment and migration model.
