# ARB Agent Delivery Plan

## Objective

Deliver an end-to-end Azure Architecture Review Board workflow that allows users to upload architecture documents, store them in Azure Storage, process them with Microsoft Foundry and Azure AI Search, and produce expert review outputs and scorecards.

## Delivery Principles

- deliver usable slices early
- prefer Azure-native services
- keep business labels friendly while enforcing Azure naming rules
- make each phase testable in isolation
- separate prototype concerns from production hardening

## Target Resources

### Core resources

- Azure Static Web App for frontend
- Azure Function App for API and orchestration
- Azure Storage account `arbfiles` or environment-specific variant
- Blob container `input-arb-files`
- Blob container `output-arb-files`
- Azure AI Search service
- Microsoft Foundry project
- Microsoft Foundry agent `ARB Agent`
- Azure Container Apps for remote Azure MCP Server if needed
- Application Insights

## Phase Plan

## Phase 0. Foundation and Provisioning

### Goals

- provision base Azure infrastructure
- validate naming, RBAC, and connectivity
- create secure deployment path

### Tasks

- create Azure Storage account
- create `input-arb-files` container
- create `output-arb-files` container
- create Azure Function App
- create Application Insights
- create Microsoft Foundry project
- provision Azure AI Search service using Free tier if available
- deploy or configure Azure MCP Server if required
- configure identities and RBAC

### Deliverables

- working infrastructure baseline
- deployment scripts or IaC
- environment configuration list

### Exit Criteria

- storage containers exist
- function app runs
- Foundry project exists
- Search service exists
- RBAC validated for required identities

## Phase 1. Upload Experience and Storage Persistence

### Goals

- expose visible upload option to end users
- persist uploaded files in Azure Blob Storage
- register uploads in metadata

### Tasks

- add `Create review` flow
- add upload UI for SOW and design documents
- add file validation and type checks
- upload files to `input-arb-files`
- store upload metadata in Azure Table Storage
- show upload and processing status in UI

### Deliverables

- upload page
- file upload API
- metadata persistence
- user-visible upload confirmation

### Exit Criteria

- end user can upload one or more files
- blobs land in `input-arb-files`
- metadata records are created successfully

## Phase 2. Extraction and Indexing

### Goals

- extract content from uploaded files
- index content in Azure AI Search
- support grounded retrieval for review analysis

### Tasks

- implement extraction pipeline
- chunk text with file lineage
- push chunks into Azure AI Search
- store indexing state per file and per review
- support retry for failed extraction/indexing

### Deliverables

- extraction worker or function
- indexing pipeline
- review status updates

### Exit Criteria

- uploaded files become searchable by review ID
- indexing state is visible to the system

## Phase 3. Foundry Agent Review Orchestration

### Goals

- invoke `ARB Agent`
- analyze the uploaded architecture package as a board of expert reviewers
- generate structured findings and approval posture

### Tasks

- define `ARB Agent` instructions
- connect retrieval from Azure AI Search
- connect Azure MCP tools where necessary
- pass review metadata and retrieved chunks into the agent
- parse and validate model outputs

### Deliverables

- agent definition
- invocation layer
- structured review result contract

### Exit Criteria

- agent successfully analyzes uploaded review data
- output includes findings, score, and recommendation

## Phase 4. Output Artifact Generation

### Goals

- generate downloadable output artifacts
- store output in a separate container

### Tasks

- create Markdown architecture review report
- create structured JSON review output
- create executive summary
- write output files to `output-arb-files`
- register artifact metadata and links

### Deliverables

- output generation pipeline
- blob persistence of generated reports
- output links surfaced in UI

### Exit Criteria

- output files are available in `output-arb-files`
- users can open or download them from the application

## Phase 5. Scorecard, Approval, and Review UI

### Goals

- make the review results usable by end users
- display findings, score, blockers, and approval posture

### Tasks

- add review queue
- add findings view
- add scorecard view
- add decision view
- surface blockers and missing evidence
- show generated outputs and timestamps

### Deliverables

- ARB review dashboard
- scorecard screen
- approval summary
- download links

### Exit Criteria

- users can see full ARB review outcome in the app

## Phase 6. Production Hardening

### Goals

- make the solution operationally ready
- improve reliability, observability, and security

### Tasks

- structured monitoring with Application Insights
- retry policy and dead-letter handling
- RBAC review
- Key Vault integration where needed
- audit logging
- cost guardrails
- performance tuning

### Deliverables

- operations runbook
- support diagnostics
- monitored production workflow

### Exit Criteria

- end-to-end processing is traceable and supportable

## Azure Resource Mapping

### Storage

- resource name: `arbfiles`
- containers:
  - `input-arb-files`
  - `output-arb-files`

### Search

- Azure AI Search Free tier for prototype if subscription capacity allows
- Basic tier fallback if Free is unavailable or insufficient

### Foundry

- Foundry project hosting `ARB Agent`
- retrieval-grounded review logic

### Orchestration

- Azure Functions for file registration, status, extraction, indexing, and agent orchestration

## Identity and RBAC Plan

### Function App identity

Needs access to:

- read and write blob content
- create and update review metadata
- invoke downstream services

### Foundry and MCP identity

Needs access only to required resources:

- storage read access for input artifacts
- storage write access only if output writing is routed through that layer
- any MCP tool access should be explicit and least privilege

## Testing Strategy

### Unit tests

- file metadata creation
- state transitions
- output contract validation

### Integration tests

- blob upload flow
- indexing flow
- Foundry agent invocation
- output generation flow

### Browser automation

- review creation
- file upload
- status progression
- scorecard display
- output download links

## Acceptance Criteria by Phase

### Minimum business success criteria

- end user sees upload option clearly
- uploaded files are stored in `input-arb-files`
- documents are indexed for grounded analysis
- `ARB Agent` reviews the uploaded files
- generated outputs are stored in `output-arb-files`
- review dashboard shows findings, score, and approval recommendation

## Risks

- Free Search tier may be too constrained
- Foundry and MCP features may differ by region and tenant capability
- poor source document quality may reduce extraction accuracy
- large files may require asynchronous processing and chunking constraints

## Assumptions

- Azure subscription permits Foundry, Search, Storage, and Functions provisioning
- one free Azure AI Search service is still available if Free tier is desired
- uploaded files are not blocked by regulatory constraints that require private network isolation in the first version

## Recommended Rollout Order

1. Provision infrastructure
2. Deliver upload and blob storage
3. Deliver extraction and indexing
4. Deliver Foundry review pipeline
5. Deliver output generation
6. Deliver review dashboard and approval UI
7. Harden for production

## Final Recommendation

Build this as a phased Azure-native workflow, with the first production milestone focused on upload, storage, indexing, Foundry review, output generation, and scorecard display. Keep advanced workflow governance and multi-reviewer orchestration for later phases.
