# Architecture Pack

This folder holds the project architecture pack for Azure Checklists.

## Included files

- [architecture-design.md](./architecture-design.md)
  - product purpose, design principles, target personas, platform shape, and deployment decisions
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
2. [executive-presentation.md](./executive-presentation.md)
3. [architecture-diagram.md](./architecture-diagram.md)
4. [technical-implementation-design.md](./technical-implementation-design.md)
