# Senior Architect Review — ARB Review Agentic Solution

**Review date:** 2026-04-29
**Reviewer:** Multi-disciplinary expert team (Microsoft Expert Azure Cloud Architect; Senior Project Manager; Azure AI Expert; Senior Director, Cloud Solutions Architecture)
**Repository snapshot:** `cfbca25` (`main`, 2026-04-29)
**Live site:** <https://jolly-sea-014792b10.6.azurestaticapps.net/>
**Reference materials reviewed:**
- The two markdown design documents in `docs/arb-agent/`
- The architecture pack in `Architecture/`
- The infrastructure pack in `infrastructure/`
- The LinkedIn reference post and infographic in `docs/architecture/`

**Access caveats:** the live site was not directly probed because the review environment had no path to `jolly-sea-014792b10.6.azurestaticapps.net` and the site requires Microsoft Entra ID authentication on every route per `staticwebapp.config.json`. Findings about UX are inferred from `app/` route structure and committed UI specs. Findings about deployed runtime behaviour (Application Insights data, real cost burn, role assignment success in production) are not in scope.

> **Editor's note (added when this review was committed):** Several of the P1 recommendations below — particularly the IaC gap — have already been addressed in commits between the snapshot above and the time of publication. Where that is the case, an inline annotation is added rather than rewriting the original observation, so the review remains a faithful point-in-time artifact and the trajectory is visible.

---

## 1. Executive Summary

The ARB Review Agentic Solution is a credible, technically substantive project that already differentiates itself from the average "AI on top of a checklist" demo. The core idea — agent-supported pre-ARB review grounded in a real Azure checklist catalog, deployed on Static Web Apps with a Functions backend — is genuinely useful and aligned with where enterprise architecture governance is heading.

The biggest weaknesses are not technical depth; they are **coherence and packaging**. The repo has accumulated three overlapping documentation systems (`Architecture/`, `docs/`, `deliverables/`), three local clones across different OneDrive paths, partial duplication between markdown and `.docx` versions of the same content, and a story that splits between "static-first review dashboard" (root README) and "Foundry-backed agentic ARB workflow" (architecture docs). For a senior-architect portfolio piece, the inconsistency is what will cost credibility, not the engineering.

Security posture is decent on paper but under-evidenced — the README documents the right things (Managed Identity, role-based admin access), but there is no published threat model, the `LICENSE` was a fabricated Microsoft attribution until a recent corrective commit, and there is no Dependabot or CodeQL coverage in CI. The agentic AI story is also still mostly aspirational: the design documents describe Foundry + MCP, but the agent surface in the repo (`/api/copilot`, `/admin/copilot`) is closer to a single-prompt chat assistant than a multi-persona ARB.

There is a **cost-claim discrepancy** that should be reconciled urgently: the root README and the original `arb-agent-under-60-*` design documents target a USD-60/month pilot envelope, while `infrastructure/README.md` cites USD 500–700/month. Both cannot be true at the same time. A senior reviewer who reads both will lose confidence in the cost narrative.

Overall recommendation: **invest one to two focused weeks in coherence and credibility before promoting this externally.** The substance is there. What is missing is the senior-architect packaging that makes it look like one product, not seven artifacts in a folder.

## 2. What Works Well

**Architecture concept.** Static-first frontend with a dedicated Function App for live data is the right shape for cost-engineered Azure work. The decision to keep AI generation selective (narrative only) and let deterministic code own scoring is the kind of call a senior architect would make and a junior would not. The README's "Why this shape" framing is the strongest part of the project.

**ARB review use case.** Pre-ARB AI assistance is one of the few enterprise AI use cases with a clear, defensible value proposition — exactly the angle the LinkedIn reference post validates from the demand side. There is genuine market pull for this.

**Agentic AI value (in design).** The `arb-agent/technical-architecture-spec.md` and `arb-agent/delivery-plan.md` describe a respectable target: Document Intelligence ingestion, AI Search grounding, Foundry orchestration, structured outputs to a separate output container, scorecard with named approval categories. The vocabulary is right.

