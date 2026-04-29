# ARB Scoring Model

Last updated: April 10, 2026

## Purpose

Define the weighted scoring model for the AI-assisted Architecture Review Board capability.

## Scoring Principles

1. Scores must be explainable.
2. Scores must be traceable to evidence, findings, and Microsoft references.
3. Critical blockers can override numeric scores.
4. Missing evidence must reduce confidence and may force `Insufficient Evidence`.

## Weighted Score Domains

| Domain | Weight | What It Measures |
|---|---:|---|
| Requirements Coverage | 20 | Alignment between SOW / requirement package and design evidence |
| Security | 20 | Identity, network controls, secrets, boundary protection, logging |
| Reliability And Resilience | 15 | HA, DR, backup, RTO/RPO readiness, recovery design |
| Operational Excellence | 10 | Monitoring, runbooks, supportability, observability, deployment readiness |
| Cost Optimization | 10 | Assumption quality, FinOps controls, sizing discipline, cost guardrails |
| Performance Efficiency | 10 | Service fit, scaling model, bottleneck awareness, architecture fit |
| Governance / Platform Alignment | 10 | Landing zone fit, policy alignment, standards, platform controls |
| Documentation Completeness | 5 | Buildability, operational clarity, evidence completeness |

## Total Score

- maximum: 100
- minimum: 0

## Decision Bands

| Score Range | Recommendation |
|---|---|
| 90-100 | ARB Approved |
| 75-89 | Approved with Conditions |
| 50-74 | Needs Improvement |
| Below 50 | Not Ready For Review |

## Override Rules

### Critical Blocker Override

Any unresolved critical blocker can override the numeric score and force:
- `Needs Improvement`
- or `Insufficient Evidence` if the blocker is really a missing-evidence condition

### Missing Evidence Override

If evidence completeness is below the minimum review threshold, the review cannot be fairly scored as approved. Recommendation should move to `Insufficient Evidence`.

## Example Critical Blockers

- no identity model
- no security boundary for exposed workloads
- no backup or DR story where required
- unsupported region or compliance conflict
- no operational ownership for production system
- unresolved network exposure with no controls

## Scoring Method

Each domain should be scored from evidence and findings using:

- matched requirement coverage
- severity of findings
- missing evidence count
- deterministic rule failures
- reviewer overrides where needed

## Domain Rating Guidance

### 90-100 in a domain

- design strongly aligns with best practice
- evidence is explicit and sufficient
- no material issues remain

### 70-89 in a domain

- design is broadly acceptable
- some improvements are needed
- no severe blocker in that domain

### 50-69 in a domain

- notable gaps exist
- architecture requires corrective action
- confidence may be reduced

### Below 50 in a domain

- design is weak or under-evidenced
- major rework or evidence uplift needed

## Confidence Layer

Score must be shown together with confidence:

- High
- Medium
- Low

### Confidence Drivers

- evidence completeness
- extraction quality
- rule certainty
- reviewer confirmation

## Reviewer Requirements

Reviewers should be able to:

- inspect domain score rationale
- see linked findings behind each domain
- see evidence or missing-evidence basis
- override the recommendation with rationale

## MVP Recommendation

For MVP:
- implement domain weights as configuration
- store score rationale per domain
- store reviewer override separately from model output
- keep the score model simple and explainable before increasing sophistication
