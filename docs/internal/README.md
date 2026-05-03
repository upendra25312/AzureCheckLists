# `docs/internal/` — Internal Wiki

Working notes, reviews, retrospectives, and decisions that the team needs but that are not part of the public-facing product documentation.

This folder is the project's lightweight internal wiki content that travels with the repo. The same content is also published to the [GitHub Wiki](https://github.com/upendra25312/AzureCheckLists/wiki) for browseable in-place editing. Use whichever surface fits — the canonical content lives here.

## Conventions

- **Date every document** in the filename: `<topic>-YYYY-MM-DD.md`. Internal documents are point-in-time artifacts; the date prevents confusion when a later commit makes earlier observations stale.
- **Write candidly.** Internal docs are for the team; sand off marketing language but do not soften technical critique.
- **Annotate stale claims rather than deleting them.** If a recommendation has been actioned, leave the original text and add an inline note (`> Update YYYY-MM-DD: addressed in commit <sha>`).

## Contents

| File | Purpose |
|---|---|
| [`product-definition-2026-04-29.md`](./product-definition-2026-04-29.md) | **Authoritative.** Canonical identity statement for the **Azure Review Assistant** product, scope boundaries, naming conventions, and rejected framings. Closes a P0 from the senior architect review (story coherence). |
| [`cost-narrative-reconciliation-2026-04-29.md`](./cost-narrative-reconciliation-2026-04-29.md) | **Authoritative.** Resolves the USD 60 vs USD 500–700 cost contradiction by separating the **Pilot tier** and **Production tier** as two intentional reference deployments. Closes a P0 from the senior architect review. |
| [`cost-reconciliation-run-2026-05-03.md`](./cost-reconciliation-run-2026-05-03.md) | PDCA record for the post-SWA-cleanup cost reconciliation attempt. Documents confirmed production state, attempted Cost Management API query, token blocker, and next authentication/action steps. |
| [`senior-architect-review-2026-04-29.md`](./senior-architect-review-2026-04-29.md) | Senior-architect-team review of the ARB Review Agentic Solution. Architecture, agentic AI design, website, GitHub readiness, and a LinkedIn thought-leadership draft. Source of the P0 findings closed by the two memos above. |

## Active Hardening References

| File | Purpose |
|---|---|
| [`../architecture/agent-contract.md`](../architecture/agent-contract.md) | Contract for the ARB agent input, output, reviewer states, retrieval trust order, and audit fields. |
| [`../threat-model.md`](../threat-model.md) | STRIDE threat model for the production Azure Review Assistant deployment. |
| [`../runbook.md`](../runbook.md) | Operator runbook for SWA deployment, Function API, AI review, extraction/search, and cost-spike incidents. |
| [`../observability/queries.md`](../observability/queries.md) | Application Insights KQL starter pack and initial SLOs. |

## Public visibility

This repo is **public**. Anything in this folder is publicly readable. The "internal" framing is a folder convention, not access control. If something needs true privacy, put it in a separate private repo.
