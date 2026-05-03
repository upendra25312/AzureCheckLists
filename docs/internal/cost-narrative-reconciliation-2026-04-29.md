# Cost Narrative Reconciliation

**Date:** 2026-04-29
**Status:** Authoritative. Supersedes any prior cost claim that conflicts with this document.
**Prepared by:** Multi-disciplinary expert team (Cloud Architect; Senior Project Manager; Azure AI Expert; Senior Director, Cloud Solutions Architecture).
**Closes:** P0 finding from [`senior-architect-review-2026-04-29.md`](./senior-architect-review-2026-04-29.md) §10.

## Summary

The repository documents two different cost numbers — **under USD 60/month** and **USD 500–700/month**. Both are correct. They describe **two different reference architectures**, not the same one. The previous absence of that distinction was the credibility problem, not either number.

## The two reference architectures

The project has converged on two intentional deployment targets that share the same frontend and code paths but differ in the data plane services they require.

### Tier 1 — Pilot ("Under 60")

The original `arb-agent-under-60-*` design family. Targets a personal or small-team pilot envelope.

- **Static Web App** — Free tier (USD 0)
- **Azure Functions** — Consumption (pay-per-execution; effectively USD 0–10/month at pilot volume)
- **Storage Account** — Standard LRS, small footprint (USD 1–5/month)
- **Table Storage** — review state, findings, scorecards (USD 1–3/month)
- **Azure OpenAI** — synthesis only, used selectively (USD 10–35/month)
- **Microsoft Learn MCP** — used as the grounding layer in place of Azure AI Search; no fixed cost
- **No Azure AI Search**
- **No Document Intelligence by default** (no OCR; text-first inputs only)
- **No always-on container or agent helpers**

Realistic monthly total: **USD 25–45**, ceiling **~USD 57**. Source: [`docs/architecture/arb-agent-under-60-cost-estimate.md`](../architecture/arb-agent-under-60-cost-estimate.md).

**Currently no IaC.** This tier does not yet have a Bicep template; resources would need to be provisioned manually or by a future `infrastructure/pilot.bicep`.

### Tier 2 — Production

The architecture described in [`infrastructure/ARCHITECTURE.md`](../../infrastructure/ARCHITECTURE.md) and provisioned by the existing [`infrastructure/main.bicep`](../../infrastructure/main.bicep). Targets a real customer-facing deployment with Retrieval-Augmented Generation across many documents.

- **Static Web App** — Standard tier (USD 99/month)
- **Azure Functions** — Consumption (USD 0–50/month)
- **Storage Account** — Standard LRS, ~1 TB capacity (USD 25/month)
- **Azure AI Search** — Standard SKU, replicas + partitions for RAG (USD ~300/month)
- **Application Insights** — pay-as-you-go, ~1 GB/month (USD 10–50/month)
- **Key Vault** — Standard (USD ~0.60/month)
- **Foundry Agent** — variable, USD 0.01–0.10 per invocation
- **Document Intelligence** — when OCR is required (per-page billing)

Realistic monthly total: **USD 500–700**, plus variable Foundry agent token cost.

The Bicep at `infrastructure/main.bicep` deploys Tier 2.

## Why both exist

| Concern | Tier 1 (Pilot) | Tier 2 (Production) |
|---|---|---|
| Audience | Personal demo, individual architect, small ARB pilot | Customer-facing, multi-team, persistent |
| Retrieval grounding | Code-owned + Microsoft Learn MCP (selective) | Azure AI Search RAG across many docs |
| Document scale | Tens of small text-first docs | Hundreds to thousands of mixed-format docs |
| OCR | Off by default | Available via Document Intelligence |
| Search | None — code-owned | Azure AI Search Standard with replicas |
| Concurrent reviewers | One to a few | Many |
| Compliance posture | Pilot-grade | Production-grade with Key Vault, full audit |
| Trade-off | Cheap; lower coverage; manual scaling | Expensive; full RAG; production support |
| Status of IaC | Not yet provisioned | `infrastructure/main.bicep` |

