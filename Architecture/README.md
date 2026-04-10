# Architecture Pack

This folder holds the project architecture pack for Azure Checklists.

## Included files

- [architecture-design.md](./architecture-design.md)
  - product purpose, design principles, target personas, platform shape, and deployment decisions
- [arb-agent-under-60-architecture.md](./arb-agent-under-60-architecture.md)
  - low-cost ARB agent target architecture using the current Azure OpenAI resource, storage, and selective grounding
- [arb-agent-under-60-implementation-plan.md](./arb-agent-under-60-implementation-plan.md)
  - phased delivery plan for implementing the low-cost ARB workflow in this repo
- [arb-agent-under-60-cost-estimate.md](./arb-agent-under-60-cost-estimate.md)
  - monthly cost envelope, cost drivers, and guardrails for staying under 60 USD
- [arb-agent-under-60-agent-prompt.md](./arb-agent-under-60-agent-prompt.md)
  - system prompt for a budget-constrained ARB review agent
- [executive-presentation.md](./executive-presentation.md)
  - executive-style presentation in Markdown format
- [architecture-diagram.md](./architecture-diagram.md)
  - solution architecture diagram and core data flows
- [user-service-map.md](./user-service-map.md)
  - persona-to-capability map
- [journey-map.md](./journey-map.md)
  - end-to-end user journey for project review
- [product-map.md](./product-map.md)
  - product surface map across pages, components, APIs, and exports
- [future-roadmap.md](./future-roadmap.md)
  - phased roadmap from current product to the next set of releases
- [technical-implementation-design.md](./technical-implementation-design.md)
  - exact implementation design tied to the current repo structure

## Scope

This architecture pack is based on the current Azure Checklists implementation:

- Frontend: Azure Static Web App / Next.js static-first experience
- Backend: dedicated Azure Function App
- Data sources:
  - Azure review checklist source repo
  - Azure Product Availability by Region
  - Azure regions list
  - Azure Retail Prices API
- Primary workflow:
  - start project review
  - add services
  - validate region fit and cost fit
  - capture checklist decisions and notes
  - export project artifacts

## Recommended reading order

1. [architecture-design.md](./architecture-design.md)
2. [arb-agent-under-60-architecture.md](./arb-agent-under-60-architecture.md)
3. [arb-agent-under-60-cost-estimate.md](./arb-agent-under-60-cost-estimate.md)
4. [arb-agent-under-60-implementation-plan.md](./arb-agent-under-60-implementation-plan.md)
5. [arb-agent-under-60-agent-prompt.md](./arb-agent-under-60-agent-prompt.md)
6. [executive-presentation.md](./executive-presentation.md)
7. [architecture-diagram.md](./architecture-diagram.md)
8. [technical-implementation-design.md](./technical-implementation-design.md)
