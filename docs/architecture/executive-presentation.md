# Azure Checklists Executive Presentation

## Slide 1. Title

### Azure Checklists

Project-scoped Azure solution review with live region fit, pricing context, and exportable design artifacts.

### Speaker note

The product is moving from a checklist catalog into a project review workspace for architects, pre-sales teams, and engineering stakeholders.

---

## Slide 2. The Problem

### Current customer problem

- Azure service guidance is spread across many checklist families and product pages.
- Architects need to know what belongs in the solution, where it can run, and what it might cost.
- Generic AI can answer questions, but it does not naturally produce a scoped project artifact.

### Speaker note

The gap is not just information access. The gap is turning requirements into something reviewable and exportable.

---

## Slide 3. The Product Purpose

### What this product should do

1. capture the services in a customer solution
2. validate regional availability and restrictions
3. surface public retail pricing
4. capture checklist decisions and notes
5. export a project-ready artifact

### Speaker note

This is a workflow product, not only a content product.

---

## Slide 4. Target Users

### Primary personas

- Sales Architect
- Pre-sales / Solutions Architect
- Cloud Architect
- Cloud Engineer
- Senior Director

### Speaker note

Each persona needs a different depth of detail, but they all need the same project scope.

---

## Slide 5. Product Differentiation

### Why this is better than generic AI

- project-scoped, not answer-scoped
- exportable, not conversational-only
- traceable, not opaque
- repeatable, not prompt-dependent
- grounded in Microsoft-backed availability and pricing data

### Speaker note

The strength is structure, memory, and reusable output.

---

## Slide 6. Current Architecture

### Platform shape

- Azure Static Web App for the frontend
- dedicated Azure Function App for live APIs
- Blob-backed cache
- Application Insights
- static build artifacts from the Azure review checklist source repo

### Speaker note

This gives us low cost, visible backend trust, and enough flexibility for future growth.

---

## Slide 7. Core User Flow

### Project review workflow

1. Start project review
2. Add services
3. Check region + cost matrix
4. Capture checklist notes
5. Export design artifact

### Speaker note

This is the experience that should dominate the product, not exploratory catalog browsing.

---

## Slide 8. Commercial and Regional Value

### Why users care

- region restrictions can block deals and designs
- retail pricing shapes the first commercial conversation
- architects need one place to record rationale and exclusions

### Speaker note

The value is highest when region fit, cost fit, and checklist decisions sit in the same project review.

---

## Slide 9. Trust Model

### Trust signals

- dedicated Function App visible in Azure
- cache-first live APIs
- backend health page
- exportable traceability

### Speaker note

We should keep making it obvious what is live, what is cached, and when it was last refreshed.

---

## Slide 10. Roadmap

### Near term

- strengthen the project review matrix
- improve quantity and usage assumptions
- tighten the first-run UX

### Later

- optional Azure-backed shared persistence
- role-aware summaries
- scoped project-review copilot

### Speaker note

The next phase is still workflow clarity, not feature sprawl.

---

## Slide 11. Success Measures

### Product success signals

- faster project review creation
- higher export usage
- more selected-service reviews vs full-catalog browsing
- lower abandonment before export
- faster first-value time for architects and pre-sales teams

### Speaker note

If users can move from requirements to export with less friction, the product is doing its job.

---

## Slide 12. Ask

### Recommended direction

- keep the static-first plus dedicated backend architecture
- continue pushing the UX toward project-first
- treat region fit + pricing + checklist export as the core value stream

### Speaker note

The product can beat a generic AI tool by being easier to finish real work with.
