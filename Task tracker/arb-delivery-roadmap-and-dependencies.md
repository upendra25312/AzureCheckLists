# ARB Delivery Roadmap And Dependencies

Last updated: April 10, 2026

## Purpose

Define a practical delivery roadmap for the ARB capability and highlight key dependencies.

## Milestone 1: Product Definition And UX Foundation

Deliverables:
- scope and approval model
- workflow states and evidence gating
- information architecture
- UI wireframe specification
- role-based UX specification

Dependencies:
- agreement on MVP boundaries
- agreement on reviewer sign-off model

## Milestone 2: Data Contracts And Core Models

Deliverables:
- upload package schema
- requirement extraction schema
- evidence mapping schema
- findings and scorecard JSON models
- PM action model
- decision log schema
- audit schema

Dependencies:
- storage model confirmed
- frontend and backend DTO alignment confirmed

## Milestone 3: API And Backend Foundations

Deliverables:
- API contract
- backend function implementation plan
- async orchestration shape
- review storage model

Dependencies:
- Function App approach confirmed
- storage and auth approach confirmed

## Milestone 4: Rules, Grounding, And Scoring

Deliverables:
- deterministic rules catalog
- Microsoft reference catalog structure
- scoring model
- sample end-to-end review payload

Dependencies:
- curated Microsoft references agreed
- first-pass rules approved by senior reviewers

## Milestone 5: Frontend Implementation

Deliverables:
- route map and component breakdown
- upload screen
- requirements screen
- evidence mapping screen
- findings screen
- scorecard screen
- Decision Center screen
- My Reviews queue enhancements

Dependencies:
- API endpoints available
- JSON contracts stable enough for UI binding

## Milestone 6: Validation And Calibration

Deliverables:
- test fixture pack
- calibration plan
- reviewer agreement workshop
- score and blocker tuning

Dependencies:
- stable extraction and findings generation path
- reviewer availability for calibration

## Milestone 7: Pilot And Governance Hardening

Deliverables:
- pilot review packages
- audit and decision verification
- production readiness review
- go-live checklist

Dependencies:
- end-to-end workflow stable
- security and access controls validated

## Sequence Recommendation

Build order:
1. finalize product and UX foundations
2. lock data contracts
3. implement API and storage foundation
4. implement rules and scoring
5. build UI workflow
6. run calibration and pilot
7. harden and release

## Key Delivery Risks

- extraction quality is weaker than expected on real-world docs
- score trust breaks if evidence is not clearly shown
- reviewer workflow becomes too heavy if action management is weak
- reference catalog becomes noisy instead of curated

## Recommended Operating Cadence

- weekly architecture and product sync
- biweekly reviewer calibration review once sample outputs exist
- milestone-end readiness check before moving to pilot

## MVP Exit Criteria

- review package can be uploaded and processed end to end
- findings are structured and evidence-linked
- scorecard is explainable
- reviewer decision is captured with audit trail
- PM actions can be assigned and tracked
- at least one pilot package reviewed successfully
