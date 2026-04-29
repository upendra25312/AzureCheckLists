# `docs/` — Project Documentation Index

This folder holds architecture, product, and operational documentation for the Azure Review Dashboard. The repository's root [`README.md`](../README.md) is the operational source of truth for build and deployment; this folder contains everything else.

## Top-level contents

| File | Audience | What it covers |
|---|---|---|
| [`Azure_Review_Assistant_Design_Document_V1.0.docx`](./Azure_Review_Assistant_Design_Document_V1.0.docx) | Stakeholders, leadership | Formal V1.0 design document (Word format, 13 sections, 12 tables) |
| [`Azure-Review-Assistant-Documentation.md`](./Azure-Review-Assistant-Documentation.md) | Engineering, partners | Markdown product documentation — same scope as the V1.0 design doc, browseable on GitHub |
| [`architecture.md`](./architecture.md) | Engineering | Build-time and runtime architecture summary |
| [`project-package-commercial-fit.md`](./project-package-commercial-fit.md) | Pre-sales, commercial | Combined package workflow and pricing/regional extension plan |
| [`arb-design-review-checklist.md`](./arb-design-review-checklist.md) | Reviewers | Checklist used during ARB design review |
| [`AutomatedTestAndValidationRequirements.md`](./AutomatedTestAndValidationRequirements.md) | QA, engineering | Automated test and validation requirements |
| [`purpose.md`](./purpose.md) | All | Product purpose statement |

## Subfolders

### [`arb-agent/`](./arb-agent/) — ARB Agent design and prompts

| File | Purpose |
|---|---|
| [`technical-architecture-spec.md`](./arb-agent/technical-architecture-spec.md) | Target technical architecture for the ARB Agent workflow (Azure-native, Foundry, MCP) |
| [`delivery-plan.md`](./arb-agent/delivery-plan.md) | Phased delivery plan (Phase 0 foundation → Phase 6 production hardening) |
| [`arb-agent-system-prompt.md`](./arb-agent/arb-agent-system-prompt.md) | System prompt for the `ARB Agent` Foundry agent |

### [`ui/`](./ui/) — UI mockups and redesign plans

| File | Purpose |
|---|---|
| [`optimized-ui-mockup.html`](./ui/optimized-ui-mockup.html) | Static HTML mockup of the optimized layout |
| [`target-desired-ui-mockup.html`](./ui/target-desired-ui-mockup.html) | Static HTML mockup of the target desired layout |
| [`ui-ux-redesign-plan.md`](./ui/ui-ux-redesign-plan.md) | UI/UX redesign plan |
| [`ui-ux-redesign-implementation.md`](./ui/ui-ux-redesign-implementation.md) | Implementation notes for the redesign |

### [`samples/`](./samples/) — External example artifacts (not part of the product)

| File | Purpose |
|---|---|
| [`Trust_Bank_Azure_Landing_Zone_Diagrams_UKSouth_UKWest_v5.drawio`](./samples/Trust_Bank_Azure_Landing_Zone_Diagrams_UKSouth_UKWest_v5.drawio) | Sample landing-zone diagrams used as a customer-style example |
| [`Trust_Bank_Azure_Landing_Zone_HLD_UKSouth_UKWest_v5.docx`](./samples/Trust_Bank_Azure_Landing_Zone_HLD_UKSouth_UKWest_v5.docx) | Sample HLD |
| [`Trust_Bank_Azure_Landing_Zone_LLD_UKSouth_UKWest_v5.xlsx`](./samples/Trust_Bank_Azure_Landing_Zone_LLD_UKSouth_UKWest_v5.xlsx) | Sample LLD |

### [`assets/`](./assets/) — Documentation assets

| File | Purpose |
|---|---|
| [`logo.png`](./assets/logo.png) | Project logo |

## Related folders elsewhere in the repo

- [`../Architecture/`](../Architecture/) — Architecture pack (architecture-design, ARB-agent-under-60 plans, journey/product/user-service maps, executive presentation, technical implementation design)
- [`../deliverables/`](../deliverables/) — Stakeholder-facing deliverables (executive brief, Well-Architected Review, partner pitch deck, executive deck)
- [`../README.md`](../README.md) — Operational engineering README (deployment, secrets, role assignment, GitHub Actions)