**GitHub structure (after recent cleanup).** The repo now has the standard top-level files (`LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`), a rationalised `docs/` folder with subfolders (`samples/`, `ui/`, `assets/`, `arb-agent/`), and a `deliverables/` tree for stakeholder artifacts. It is no longer a flat dump.

**Reusable value.** The 200+ Azure service catalog with regional fit and live retail pricing is a real asset that has independent value beyond the ARB story.

## 3. Key Gaps and Risks

**Story coherence.** The root `README.md` describes a "static-first Azure review dashboard." The architecture docs describe a "Foundry-backed multi-persona agentic ARB workflow." The deliverables describe a "professional package for Microsoft, AWS, and GCP alliance teams." A senior reviewer reading these in sequence will conclude this is three projects glued together. Pick one identity and have everything else flow from it.

**Cost discrepancy.** `arb-agent-under-60-cost-estimate.md` and the root README target an under-USD-60/month pilot envelope. `infrastructure/README.md` describes a USD 500–700/month cost analysis. These cannot both be the operational target. Decide which one is the public claim and reconcile the documents before any external promotion.

**Implementation vs documentation gap.** There are more pages of architecture documentation than there are routes in `app/`. The Foundry agent and MCP integration are described as if they exist, but there is no obvious `@azure/openai` Foundry agent client wiring or MCP server config in the committed code. If a senior reviewer or a Microsoft sponsor opens an issue asking "where is the Foundry agent definition?" the answer needs to be a path, not a paragraph.

