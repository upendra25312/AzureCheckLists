# Product Definition

**Date:** 2026-04-29
**Status:** Authoritative. Supersedes prior identity statements. The four diverging documents have been updated to align with this memo on the same date.
**Prepared by:** Multi-disciplinary expert team (Cloud Architect; Senior Project Manager; Azure AI Expert; Senior Director, Cloud Solutions Architecture).
**Closes:** P0 finding from [`senior-architect-review-2026-04-29.md`](./senior-architect-review-2026-04-29.md) §3 ("Story coherence").

## The one-paragraph definition

> **Azure Review Assistant** is a project-scoped review workspace for Azure architects. It does two things: (1) it scopes a customer solution against the Azure review-checklists catalog with live regional availability and retail-pricing context, and (2) it takes uploaded architecture documents (HLD, LLD, diagrams, SOW) and produces a draft Architecture Review Board review — findings, scorecard, blockers, approval recommendation — that a human reviewer edits, overrides, or approves. The aim is to compress pre-ARB review time from weeks to under an hour while keeping the human in authority of the final decision.

This paragraph is the canonical statement. It is the right opening for the root README, any external-facing pitch, the Static Web App homepage hero, and the LinkedIn post.

## Why two surfaces, one product

The product has two complementary user surfaces sharing one codebase, one data plane, and one reviewer audience. They are not separate products and they are not competing — they are the input and output sides of the same review workflow.

| Surface | Primary routes | What it does | Typical input | Typical output |
|---|---|---|---|---|
| **Scoping workspace** | `/explorer`, `/services`, `/technologies`, `/review-package` | Helps the architect decide *what to design* by browsing the Azure checklist catalog with live regional fit and pricing | A loose set of customer requirements | A scoped service list with checklist decisions and notes, exportable as MD/CSV/HTML |
| **AI-assisted ARB review** | `/arb`, `/decision-center`, `/my-project-reviews` | Takes a *completed design* and produces a draft ARB review | Uploaded HLD, LLD, diagrams, SOW | Draft findings + scorecard + approval posture, exportable as MD/CSV/HTML/JSON |

The two surfaces share: the same checklist rule catalog, the same scorecard taxonomy, the same export pipeline, the same auth model. A user typically uses the scoping side at the start of an engagement and the ARB side at the end.

## What this product is not

These framings have surfaced in older docs and should not be used going forward:

- **It is not a "static checklist browser."** That undersells the AI-assisted review workflow, the Function App backend, and the live data integrations.
- **It is not a "multi-cloud governance platform."** The code is Azure-only. Multi-cloud framings (AWS / GCP cross-mapping in the WAR deliverable, "alliance partners" in the deliverables README) are *artifacts produced for* the product, not the product itself. They belong in the deliverables story but not in the product definition.
- **It is not a "generic AI assistant."** Scoring is deterministic code; AI is used selectively for synthesis. Framing it as a chatbot misrepresents how it works and undercuts the engineering credibility of the deterministic core.
- **It is not "Azure Checklists."** The repo name is a historical artifact. The product name is **Azure Review Assistant.** When the two are in tension, the product name wins.

## Audiences and their primary surface

| Audience | Surface they spend time in | What they get |
|---|---|---|
| Sales / pre-sales architect | Scoping workspace | First-pass service fit, region fit, and list pricing for an opportunity |
| Cloud architect | Scoping workspace + ARB review | Scoped solution at the start; AI-assisted review at the end |
| ARB reviewer | ARB review | Draft findings to edit/override; reduces review backlog |
| Engineering / platform team | ARB review | Self-service pre-review before formal ARB |
| Senior Director / Microsoft sponsor | Scorecard + executive summary export | Visibility into review backlog throughput and quality |

The *deliverables/* folder produces stakeholder artifacts (executive brief, WAR, pitch deck, executive deck) that **describe** the product to these audiences. The folder is not itself the product.

## Naming conventions to apply

| Where it appears | Use |
|---|---|
| Root README headline | "Azure Review Assistant" |
| Static Web App homepage hero | "Azure Review Assistant" |
| Internal documents | "Azure Review Assistant" (long form) or "ARA" (short form, after first use) |
| External pitch / LinkedIn | "Azure Review Assistant" |
| Repo / package / Bicep resource names | Existing names stay (`AzureCheckLists`, `azure-review-dashboard`, `arb-*`) — renaming these is a code change with deployment risk and is not justified by this memo |
| File and folder names containing `arb-agent-under-60` | Stay (they describe the Pilot tier's design lineage, see [`cost-narrative-reconciliation-2026-04-29.md`](./cost-narrative-reconciliation-2026-04-29.md)) |

## Scope boundaries (what is and is not in v1)

**In scope for v1:**
- Single-tenant Microsoft Entra ID auth on the Static Web App
- Upload + extract + AI-assisted review of architecture documents (PDF, DOCX, PPTX, TXT, MD)
- Deterministic scoring across the eight published domains
- Markdown / CSV / HTML / JSON export of the review package
- Live Azure regional availability and retail pricing context
- Reviewer override of any AI-generated finding
- Append-only audit trail of reviewer decisions
- Pilot tier deployment (under USD 60/month) and Production tier deployment (USD 500–700/month) — see cost reconciliation memo

**Out of scope for v1, deferred to later phases:**
- Multi-tenant / customer self-service
- Multi-cloud assessment (AWS, GCP) — the architecture pack discusses cross-mapping but the implementation is Azure-only
- OCR by default (Pilot tier explicitly excludes; Production tier supports via Document Intelligence on demand)
- Multi-reviewer collaboration with concurrent edit
- Workflow approval routing beyond single-reviewer sign-off
- GitHub / Azure DevOps PR-as-output (called out in the senior architect review §5 as a v2 direction)

## Decision log

- **2026-04-29:** Canonical identity adopted as "Azure Review Assistant — project-scoped review workspace for Azure architects." Two-surface framing (Scoping + ARB) replaces the prior three-identity drift. Multi-cloud framing in `deliverables/README.md` reclassified as a stakeholder artifact descriptor, not a product claim. Cross-references added on the same date to: root `README.md`, `deliverables/README.md`, `docs/architecture/architecture-design.md`.
- **Next review:** when the v1 scope boundaries above shift in either direction, or 2026-07-29, whichever is earlier.

## References

- [`README.md`](../../README.md) — root engineering README (operational source of truth; opening paragraph aligned with this memo on 2026-04-29)
- [`deliverables/README.md`](../../deliverables/README.md) — stakeholder deliverables index (framing aligned with this memo on 2026-04-29)
- [`docs/architecture/architecture-design.md`](../architecture/architecture-design.md) — architecture pack lead document (Section 2 "Product Positioning" aligned with this memo on 2026-04-29)
- [`docs/Azure-Review-Assistant-Documentation.md`](../Azure-Review-Assistant-Documentation.md) — V1.0 product documentation (already aligned)
- [`senior-architect-review-2026-04-29.md`](./senior-architect-review-2026-04-29.md) §3 — original P0 finding
- [`cost-narrative-reconciliation-2026-04-29.md`](./cost-narrative-reconciliation-2026-04-29.md) — companion P0 closure (cost narrative)
