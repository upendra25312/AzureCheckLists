# Azure Checklists Project Status

Last updated: April 4, 2026

## Project Tracker

| Activity | Status | Recommended Owner | Priority | Next Step |
|---|---|---:|---:|---|
| Website UX assessment and Microsoft-style review | Completed | Product / UX | High | Use as baseline for future design reviews |
| Executive feedback, scorecard, and formal review note | Completed | Product / Leadership | Medium | Reuse in stakeholder updates |
| Homepage positioning and product messaging refresh | Completed | Product / UX | High | Continue tightening copy and scanability |
| Project Review concept for solution-scoped work | Completed | Product / Engineering | High | Keep this as the main product workflow |
| Service selection tied to a specific project review | Completed | Engineering | High | Add faster selection aids and suggestions |
| Checklist note-taking per project with comments, owner, due date, evidence | Completed | Engineering | High | Add more guided note templates later |
| Scoped exports for selected services only (`CSV`, `Markdown`, `Text`) | Completed | Engineering | High | Add richer export formatting if needed |
| Public login and sign-in UX for save/export and personalized project review | Partially Complete | Engineering / UX | High | Add an explicit sign-in entry experience, clearer save/load messaging, and role-aware user guidance |
| Region + Cost + Checklist matrix in project review | Completed | Product / Engineering | High | Improve scanability and inline editing further |
| Service-level assumptions (`planned region`, `preferred SKU`, `sizing note`) | Completed | Engineering | Medium | Add suggested values from live pricing/region data |
| Regional availability support, including restricted-region handling like `UAE Central` | Completed | Engineering / Cloud | High | Keep validating mappings and status clarity |
| Pricing support using Azure retail pricing | Completed | Engineering / Cloud | High | Keep improving SKU clarity and cost explanation |
| Dedicated backend pattern: Static Web App + dedicated Function App + Insights | Completed | Cloud / Platform | High | Harden monitoring and admin diagnostics |
| Low-cost Function design with cache-first and scheduled refresh direction | Completed | Cloud / Platform | Medium | Fine-tune refresh cadence and cache visibility |
| Azure OpenAI `gpt-4.1-mini` deployment in `Azure-Review-Checklists-RG` / `Central US` | Completed | Cloud / AI Platform | High | Monitor usage and cost |
| Public Project Review Copilot using Azure OpenAI | Completed | Engineering / AI | High | Evolve to mode-based prompts and stronger grounding |
| Architecture documentation pack in GitHub `Architecture` folder | Completed | Architecture / Product | Medium | Keep updated as solution evolves |
| Data health and trust clarity in UI | Partially Complete | Product / Engineering | High | Make live vs cache vs fallback clearer in the UI |
| Multi-mode copilot design (`project-review`, `service-review`, `leadership-summary`) | Partially Complete | AI / Engineering | High | Implement mode switch in backend and UI |
| Admin copilot architecture using protected `/admin/copilot` | Planned | Engineering / Platform | High | Add `staticwebapp.config.json`, admin route, and stub APIs |
| Admin login and role-based access for `/admin/copilot` | Planned | Platform / Security | High | Add admin sign-in flow, role assignment, and protected entry screen for internal users |
| Static Web Apps role protection for admin-only area | Planned | Platform / Security | High | Add `admin` role protection and assign users |
| Azure MCP / `azure-skills` integration for internal admin use | Planned | Platform / AI | Medium | Use Azure MCP for admin diagnostics, not public users |
| Foundry-agent + MCP architecture for future copilot | Planned | AI / Platform | Medium | Move from direct model calls to Foundry + MCP later |
| Service Review Copilot mode | Planned | AI / Engineering | Medium | Implement service-specific prompt and payload |
| Leadership Summary Copilot mode | Planned | AI / Engineering | Medium | Implement executive-output prompt and payload |
| Internal admin diagnostics: resource inventory, Function config, App Insights, OpenAI checks | Planned | Platform / Operations | High | Build `/api/admin/copilot/health` and tool allowlist |
| Further first-time-user UX simplification | Planned | UX / Product | High | Reduce remaining complexity and make project review the dominant path |

## Overall Status

- `Completed`: core product workflow, live pricing and region context, exports, public copilot, Azure OpenAI deployment, architecture docs
- `Partially complete`: trust and health UX, multi-mode copilot design, public sign-in UX
- `Pending`: admin copilot, admin login protection, Azure MCP integration, Foundry and MCP evolution, deeper UX simplification

## Highest-Priority Next 5

