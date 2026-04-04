# Architecture Notes

## Current design

This dashboard is now built for Azure Static Web Apps Standard with a linked dedicated Azure Function App backend.

- Source of truth: `source-repo`, a local clone of `Azure/review-checklists`
- Build-time compiler: `tools/generate-data.mjs`
- Static artifacts: `public/data/*.json`
- Runtime state: browser memory plus `localStorage`
- Frontend hosting target: static export in `out/`
- Backend hosting target: Azure Function App on Flex Consumption

## Why this fits the current product shape

- The frontend stays static-first and cheap to host.
- The backend is a visible Azure resource in the portal, which improves trust for live pricing and live regional availability.
- Flex Consumption keeps the backend cost posture lean for bursty traffic.
- Weekly timer refresh plus blob-backed cache keeps the backend lean even when availability and pricing are sourced from Microsoft.
- Application Insights makes backend health explicit instead of hidden.
- All catalog interactions still work from prebuilt assets and browser APIs even if the live backend is degraded.

## Phase 1 data flow

1. The generator reads English checklist files from `checklists` and `checklists-ext`.
2. Sparse and inconsistent fields are normalized into a single dashboard model.
3. Technology-specific JSON files and a shared summary catalog are emitted to `public/data`.
4. Next.js statically exports overview and technology pages.
5. The browser loads local notes, filters, and theme settings from `localStorage`.

## Runtime API shape

The dedicated Azure Function App is responsible for:

- `/api/availability`
  - cache-first Azure regional availability
  - restricted and early-access region markers
  - global-service handling
- `/api/pricing`
  - cache-first Azure retail pricing
  - SKU, meter, and billing-location breakdown
- `/api/health`
  - backend health
  - scheduled refresh state
  - Application Insights and storage configuration status
- `/api/refresh`
  - optional admin-triggered cache warm-up
- `/api/review-records`
  - optional Azure-backed structured review persistence

## Guardrails

Keep these constraints in place:

- Do not move live pricing or availability into fake static placeholders once a real backend exists.
- Do not bypass the cache-first refresh pattern and reintroduce expensive live source calls on every page load.
- Do not add evidence upload or reviewer assignment as if it were multi-user ready.
- Do not introduce heavy SSR patterns for views that are already fully static.
- Do not make the Function App depend on frontend build artifacts at runtime.

## Related note

See [project-package-commercial-fit.md](./project-package-commercial-fit.md) for the project-scoped
package workflow and the regional plus commercial-fit model.
