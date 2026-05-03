# Threat Model

Scope: Azure Review Assistant production deployment on Azure Static Web Apps, Azure Functions, Storage, AI Search, Document Intelligence, Azure OpenAI/Foundry, and Application Insights.

## Assets

- Uploaded architecture documents.
- Extracted text and evidence chunks.
- Review findings, scorecards, decisions, and exports.
- Reviewer identity and role assignments.
- API keys, deployment tokens, and Function App settings.
- Audit records.

## Trust Boundaries

- Browser to Static Web App.
- Static Web App to linked Function App.
- Function App to Storage, AI Search, Document Intelligence, Azure OpenAI/Foundry, and Application Insights.
- GitHub Actions to Azure deployment endpoints.
- Human reviewer to AI-generated draft content.

## STRIDE Summary

| Threat | Risk | Required Control |
|---|---|---|
| Spoofing | User claims reviewer/admin identity without authorization | Entra authentication, explicit SWA `admin` role assignment, route protection in `staticwebapp.config.json` |
| Tampering | Uploaded evidence or generated findings modified after review | Hash uploaded files, persist append-only audit records, store reviewer state separately from agent draft |
| Repudiation | Reviewer disputes a decision or override | Capture reviewer identity, timestamp, prior state, new state, and output hash |
| Information disclosure | Customer architecture documents exposed through public routes, logs, or exports | Protect review APIs, avoid logging document content, apply retention policy, keep local exports out of Git |
| Denial of service | Large uploads or repeated AI calls exhaust Functions, Document Intelligence, Search, or OpenAI quota | File size caps, request throttling, queue/backoff, token budgets, budget alerts |
| Elevation of privilege | Normal signed-in user reaches admin diagnostics or data operations | Keep `/admin/*` and `/api/admin*` restricted to `admin`; test signed-out and non-admin states |

## AI-Specific Threats

| Threat | Control |
|---|---|
| Prompt injection inside uploaded files | Treat uploaded text as evidence, not instructions; strip direct tool-use commands; rank system/developer instructions above evidence |
| Unsupported approval automation | Agent can recommend only; human reviewer must decide |
| Hallucinated finding or citation | Require evidence reference for high-severity findings and flag missing evidence |
| Sensitive data in model logs | Avoid sending unnecessary secrets or personal data; minimize prompt context |
| Retrieval poisoning | Preserve source ranking and content hashes for uploaded evidence and checklist records |

## Immediate Hardening Backlog

1. Add audit record schema and tests for reviewer state transitions.
2. Add file retention and deletion policy for uploaded evidence.
3. Add KQL alert for failed admin access and repeated AI failures.
4. Add dependency scanning and CodeQL in GitHub Actions.
5. Keep Azure portal exports and subscription-specific CSV files out of the public repo.
6. Replace or isolate the `xlsx` spreadsheet parser. `npm audit` reports high-severity SheetJS advisories with no upstream fix available for the current package line; until replaced, keep spreadsheet parsing constrained by file size limits and treat uploaded spreadsheets as untrusted input.