1. Implement mode-based copilot backend for `project-review`, `service-review`, and `leadership-summary`
2. Add `staticwebapp.config.json` and protect `/admin/copilot` with `admin` role
3. Add explicit public sign-in UX for save/export and project personalization
4. Build `/admin/copilot` and `/api/admin/copilot/health`
5. Add clearer live, cache, and fallback trust indicators in the public UI

## RAG Plan

| Milestone | Activity | Status | RAG | Target | Notes |
|---|---|---:|---:|---:|---|
| M1 | Core product positioning and UX reset | Completed | Green | Done | Homepage and workflow repositioned around project review |
| M1 | Project-scoped review workspace | Completed | Green | Done | Core solution/package concept is live |
| M1 | Scoped exports for selected services only | Completed | Green | Done | `CSV`, `Markdown`, and `Text` flow is in place |
| M1 | Public login and sign-in UX for save/export and personalized review | Partially Complete | Amber | Short term | Sign-in exists in parts of the app, but the entry experience and guidance are still weak |
| M1 | Region + Cost + Checklist matrix | Completed | Green | Done | Live in project review workflow |
| M1 | Service assumptions in review matrix | Completed | Green | Done | Planned region, preferred SKU, sizing note are available |
| M2 | Regional availability integration | Completed | Green | Done | Includes restricted-region handling like `UAE Central` |
| M2 | Retail pricing integration | Completed | Green | Done | Public retail pricing integrated into workflow |
| M2 | Dedicated backend architecture | Completed | Green | Done | Static Web App + dedicated Function App + Insights |
| M2 | Low-cost refresh and cache-first model | Completed | Green | Done | Directionally implemented and operationally aligned |
| M3 | Azure OpenAI `gpt-4.1-mini` deployment | Completed | Green | Done | Deployed in `Azure-Review-Checklists-RG` / `Central US` |
| M3 | Public Project Review Copilot | Completed | Green | Done | Live and grounded on project review context |
| M3 | Architecture documentation pack | Completed | Green | Done | Pushed into GitHub `Architecture` folder |
| M4 | Data health and trust clarity in UI | Partially Complete | Amber | Short term | Exists, but still needs stronger user-facing clarity |
| M4 | Multi-mode copilot design | Partially Complete | Amber | Short term | Prompt and payload design complete, code implementation pending |
| M4 | Service Review Copilot | Pending | Amber | Short term | High-value next extension of current public copilot |
| M4 | Leadership Summary Copilot | Pending | Amber | Short term | Useful for directors and exec reviews |
| M5 | Admin route protection via SWA roles | Pending | Amber | Short term | Needs `staticwebapp.config.json` and admin role assignment |
| M5 | Admin login and protected entry for `/admin/copilot` | Pending | Amber | Short term | Needs admin sign-in experience and clear access boundary |
| M5 | `/admin/copilot` page and admin APIs | Pending | Amber | Short term | Best next internal capability |
| M5 | Admin diagnostics and ops checks | Pending | Amber | Short term | Resource inventory, config checks, logs, OpenAI verification |
| M6 | Azure MCP / `azure-skills` integration | Pending | Amber | Medium term | Use for internal admin workflows, not public site |
| M6 | Foundry-agent + MCP evolution | Pending | Amber | Medium term | Replace direct model call with richer governed agent pattern |
| M7 | Further simplification of first-time user UX | Pending | Amber | Ongoing | Still the main product-quality opportunity |

## RAG Summary

- `Green`
  - Core product foundation is in place and live.
  - Project review, scoped exports, regional fit, pricing, dedicated backend, Azure OpenAI deployment, and public copilot are all done.
- `Amber`
  - The product is functional and valuable, but still needs refinement to become truly polished and enterprise-ready.
  - Biggest amber areas are trust visibility, public sign-in clarity, admin tooling, and multi-mode copilot capability.
- `Red`
  - No major red items right now.
  - Nothing appears fundamentally blocked, but the admin and MCP path should not be exposed publicly until protected and properly scoped.

## Milestone Buckets

- `Milestone 1: Product foundation`
  - Completed
- `Milestone 2: Commercial and regional intelligence`
  - Completed
- `Milestone 3: AI-assisted public review`
  - Completed
- `Milestone 4: Smarter role-based copilot experience`
  - In progress / next
- `Milestone 5: Internal admin and operational intelligence`
  - Next
- `Milestone 6: Enterprise agent and MCP expansion`
  - Later

## Best Next Milestone

The strongest next milestone is `Milestone 4 + 5 combined`:

- implement multi-mode copilot
- improve public sign-in and save/export entry experience
- protect and launch `/admin/copilot`
- add admin diagnostics and health confidence

This gives the biggest jump in real usefulness without overcomplicating the public UX.