## What to communicate externally

The recommended public statement is:

> "The Azure Review Dashboard ships in two reference deployments. A pilot deployment runs under USD 60 per month and is suitable for individual architects or small ARB teams using text-first review inputs. A production deployment runs USD 500–700 per month plus variable Azure OpenAI usage, supporting RAG-grade retrieval across larger document corpora."

This sentence belongs in the root `README.md` at the top of any "Cost" section, and in any external-facing pitch material. Avoid repeating either number without naming which tier it refers to.

## Trigger points to move from Tier 1 to Tier 2

Reassess the deployment tier when any of these become true:

1. The team needs **semantic search** across an accumulated review corpus (a hundred or more reviews).
2. **Scanned documents** become a regular input type and OCR is required.
3. **Multiple concurrent reviewers** need long-lived searchable history.
4. **Token spend dominates** the bill, suggesting that better retrieval ranking with AI Search would reduce per-review cost.
5. A **customer agreement** requires a production-grade audit and compliance posture.

Below those triggers, Tier 1 is the correct choice and the cost narrative should defend it; above them, Tier 2 is the correct choice and the production cost should be quoted with confidence.

## Outstanding gaps to close

| Gap | Action | Owner |
|---|---|---|
| Tier 1 has no IaC | Add `infrastructure/pilot.bicep` (Free SWA, no AI Search, minimal storage, Function App on Consumption with Managed Identity) | Architect |
| Bicep only deploys Tier 2 | Make AI Search optional in `main.bicep` via parameter `enableSearch bool = true`; conditional resource creation | Architect |
| Cost claims still scattered across documents | Prepend a one-line cross-reference to this memo at the top of: `infrastructure/README.md`, `infrastructure/IMPLEMENTATION_SUMMARY.md`, `infrastructure/ARCHITECTURE.md`, `docs/architecture/arb-agent-under-60-cost-estimate.md` | PM |
| No live cost guardrail | Add a `tools/cost-check.mjs` that pulls the current month's actuals from Cost Management API and asserts against the active tier's ceiling. Wire to a budget alert in Azure. | Architect / SRE |
| `arb-agent-under-60-architecture.md` says "no Foundry File Search" but the broader architecture pack and `infrastructure/IMPLEMENTATION_SUMMARY.md` describe Foundry agent usage | Reconcile in a follow-up: state explicitly that Foundry agent **synthesis** is in scope for Tier 1 but Foundry **File Search retrieval** is Tier 2 only | Azure AI Expert |

## Decision log

- **2026-04-29:** Both architectures recognised as intentional alternatives rather than competing claims. Authoritative cost framing is "Pilot Tier 1: USD 25–60/month" and "Production Tier 2: USD 500–700/month." Cross-reference notes added to the four conflicting documents on the same date.
- **Next review:** when the first of the trigger points above is hit, or 2026-07-29, whichever is earlier.

## References

- [`docs/architecture/arb-agent-under-60-cost-estimate.md`](../architecture/arb-agent-under-60-cost-estimate.md) — Tier 1 cost detail
- [`docs/architecture/arb-agent-under-60-architecture.md`](../architecture/arb-agent-under-60-architecture.md) — Tier 1 architecture
- [`infrastructure/ARCHITECTURE.md`](../../infrastructure/ARCHITECTURE.md) — Tier 2 architecture
- [`infrastructure/IMPLEMENTATION_SUMMARY.md`](../../infrastructure/IMPLEMENTATION_SUMMARY.md) — Tier 2 cost model and operational summary
- [`infrastructure/main.bicep`](../../infrastructure/main.bicep) — Tier 2 IaC (currently the only IaC)
- [`senior-architect-review-2026-04-29.md`](./senior-architect-review-2026-04-29.md) §3, §10 — original P0 finding
