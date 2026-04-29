# docs/archive

Files here are preserved for historical reference only. They are **not production code** and are not referenced by any build, workflow, or deployment process.

## Contents

| File | Original Location | Archived Date | Reason |
|---|---|---|---|
| `staticwebapp.config.DRAFT-2026-04-29.json` | `/staticwebapp.config.json` (repo root) | 2026-04-29 | Stale draft config that conflicted with the production config at `public/staticwebapp.config.json`. Root-level copy required global AAD auth on all routes, which contradicts the deployed config that allows public access to `/services`. Original renamed to `staticwebapp.config.ROOT-DRAFT-NOT-DEPLOYED.json` at repo root. |

## Production Config

The active Azure Static Web Apps configuration is:

```
public/staticwebapp.config.json
```

This file is copied into `out/` during `next build` (Next.js copies `public/` to `out/`) and is what Azure Static Web Apps reads when `app_location: "out"` is set in the GitHub Actions workflow.
