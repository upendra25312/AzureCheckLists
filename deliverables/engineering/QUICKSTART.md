# Quick Start

Get the Azure Review Dashboard running locally in under 10 minutes.

## Prerequisites

- **Node.js 20+** — <https://nodejs.org/>
- **Git** — <https://git-scm.com/>
- **Azure Functions Core Tools v4** (only needed if you want to run the backend) — <https://learn.microsoft.com/azure/azure-functions/functions-run-local>

## 1. Clone and install

```bash
git clone https://github.com/upendra25312/AzureCheckLists.git
cd AzureCheckLists
npm install
```

## 2. Build-time data source

The dashboard normalizes data from the upstream Azure review-checklists repo at build time. CI handles this automatically. For local development you can either:

```bash
# Option A: clone the upstream catalog locally
git clone https://github.com/Azure/review-checklists.git source-repo
```

or skip this step — the build will still produce a usable dashboard with a smaller data set.

## 3. Run the frontend

```bash
npm run dev
```

This starts Next.js on **<http://localhost:3000>**.

Routes worth exploring:

- `/` — overview dashboard
- `/explorer` — checklist explorer with filtering
- `/services` — service catalog with regional and pricing data
- `/technologies` — technology catalog
- `/review-package` — local-first project review workspace
- `/decision-center` — reviewer decision flow
- `/arb` — full ARB review experience (requires backend for upload/AI features)
- `/data-health` — data freshness and source diagnostics
- `/how-to-use` — in-app guidance

The review-package, exports, and notes flows work entirely in the browser without the backend. Upload, extraction, and AI review require the backend (next step).

## 4. Optional: run the backend

```bash
cd api
npm install
func start
```

The Functions runtime listens on **<http://localhost:7071>**.

The backend needs Azure credentials in `api/local.settings.json`. See the README's "Azure-backed review records" section for the full list of expected application settings.

## 5. Run tests

```bash
# Backend lifecycle tests (Node built-in test runner)
npm run test:api

# End-to-end (Playwright) — uses the exported site, not next dev
npm run build
npm run serve:export -- 3046

# In another terminal:
$env:PORT=3046
$env:PW_REUSE_SERVER=1
npm run test:e2e:review-cloud
```

The README's "Local e2e testing" section explains why this path is preferred over Playwright's web-server lifecycle.

## Build for production

```bash
npm run build
```

This runs `npm run generate:data` followed by `next build` and outputs the static site to `out/`. Recommended Azure Static Web Apps build settings are documented in the README.

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails | Confirm Node.js 20 or higher (`node --version`). Delete `node_modules` and `package-lock.json`, then retry. |
| Port 3000 already in use | `npm run dev -- -p 3001` |
| `func` command not found | `npm install -g azure-functions-core-tools@4 --unsafe-perm true` |
| Backend won't start | Backend needs `api/local.settings.json` with valid Azure credentials. |
| `npm run build` fails on data generation | Either clone the upstream catalog into `source-repo/` (see step 2) or check `tools/generate-data.mjs` for the expected layout. |

## Where to go next

- **Architecture and deployment model** — [`docs/architecture.md`](../../docs/architecture.md)
- **Project package and commercial fit** — [`docs/project-package-commercial-fit.md`](../../docs/project-package-commercial-fit.md)
- **Architecture pack and roadmap** — [`Architecture/README.md`](../../Architecture/README.md)
- **Contributing** — [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
- **Live demo** — <https://jolly-sea-014792b10.6.azurestaticapps.net/>

---

**Last Updated:** 2026-04-29