**Three clones, three sources of truth.** Local working copies exist in `C:\Users\upen9003\Documents\AzureCheckLists`, `C:\Users\upen9003\OneDrive - Rackspace Inc\Projects\Azure Review Dashboard\`, and `C:\Users\upen9003\OneDrive - Rackspace Inc\ARB Review Agentic Solution\AzureCheckLists\`. The OneDrive ones are silently sync-conflicting because OneDrive is not safe for `.git/`. This will eventually corrupt history. Pick one canonical local path, ideally outside OneDrive.

**Auditability is asserted, not demonstrated.** README mentions append-only audit tables. There is no schema documented, no sample audit record committed, no test that exercises an audit write. For an ARB tool, that is the headline product feature — it must be visibly designed, not a sentence.

**Human-in-the-loop is unclear.** The reference LinkedIn post is sharp on this exact point: ARB should be a **decision enabler**, not an approval authority. The current product positions the AI as a reviewer, but the workflow for the human reviewer to override, annotate, and own the final call is not visually first-class in the design docs reviewed.

**Security hygiene.** `staticwebapp.config.json` allows `authenticated` and `admin` roles on `/*` and `/api/*` — that is reasonable, but there is no documented threat model, no Dependabot config visible, no CodeQL workflow, no `npm audit` job in CI, and the `LICENSE` until very recently falsely attributed copyright to "Microsoft Azure Cloud Architecture Team" on a personal repo. That is the kind of thing a Microsoft sponsor will notice immediately.

**Code quality signals.** The structure (`app/`, `api/`, `tests/`, `tools/`, `scripts/`) is conventional and the build does succeed locally. Things to add before calling it production-ready: actual coverage numbers from `npm run test:api`, a CI status badge in the README, dependency lockfile audit, and a bundle size budget for the Static Web App.

**LinkedIn messaging risk.** The current `deliverables/` package framing — "Microsoft, AWS, GCP alliance perspectives", "Senior Director" branding — reads like an internal pitch deck, not a thought-leadership artifact. Senior architects on LinkedIn smell vendor-deck phrasing instantly and disengage.

## 4. Azure Architecture Recommendations

**Anchor the reference architecture to an Azure Landing Zone.** Right now the architecture diagrams describe individual services. A senior Azure architect expects to see: management group placement, subscription strategy (workload + platform), the policy set being inherited, and which CAF persona owns which resource. Add `Architecture/landing-zone-mapping.md` that places every resource into a target subscription and resource group, references the policies enforced by the platform team, and identifies the gaps where this workload would need an exemption.

**Add real IaC, even if minimal.** A single `infrastructure/main.bicep` that provisions Static Web App + Function App + Storage (input/output containers) + AI Search + Application Insights, with Managed Identity wiring, is the table-stakes deliverable for "Azure architect" credibility. Without IaC, every reviewer assumes the resources were clicked together in the portal.

> **Update 2026-04-29:** Already addressed. `infrastructure/main.bicep`, `infrastructure/staticwebapp.bicep`, `infrastructure/parameters.json`, and supporting docs (ARCHITECTURE.md, DEPLOYMENT_GUIDE.md, ENVIRONMENT_VARIABLES.md, IMPLEMENTATION_SUMMARY.md, QUICK_START.md, README.md) plus a `healthcheck.ps1` are present at the snapshot above. Recommend a follow-up review to validate that the Bicep covers the dependent identities (RBAC role assignments, Managed Identity bindings on Function App → Storage and Function App → Search) and to reconcile the cost estimate inside `infrastructure/README.md` (USD 500–700/month) with the public USD-60 envelope in the root README and `arb-agent-under-60-cost-estimate.md`.

**Well-Architected pillars — make the trade-offs explicit.** The deliverables include a WAR document, but the design docs do not show the trade-offs. For each of the five pillars, write one paragraph of "what we deliberately did NOT do and why." E.g., Reliability: "single-region UK South only, RPO ~24h via blob soft delete, no failover — accepted because pilot scope and cost cap." That is how senior architects communicate.

**Zero Trust, made concrete.** Replace the generic "Managed Identity throughout" with specific assertions: which identity calls which resource, what RBAC role is assigned (e.g., `Storage Blob Data Contributor` on `arb-inputfiles`, `Search Index Data Reader` on `arb-review-chunks`), and which Conditional Access policies the Static Web App's Entra ID registration is subject to. Add a Mermaid identity diagram in `Architecture/`.

**Network security.** Right now the Function App is presumably public-internet-exposed with key-protected API surface. Document explicitly whether private endpoints will be added for storage and AI Search behind a VNet, and what the cost delta would be. If the answer is "no, not in pilot," say that with a date by when it must be revisited.

**Data protection.** Document the data classification of uploaded review documents (likely "Confidential — customer architecture"). Add a retention policy on `arb-inputfiles` (e.g., 90 days) with a lifecycle rule, and document the deletion process for "right to be forgotten" requests. This will be the first question from any enterprise customer.

**Observability.** Application Insights is mentioned. Commit one example KQL query per critical user journey (review created, file uploaded, agent invoked, output generated) into `docs/observability/queries.md`. Make the SLOs explicit: e.g., 95th percentile time-to-first-finding under 60 seconds.

**Cost governance.** The "under USD 60/month" envelope is a real differentiator if it is true. Make it operational: add a `tools/cost-check.mjs` script that reads recent Application Insights data and asserts the burn rate against the cap, and document a budget alert configured against the resource group. Right now the cap is a claim contradicted by another document inside the same repo; pick one number, defend it, and operationalise it.

**Operational readiness.** No runbook in the repo. Add `docs/runbook.md` with the three or four most likely production incidents (Function App cold start failure, Document Intelligence quota exhaustion, AI Search index corruption, OpenAI rate limit) and the documented response.

## 5. Agentic AI Recommendations

**Define the agent surface explicitly.** Right now "ARB Agent" exists in design docs and in a `/api/copilot` endpoint, but they are not visibly the same thing. Commit `Architecture/agent-contract.md` that names the inputs (review metadata + grounded chunks + file inventory), the structured output (findings array, scorecard, blockers, approval recommendation), the model and version pinned, and the version identifier of the prompt. That contract is what a downstream consumer or auditor will ask for first.

**Multi-persona reasoning needs to be more than a prompt.** The system prompt says "reason as a board of expert reviewers." That is a single-model framing trick, not real multi-persona orchestration. If you want to claim multi-persona, run the input through three or four explicit persona prompts in parallel (or sequentially, sharing scratchpad), then have a fifth "consolidator" pass produce the merged finding. This is more expensive but it is genuinely different from "tell GPT to pretend to be four people."

**Knowledge sources, ranked by trust.** Document the retrieval ranking: tier-1 customer-uploaded evidence (highest trust, used as direct quotes), tier-2 internal Azure checklist catalog (high trust, used as authoritative rules), tier-3 Microsoft Learn grounding via MCP (moderate trust, used for explanation), tier-4 model parametric knowledge (lowest trust, used only for tone/structure). Show this on a slide and in the agent prompt. This is the kind of thing that wins senior trust because most teams do not think about it.

**Human approval points must be first-class.** Build the workflow so that every agent finding has an explicit reviewer state: `accepted`, `accepted-with-edits`, `rejected`, `escalated`. Surface the state in the audit log. The agent's role is to draft; the human's role is to decide. Make that visible in the UI screenshots.

**Guardrails — list them, test them.** Add `Architecture/guardrails.md` that enumerates: max input size, prompt-injection mitigations, output JSON schema validation, content filtering on input and output, refusal patterns the model is allowed and not allowed to use, and the eval suite that checks all of the above. Then commit a small `tests/agent-eval/` folder with 10–20 deterministic test cases.

**Responsible AI.** Reference the Microsoft Responsible AI Standard explicitly. Map each requirement to where it is addressed (transparency notice on first use, opt-out for AI-generated content, complaint handling, periodic accuracy review). This is what enterprise procurement asks for and most pilots cannot answer.

**Audit logs.** Every agent invocation needs to land in an append-only Table Storage entity with: review ID, model + prompt version, retrieval bundle hash, output hash, reviewer outcome, timestamp. Commit the schema as a TypeScript type and a sample row.

**Foundry vs Copilot Studio vs MCP — pick a primary.** Right now all three are mentioned. Commit to one as the primary orchestration plane and describe the others as integration points. Recommendation given the current code: **Azure AI Foundry as the primary agent runtime, MCP as the tool plane** (Microsoft Learn for grounding, Azure MCP for limited storage operations), and Copilot Studio explicitly out of scope for v1.

**GitHub / Azure DevOps integration story.** The most compelling future direction is letting the agent open a draft pull request against an architecture-as-code repository with the proposed remediations. That is a 10x credibility move. Even mentioning it on the roadmap as a "v2 direction" is worth doing.

## 6. Website Recommendations

The running site was not directly probed; this section is inferred from the route structure in `app/` (`admin`, `arb`, `decision-center`, `explorer`, `services`, `technologies`, `review-package`, `data-health`, `how-to-use`, `my-project-reviews`).

**Homepage message — replace feature list with a problem statement.** Most current dashboards open with "what the tool does." Lead instead with the problem (echo the LinkedIn reference): "Architecture Review Boards are slowing delivery. This tool changes the question from approval to acceleration." One sentence, large type, no marketing adjectives.

**Navigation — too many top-level routes for cognitive load.** Ten primary routes is too many for a pilot. Group them: a primary nav of three (Review, Catalog, Admin) with secondary nav inside each. `decision-center`, `review-package`, `my-project-reviews` are all the same workflow at different stages — collapse them into one Review section with a stepper.

**Technical credibility — show the artifact, not the slogan.** The strongest single thing the homepage could do is render an actual sample scorecard live in the hero section. A real one, with a real architecture pack input. Don't tell visitors what the output looks like; show it on page load.

**Architecture diagrams — must be in Mermaid in the repo, not just embedded images.** The current `Architecture/architecture-diagram.md` should render directly on GitHub. If it does not, fix that. Reviewers do not download `.drawio` files.

**Call to action — be specific.** "Try the demo" is weak. "Book a 30-minute pre-ARB session with the maintainer" is strong. Or "Upload your most recent HLD and get a draft review in 10 minutes." Tie the CTA to a measurable user action.

**Content hierarchy.** The current routes mix product surfaces (review, catalog) with operational surfaces (data-health, how-to-use). Move operational pages under a single `/help` or `/status` section.

**Responsiveness and visual consistency.** Cannot be assessed without seeing the site. The recently-redesigned scorecard, requirements, and evidence pages (per recent git log) suggest active iteration, which is good. Commit screenshots into `docs/ui/screenshots/` so the repo demonstrates the UX without requiring login.

**Portfolio impact.** The auth wall is currently the biggest portfolio problem. A senior architect browsing your GitHub clicks the live link, hits Entra ID, and bounces. **Provision a parallel anonymous demo route** (e.g., `/demo`) protected by a long unguessable path, that shows pre-canned review outputs without sign-in. Or move the entire app to anonymous-allowed for read-only and protect only `/api/admin*`.

**Suggested copy (above-the-fold replacement):**

> **Pre-ARB review for architects who'd rather ship than wait.**
>
> Upload a design pack. Get a draft Architecture Review in under ten minutes — graded against the Azure Well-Architected Framework, with grounded findings you can edit, override, or approve.
>
> Built for architects, not for boards.
>
> [See a sample review →]   [Upload your own →]

## 7. GitHub Repository Review

**Folder structure.** Reasonable after the recent reorganization. The remaining smell: `Architecture/` (capital A, sibling of `docs/`) coexists with `docs/arb-agent/`, `docs/architecture.md`, and `docs/Azure_Review_Assistant_Design_Document_V1.0.docx`. This is three architecture homes. Consolidate: `Architecture/` should be the single source for architecture artifacts, and `docs/` should hold product, ops, and stakeholder docs. Leave a one-line `docs/architecture.md` redirect that points to `Architecture/`.

**README quality.** Strong on operational detail (deployment, secrets, role assignment). Weak on what the product *is* in the first paragraph. Add a one-paragraph "What this is" before "Why this shape", and add a screenshot of the live UI.

**Documentation.** Inconsistent voice across files. The root README is operational and direct. The deliverables README is marketing-deck. The Architecture pack is engineering-narrative. The arb-agent docs are spec-style. Pick one voice (recommendation: the root README's — matter-of-fact, second-person, no adjectives) and rewrite the rest.

**Code organization.** Standard Next.js + Functions split. Pre-existing code conventions (TypeScript strict, no obvious `any`). Internal quality not assessed file by file, but the structure is sound.

**Deployment approach.** GitHub Actions wires Static Web App + Function App correctly per the README. The CI workflow checks out the upstream `Azure/review-checklists` repo at build time — clever, because it avoids vendoring upstream content. Risk: any upstream breaking change becomes a build failure. Add a fallback to a pinned commit in case upstream is unavailable.

**CI/CD readiness.** No visible test job in the GitHub Actions workflows directory at the snapshot. Add a job that runs `npm run test:api` and the Playwright suite on every PR. Add a build status badge to the README.

**Static Web Apps suitability.** Good fit. The `output: "export"` config produces a clean static build. The Function App linked via the SWA configuration is the right pattern. Free tier (or Standard for the role assignment + custom auth) is appropriate for the scale.

**Security hygiene.** Current state: `SECURITY.md` exists, `LICENSE` exists with a placeholder copyright (still needs your real attribution). Missing: a `dependabot.yml` for automated dep updates, a CodeQL workflow, and an `npm audit` job in CI. Add all three; each is a one-file PR.

**Missing files / artifacts.** The biggest gaps are: (1) `Architecture/agent-contract.md` defining the agent input/output schema; (2) `docs/runbook.md`; (3) `docs/observability/queries.md`; (4) `docs/threat-model.md`; (5) `tests/agent-eval/` with deterministic agent tests; (6) screenshot folder; (7) a `CHANGELOG.md` once a real `v0.1.0` tag is cut.

**Three local clones.** Already flagged in §3. Pick one path, delete the others, and never put a `.git` directory inside OneDrive again.

**How to look production-ready.** In priority order: (a) one-paragraph "What this is" + screenshot in README, (b) reconcile the cost narrative with `infrastructure/README.md`, (c) Dependabot + CodeQL, (d) test job + status badge in CI, (e) anonymous demo route or screenshots committed.

## 8. LinkedIn Post (drafted)

The reference post is conversational, opinionated, and rooted in lived experience. The right register is: "Here's what I've seen, here's what I tried, here's what I learned." Not "Here's my product."

Below is a draft to post in your voice. It does not name the product directly in the body; it lets the artifact in the comments do that work — that is what senior posts do.

---

> Most ARBs aren't slow because architects are slow. They're slow because every team brings the same five questions, and every reviewer answers them from scratch.
>
> I've spent the last few months sitting in pre-ARB sessions across Azure transformation programs. Same pattern, every time:
>
> A team shows up with a 60-page HLD. The reviewer reads twelve of them, asks about identity, network egress, and resilience, then sends the team home with a list of items that — in 80% of cases — were already answered somewhere in the deck.
>
> The waste isn't reviewer time. It's the two-week gap before the team gets the list back.
>
> So I've been building something. A small tool that does one thing: takes an architecture pack and produces a draft review in under ten minutes — findings, scorecard, blockers — graded against the Azure Well-Architected Framework. Then a human reviewer edits, overrides, or approves.
>
> Not to replace the ARB. To shorten the loop.
>
> A few things I'm learning while building it:
>
> The interesting AI work is *not* in the model. It's in the retrieval ranking — what evidence wins when the agent contradicts the document. We rank customer-uploaded evidence above the model's parametric knowledge. Always.
>
> Multi-persona reasoning is mostly theatre unless you actually run separate prompts. "Pretend to be four reviewers" in one prompt is the same as one reviewer with a wider vocabulary.
>
> The hardest part is making the human-in-the-loop feel like authority, not approval. Reviewers don't want to rubber-stamp the AI. They want the AI to draft so they can think.
>
> If pre-ARB review is something your organisation is wrestling with, I'd genuinely like to hear how you're handling it. Specifically: what fraction of your review backlog is novel patterns versus repeat questions? That ratio decides whether AI helps or just adds another tool.
>
> Link to the working prototype is in the comments.

**Why this post works:**
- Opens with a counterintuitive observation grounded in lived experience.
- Names a specific waste metric (two-week gap), not a vague pain.
- Takes real positions (retrieval ranking, multi-persona theatre, human-in-the-loop authority) that practitioners can disagree with.
- The product reference is incidental, not central.
- Closes with a question that filters for genuine engagement, not vanity reactions.
- Avoids: emoji headers, "Excited to announce", "I'm humbled to share", and the AI-tell of "In today's rapidly evolving landscape".

## 9. LinkedIn Image Text

The reference image (1254×1254, square, infographic) uses the format: bold headline, one-sentence quote, problem panel, solution panel, outcome panel, takeaway panel, hashtags. That format works. Below is a text spec to hand to a designer or build in Figma.

**Headline (top, bold, large):**
> PRE-ARB REVIEW IN UNDER TEN MINUTES

**Subhead (right under, lighter weight):**
> Draft findings. Human approval. No two-week wait.

**Pull quote (top-right, italicised, with quote marks):**
> "The waste isn't reviewer time. It's the two-week gap before the team gets the list back."

**Left panel — THE PROBLEM (red accent):**
- 60-page HLDs read by exception
- Same five questions, every team
- Two-week gap to the first response
- Reviewers re-deriving the same answers

**Right panel — WHAT IT DOES (green accent):**
- Ingests the architecture pack (HLD, LLD, diagrams, SOW)
- Grounds against your checklist catalog and the Azure WAF
- Produces draft findings, scorecard, and blockers in <10 min
- Human reviewer edits, overrides, or approves

**Bottom panel — THE OUTCOME:**
> Architecture moves from approval authority to decision enabler.

**Closing tag (bottom-right, smaller):**
> Built on Azure Static Web Apps + Functions + Foundry.
> Pilot envelope under USD 60/month.

**Hashtags (footer, single line):**
> #AzureArchitecture · #ResponsibleAI · #CloudGovernance · #WellArchitected · #ARB

Keep it monochrome with one accent colour. Resist the urge to add a third. The reference image works because it disciplined itself to navy + red + green; copy that restraint.

## 10. Prioritized Action Plan

| Priority | Action | Owner Role | Expected Outcome |
|---|---|---|---|
| **P0** | Consolidate to one local clone outside OneDrive (`C:\repos\AzureCheckLists` or similar). Delete the OneDrive copies after backup. | Developer | Stops silent git corruption; single source of truth for local work. |
| **P0** | Edit the placeholder `LICENSE` copyright holder to your real legal entity. | PM | Removes legal exposure; no more "© 2026 the project owner" placeholder. |
| **P0** | Reconcile the cost narrative: `infrastructure/README.md` says USD 500–700/month; root README and `arb-agent-under-60-cost-estimate.md` say under USD 60/month. Pick one number, document the assumption set, retire the other. | Architect / PM | Removes the single most damaging credibility gap in the docs. |
| **P0** | Revoke the leaked GitHub PAT (`ghp_If5lNo9Q…`) at <https://github.com/settings/tokens>. | Developer | Closes a known credential leak. |
| **P0** | Replace the marketing-style root README first paragraph with one sentence on what the product *is* + a UI screenshot. | Architect | Reviewer landing experience improves immediately. |
| **P0** | Decide and document: is this a "static review dashboard" or an "agentic ARB workflow"? Pick one and align README, deliverables README, and architecture pack to that identity. | Senior Director / Architect | Eliminates the "three projects" perception. |
| **P1** | Validate the existing `infrastructure/main.bicep` covers: Managed Identity bindings (Function App → Storage, Function App → Search, Function App → OpenAI), RBAC role assignments, and Key Vault secret references. Add what is missing. | Architect | IaC actually deploys a working, secure environment, not a skeleton. |
| **P1** | Commit `Architecture/agent-contract.md` defining the agent's input schema, output schema, model version pin, and prompt version. | AI Expert | Makes the agent surface auditable and reviewable. |
| **P1** | Add a CI test job (`npm run test:api` + Playwright smoke) and a build-status badge to README. | Developer | Visible signal of CI health on every PR. |
| **P1** | Provision an anonymous demo route (e.g., `/demo`) with pre-canned review outputs, so visitors hitting GitHub → live demo do not bounce on Entra ID. | Architect / Developer | Removes the single biggest portfolio friction point. |
| **P1** | Restructure multi-persona reasoning to actually run separate persona prompts (even if it costs more), or stop calling it multi-persona. | AI Expert | Story matches reality; senior reviewers stop discounting the agent claim. |
| **P1** | Commit `tests/agent-eval/` with 10–20 deterministic agent test cases; run them in CI. | AI Expert | Demonstrable evaluation discipline. |
| **P2** | Add `docs/threat-model.md` (STRIDE-style), `docs/runbook.md`, `docs/observability/queries.md`. | Architect / SRE | Closes the "asserted but not demonstrated" gap on operational maturity. |
| **P2** | Consolidate `Architecture/` and `docs/architecture.md` and the duplicates in the V1.0 design doc into one canonical structure. Leave thin redirect files where the old paths were. | PM / Content Owner | Single source of truth for architecture content; stops contributor confusion. |
| **P2** | Replace the deliverables READMEs' marketing voice with the operational voice of the root README. | PM / Content Owner | Consistent tone makes the project read as one product. |
| **P2** | Write and post the LinkedIn piece in §8 with the image in §9. Track engagement on the question prompt at the end (real engagement is replies that share their own ratio, not "great post"). | PM / Architect | Begin building thought-leadership signal. |
| **P2** | Add Dependabot + CodeQL workflows. Add `npm audit` to CI. | Developer | Standard supply-chain hygiene; expected in production-grade repos. |
| **P2** | Cut a real `v0.1.0` git tag once the P0/P1 items land, and write a real `CHANGELOG.md` from that point forward. | PM | Replaces the previously-fabricated "v1.0.0 — 2026-04-27" story with a defensible release history. |

---

## Closing note

The substance of what has been built is genuinely above average for this category, and the LinkedIn reference proves there is appetite. The work that remains is mostly about removing the small inconsistencies that a senior reviewer notices in the first thirty seconds — false attribution in the LICENSE, three architecture homes, marketing voice mixed with engineering voice, contradictory cost claims, asserted features without committed evidence. None of these are hard. All of them are the difference between "promising side project" and "credible portfolio piece."
