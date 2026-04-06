# Azure Checklists Project Status

Last updated: April 5, 2026

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
| Public login and sign-in UX for save/export and personalized project review | Completed | Engineering / UX | High | Keep the sign-in entry points aligned with save, resume, and copilot actions so users understand when cloud persistence is being used |
| Automatic active project-review context retrieval for signed-in copilot sessions | Completed | Engineering / AI | High | Keep the Azure-saved active review state in sync so the backend can resolve copilot context automatically for signed-in users |
| Microsoft website sign-in for saved review continuity | Completed | Platform / Engineering | High | Keep Microsoft sign-in aligned with save, resume, export, and copilot continuity flows |
| Signed-in user identity chip and profile menu in the website UI | Completed | UX / Engineering | High | Keep the profile chip aligned with the signed-in provider and expose future quick actions from the same menu |
| Low-cost project review persistence using Azure Table Storage | Completed | Cloud / Engineering | High | Keep the Table Storage user/review index in sync with the Azure Blob review payloads |
| My Project Reviews list and resume experience | Completed | Engineering / UX | High | Use real saved-review usage data to tune archive, deleted, and restore guidance |
| Region + Cost + Checklist matrix in project review | Completed | Product / Engineering | High | Improve scanability and inline editing further |
| Service-level assumptions (`planned region`, `preferred SKU`, `sizing note`) | Completed | Engineering | Medium | Add suggested values from live pricing/region data |
| Regional availability support, including restricted-region handling like `UAE Central` | Completed | Engineering / Cloud | High | Keep validating mappings and status clarity |
| Pricing support using Azure retail pricing | Completed | Engineering / Cloud | High | Keep improving SKU clarity and cost explanation |
| Dedicated backend pattern: Static Web App + dedicated Function App + Insights | Completed | Cloud / Platform | High | Harden monitoring and admin diagnostics |
| Low-cost Function design with cache-first and scheduled refresh direction | Completed | Cloud / Platform | Medium | Fine-tune refresh cadence and cache visibility |
| Azure OpenAI `gpt-4.1-mini` deployment in `Azure-Review-Checklists-RG` / `Central US` | Completed | Cloud / AI Platform | High | Monitor usage and cost |
| Public Project Review Copilot using Azure OpenAI | Completed | Engineering / AI | High | Monitor mode quality and keep grounding explicit as usage broadens |
| Architecture documentation pack in GitHub `Architecture` folder | Completed | Architecture / Product | Medium | Keep updated as solution evolves |
| Data health and trust clarity in UI | Completed | Product / Engineering | High | Keep the trust copy aligned with the actual live, scheduled-cache, and fallback backend behavior |
| Multi-mode copilot design (`project-review`, `service-review`, `leadership-summary`) | Completed | AI / Engineering | High | Tune prompt quality and expand mode-specific coverage with real usage feedback |
| Admin copilot architecture using protected `/admin/copilot` | Completed | Engineering / Platform | High | Keep the protected admin shell read-only until MCP-backed tool execution is governed |
| Admin login and role-based access for `/admin/copilot` | Partially Complete | Platform / Security | High | Validate real admin role assignment and production access flows for internal users |
| Static Web Apps role protection for admin-only area | Completed | Platform / Security | High | Validate admin role assignment in the live Static Web App environment |
| Azure MCP / `azure-skills` integration for internal admin use | Planned | Platform / AI | Medium | Use Azure MCP for admin diagnostics, not public users |
| Foundry-agent + MCP architecture for future copilot | Planned | AI / Platform | Medium | Move from direct model calls to Foundry + MCP later |
| Service Review Copilot mode | Completed | AI / Engineering | Medium | Review answer quality on service-heavy prompts and add targeted regression coverage |
| Leadership Summary Copilot mode | Completed | AI / Engineering | Medium | Review executive-summary output quality with leadership-style examples |
| Internal admin diagnostics: resource inventory, Function config, App Insights, OpenAI checks | Partially Complete | Platform / Operations | High | Protected diagnostics now include runtime/config inventory plus operational evidence; remaining work is log-linked checks and live Azure resource evidence |
| Further first-time-user UX simplification | Partially Complete | UX / Product | High | Keep trimming onboarding copy, secondary-path emphasis, first-pass form density, and optional cloud-save clutter around the project review workflow; matrix assumptions now defer to the service drawer instead of staying inline |

## Overall Status

- `Completed`: core product workflow, live pricing and region context, exports, public copilot, Azure OpenAI deployment, architecture docs
- `Partially complete`: production admin access validation, log-linked and Azure-backed admin diagnostics
- `Pending`: Azure MCP integration, Foundry and MCP evolution
- `In progress`: deeper UX simplification around the project review flow, with onboarding, matrix assumptions, cloud save, exports, and pricing now progressively revealed
- `Recent stabilization`: Next.js file tracing is now pinned to the app root, removing parent-workspace lockfile warnings from builds and Playwright web-server startup

## Highest-Priority Next 5

