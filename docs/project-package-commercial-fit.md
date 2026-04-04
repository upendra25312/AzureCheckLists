# Project Package and Commercial Fit

## Intent

The review workflow should move from a global catalog experience to a project-scoped package experience:

1. Create a named review package for a customer, workload, or solution.
2. Select only the Azure services in scope.
3. Record package decisions per finding:
   - `Include`
   - `Not Applicable`
   - `Exclude`
   - `Needs Review`
4. Export only the selected services and their notes.
5. Layer regional availability and commercial fit into the same package so the handoff reflects both architecture guidance and deployment reality.

## Why package scope comes first

Project notes should not be global. A finding that is `Not Applicable` for one customer solution might be critical for another.

The package model solves that by scoping:

- selected services
- reviewer notes
- evidence links
- exception rationale
- target regions
- future pricing assumptions

## Current package workflow

The current implementation adds a local-first package workspace:

- route: `/review-package`
- storage: browser `localStorage`
- active package selection
- service selection by service slug
- package-scoped notes from service and explorer views
- export in `CSV`, `Markdown`, and `Text`
- regional availability filtering tied to package target regions
- public retail pricing snapshot export for only the selected services

## Next phase: Regional + Commercial Fit

Regional and pricing data should be attached to the selected services inside a package, not copied into static checklist prose.

### Recommended data sources

- Azure Product Availability by Region
  - source of service + SKU availability by region
  - source of lifecycle states such as `GA`, `Preview`, and retiring variants
  - source of reserved-access (`*`) and early-access (`**`) region markers
- Azure regions list
  - source of public Azure region metadata
  - confirmation source for restricted regions such as `UAE Central`
- Azure region access request process
  - source for help text and support-request guidance when a region is restricted
- Azure Retail Prices API
  - authoritative programmatic source for commercial cloud retail pricing by service, SKU, and region
- Azure Pricing Calculator
  - linked as a drill-down tool for scenario refinement, but not used as the primary ingestion source

### Recommended service states

Every service should eventually show these states clearly:

- `GA`
- `Preview`
- `Retiring`
- `Restricted access`
- `Early access`
- `Unavailable`
- `Global / non-regional`

### Why this should not be one static price per service

Many Azure services are billed through multiple meters:

- base capacity
- requests
- data transfer
- throughput
- gateway or policy units

Because of that, the UI should show:

- a service price baseline
- pricing dimensions and meters
- package assumptions such as SKU, quantity, and target region
- monthly estimate snapshot for the current package

## Recommended rollout

### Phase 1

- package-scoped notes and exports
- selected services per package
- package decision states per finding

### Phase 2

- build-time ingestion of regional availability metadata
- service page section for region fit and access restrictions
- package target region filtering

Status:
- delivered as a first pass for service pages using Microsoft regional availability data
- delivered as a first pass for service pages and project packages using Microsoft retail pricing data
- quantity assumptions and monthly scenario rollups remain the next phase

### Phase 3

- package assumptions for quantity and usage
- monthly scenario estimates per selected service
- richer calculator-style rollups without losing per-meter traceability

## Guardrails

- Do not hardcode static regional availability into checklist text.
- Do not treat restricted regions as unavailable.
- Do not reduce complex service pricing to a single misleading “monthly price.”
- Do not merge project notes across packages.
- Do not present public retail pricing as customer-specific contract pricing.
