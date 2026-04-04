# Architecture Notes

## Current design

This dashboard is built for Azure Static Web Apps Free, so the architecture is intentionally static-first.

- Source of truth: `source-repo`, a local clone of `Azure/review-checklists`
- Build-time compiler: `tools/generate-data.mjs`
- Static artifacts: `public/data/*.json`
- Runtime state: browser memory plus `localStorage`
- Hosting target: static export in `out/`

## Why this fits Static Web Apps Free

- No server-side persistence
- No custom API dependency in v1
- No private networking assumptions
- No enterprise RBAC or audit workflow hidden behind placeholders
- All core interactions work from prebuilt assets and browser APIs

## Phase 1 data flow

1. The generator reads English checklist files from `checklists` and `checklists-ext`.
2. Sparse and inconsistent fields are normalized into a single dashboard model.
3. Technology-specific JSON files and a shared summary catalog are emitted to `public/data`.
4. Next.js statically exports overview and technology pages.
5. The browser loads local notes, filters, and theme settings from `localStorage`.

## Future migration path

When shared workflows are needed, keep the normalized checklist contract and add services around it:

- Azure Static Web Apps Standard:
  add authentication plus minimal API endpoints for shared review state
- Azure App Service:
  add a lightweight web API for notes, evidence metadata, and saved views
- Azure Container Apps:
  add workflow orchestration, evidence processing, and audit pipelines

## Guardrails

Keep these constraints in place unless the hosting plan changes:

- Do not move review-note persistence to a fake server abstraction without a real backing store.
- Do not add evidence upload or reviewer assignment as if it were multi-user ready.
- Do not introduce heavy SSR patterns for views that are already fully static.

## Related note

See [project-package-commercial-fit.md](./project-package-commercial-fit.md) for the project-scoped
package workflow and the planned regional availability plus commercial-fit data layer.