1. Validate live admin role assignment and protected `/admin/copilot` access in production
2. Expand `/admin/copilot` diagnostics from runtime and refresh evidence into log-linked evidence and live Azure resource checks
3. Continue simplifying first-time user guidance so project review remains the dominant path, with the remaining focus shifting from matrix clutter to smaller follow-on polish and validation
4. Tune multi-mode copilot prompt quality with real project-review examples
5. Use saved-review activity data to refine archive, deleted, and restore guidance

## RAG Plan

| Milestone | Activity | Status | RAG | Target | Notes |
|---|---|---:|---:|---:|---|
| M1 | Core product positioning and UX reset | Completed | Green | Done | Homepage and workflow repositioned around project review |
| M1 | Project-scoped review workspace | Completed | Green | Done | Core solution/package concept is live |
| M1 | Scoped exports for selected services only | Completed | Green | Done | `CSV`, `Markdown`, and `Text` flow is in place |
| M1 | Public login and sign-in UX for save/export and personalized review | Completed | Green | Done | Sign-in entry points now use Microsoft while keeping local browsing available |
| M3 | Automatic active project-review context retrieval for signed-in copilot sessions | Completed | Green | Done | Signed-in users can save the active review state to Azure and let the backend resolve copilot context automatically |
| M4 | Microsoft website sign-in for saved review continuity | Completed | Green | Done | The UI now links only to Microsoft sign-in for cloud-backed save and resume flows |
| M4 | Signed-in identity chip and profile menu | Completed | Green | Done | The website shell now shows the signed-in email identity with quick navigation and sign-out actions |
| M4 | Azure Table Storage persistence for user profiles and project reviews | Completed | Green | Done | The app now uses Azure Table Storage for the low-cost user/review index and Blob Storage for the larger review payload |
| M4 | My Project Reviews list and resume flow | Completed | Green | Done | Signed-in users can search, archive, restore, soft-delete, recover, and permanently purge saved reviews |
| M1 | Region + Cost + Checklist matrix | Completed | Green | Done | Live in project review workflow |
| M1 | Service assumptions in review matrix | Completed | Green | Done | Planned region, preferred SKU, sizing note are available |
| M2 | Regional availability integration | Completed | Green | Done | Includes restricted-region handling like `UAE Central` |
| M2 | Retail pricing integration | Completed | Green | Done | Public retail pricing integrated into workflow |
| M2 | Dedicated backend architecture | Completed | Green | Done | Static Web App + dedicated Function App + Insights |
| M2 | Low-cost refresh and cache-first model | Completed | Green | Done | Directionally implemented and operationally aligned |
| M3 | Azure OpenAI `gpt-4.1-mini` deployment | Completed | Green | Done | Deployed in `Azure-Review-Checklists-RG` / `Central US` |
| M3 | Public Project Review Copilot | Completed | Green | Done | Live and grounded on project review context |
| M3 | Architecture documentation pack | Completed | Green | Done | Pushed into GitHub `Architecture` folder |
| M4 | Data health and trust clarity in UI | Completed | Green | Done | Live, scheduled-cache, and fallback states are now surfaced consistently in the public UI |
| M4 | Multi-mode copilot design | Completed | Green | Done | Backend and UI mode switching now support project-review, service-review, and leadership-summary |
| M4 | Service Review Copilot | Completed | Green | Done | Service-centric prompt mode is available in the public copilot |
| M4 | Leadership Summary Copilot | Completed | Green | Done | Leadership-summary prompt mode is available in the public copilot |
| M5 | Admin route protection via SWA roles | Completed | Green | Done | Static Web App route protection is defined for admin-only routes and APIs |
| M5 | Admin login and protected entry for `/admin/copilot` | Partially Complete | Amber | Short term | Protected admin entry exists; validate production admin role assignment and access behavior |
| M5 | `/admin/copilot` page and admin APIs | Completed | Green | Done | Protected admin page and health APIs are live as a read-only diagnostics shell |
| M5 | Admin diagnostics and ops checks | Partially Complete | Amber | Short term | Refresh-state and visible config inventory are live; deeper log evidence and live resource checks still need expansion |
| M6 | Azure MCP / `azure-skills` integration | Pending | Amber | Medium term | Use for internal admin workflows, not public site |
| M6 | Foundry-agent + MCP evolution | Pending | Amber | Medium term | Replace direct model call with richer governed agent pattern |
| M7 | Further simplification of first-time user UX | In Progress | Amber | Ongoing | The project review entry flow, first-pass setup, and optional cloud-save messaging are simpler now, but more clutter reduction is still needed across adjacent paths |

## RAG Summary

- `Green`
  - Core product foundation is in place and live.
  - Project review, scoped exports, regional fit, pricing, dedicated backend, Azure OpenAI deployment, and public copilot are all done.
- `Amber`
  - The product is functional and valuable, but still needs refinement to become truly polished and enterprise-ready.
  - Biggest amber areas are production admin access validation, deeper admin tooling, and first-time-user simplification.
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

- validate live admin access and role assignment
- deepen `/admin/copilot` diagnostics and evidence
- add recovery and operational safeguards around saved reviews

This gives the biggest jump in real usefulness without overcomplicating the public UX.
