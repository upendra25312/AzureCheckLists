# ARB Agent Technical Architecture Specification

## Purpose

This document defines the target technical architecture for an Architecture Review Board solution that allows cloud engineers, cloud architects, pre-sales teams, and delivery leads to upload solution documents, store them in Azure, process them with Microsoft Foundry, and produce expert Architecture Review Board outputs.

The solution is designed to:

- accept user uploads such as SOW, HLD, LLD, architecture diagrams, migration plans, and cost inputs
- persist uploaded files in Azure Blob Storage
- index and ground document content using Azure AI Search
- invoke a Microsoft Foundry agent named `ARB Agent`
- allow the agent to use Azure MCP tools where appropriate
- generate expert review outputs
- store generated outputs in a separate Azure Blob container
- show review findings, scores, and approval posture in the application

## Business-Friendly Names vs Azure-Compliant Names

The requested business-facing names are:

- Storage account: `ARB files`
- Input container: `Input ARB Files`
- Output container: `Output ARB Files`

Azure platform rules require resource-safe names.

### Azure-compliant implementation names

- Storage account: `arbfiles` or `arbfiles<env><suffix>`
- Input container: `input-arb-files`
- Output container: `output-arb-files`

### User-facing labels

In the UI and business documentation, display:

- `ARB files`
- `Input ARB Files`
- `Output ARB Files`

## Target Users

- Cloud engineers
- Cloud architects
- Azure pre-sales architects
- Azure project managers
- Architecture Review Board participants
- Senior technical leadership

## Solution Goals

- make document upload easy for business and technical users
- keep file persistence durable and auditable in Azure Storage
- use grounded retrieval rather than unsupported free-form analysis
- produce expert Azure Architecture Review Board outputs
- separate input and output artifacts clearly
- support traceability, validation, and approval posture

## High-Level Architecture

The solution uses a web application plus an Azure-native document review backend.

### Core components

1. Frontend web application
2. Azure Blob Storage
3. Azure Functions or orchestration API layer
4. Azure AI Search
5. Microsoft Foundry project and agent
6. Azure MCP Server integration
7. Application Insights
8. Review state store and metadata store

## Azure Resources

### 1. Frontend Application

Use the existing Azure Static Web App frontend as the user entry point.

Responsibilities:

- create review
- upload files
- show processing status
- show review findings
- show scorecard
- show final recommendation and approval posture
- allow users to open generated output files

### 2. Azure Storage Account

Resource type:

- Azure Storage account, general-purpose v2

Suggested name:

- `arbfiles` for prototype
- `arbfilesprd01` for production-style naming

Required blob containers:

- `input-arb-files`
- `output-arb-files`

Recommended additional containers:

- `arb-processing-state`
- `arb-audit`

Responsibilities:

- store uploaded source files
- store generated output reports
- support retrieval by review ID
- persist correlation and artifact lineage

### 3. Review Metadata Store

Recommended:

- Azure Table Storage for lightweight metadata tracking

Optional future alternative:

- Azure Cosmos DB if workflow complexity grows

Entities to track:

- review record
- uploaded file record
- processing job record
- indexing status
- foundry execution status
- output artifact record
- scorecard record
- approval record

### 4. Azure Functions API Layer

Recommended responsibilities:

- create review records
- issue upload requests or SAS-based upload flow
- register uploaded files
- trigger ingestion pipeline
- track processing states
- invoke indexing pipeline
- invoke Foundry agent
- persist outputs
- expose review results to frontend

Suggested API surfaces:

- `POST /api/arb/reviews`
- `POST /api/arb/reviews/{reviewId}/files`
- `GET /api/arb/reviews/{reviewId}`
- `GET /api/arb/reviews/{reviewId}/files`
- `GET /api/arb/reviews/{reviewId}/status`
- `GET /api/arb/reviews/{reviewId}/scorecard`
- `GET /api/arb/reviews/{reviewId}/outputs`

### 5. Azure AI Search

Tier guidance:

- prefer Free for prototype if available
- fall back to Basic if Free is unavailable or insufficient

Important limits:

- Free tier supports only one free search service per subscription
- Free tier storage is limited
- Free tier has feature limits compared to Basic

Responsibilities:

- chunk document content
- store indexed reviewable content
- enable retrieval grounding for the Foundry agent
- support embeddings and semantic lookup where supported

Suggested logical indexes:

- `arb-review-documents`
- `arb-review-chunks`
- `arb-review-outputs`

Suggested searchable fields:

- reviewId
- customerName
- projectName
- fileName
- fileType
- chunkId
- sourcePath
- extractedText
- architectureArea
- serviceMentions
- risks
- recommendations

### 6. Microsoft Foundry Project

Use a Microsoft Foundry project hosting the agent named `ARB Agent`.

Responsibilities:

- orchestrate review reasoning
- use retrieved grounded document context
- use Azure MCP tool integrations where needed
- produce expert ARB output artifacts

### 7. Azure MCP Server

Use Azure MCP as a connected tool layer for Foundry.

Recommended namespaces for this solution:

- storage
- foundry
- optionally search if tool support is needed via an integration layer

Recommended hosting:

- remote self-hosted Azure MCP Server over HTTPS
- Azure Container Apps with managed identity

Responsibilities:

- inspect storage paths when needed
- access review artifacts securely
- allow controlled Azure operations from the agent

### 8. Application Insights

Required for:

- upload diagnostics
- processing diagnostics
- indexing diagnostics
- agent execution diagnostics
- output generation diagnostics
- trace correlation

## Processing Flow

### Step 1. Review Creation

The user creates a review and enters:

- customer name
- project name
- review title
- target regions
- optional architecture context

System actions:

- generate `reviewId`
- create metadata record
- set review status to `Created`

### Step 2. File Upload

The user uploads one or more files from the frontend.

Supported types can include:

- PDF
- DOCX
- PPTX
- XLSX
- PNG
- JPEG
- SVG
- VSDX
- TXT
- Markdown

System actions:

- write uploaded files to `input-arb-files`
- create upload metadata record for each file
- record uploader identity and timestamp
- set file processing state to `Uploaded`

### Step 3. Ingestion and Extraction

An ingestion function or orchestration step processes newly uploaded files.

Responsibilities:

- extract text from documents
- classify document type
- split content into chunks
- preserve file-to-chunk lineage
- store extraction status

### Step 4. Indexing into Azure AI Search

System actions:

- generate searchable chunks
- create embeddings if enabled in the selected design
- push content into AI Search indexes
- tag chunks with review and source metadata
- mark indexing state complete

### Step 5. Foundry Agent Review

The `ARB Agent` receives:

- review metadata
- list of uploaded files
- grounded retrieval results from Azure AI Search
- optional Azure MCP tools

The agent analyzes the architecture as a composite Architecture Review Board.

### Step 6. Output Generation

The agent generates:

- architecture review report in Markdown
- structured JSON output
- executive summary
- scorecard and approval posture

System actions:

- write output files to `output-arb-files`
- register generated artifacts in metadata
- update review state to `Completed`

### Step 7. Review Visualization

Frontend shows:

- upload inventory
- processing status
- findings
- blockers
- score
- recommendation
- output download links

## ARB Agent Review Model

The `ARB Agent` must act as a board of expert reviewers rather than a single assistant.

### Personas

- Azure expert cloud architect
- Azure senior director
- Azure senior project manager
- Azure pre-sales architect

### Review lenses

- architecture fitness
- Azure Well-Architected alignment
- security and governance
- identity and networking
- platform operations and observability
- resiliency and disaster recovery
- cost and commercial posture
- delivery feasibility
- implementation risk
- documentation completeness

## Scoring Model

Required scoring dimensions:

- Architecture completeness
- Security and compliance
- Reliability and resilience
- Operational readiness
- Cost and commercial fit
- Governance and controls
- Delivery feasibility
- Documentation quality

Each dimension should produce:

- score
- rationale
- linked evidence
- blockers if any

Final outputs:

- overall score from 0 to 100
- blocker count
- missing evidence count
- approval posture

## Approval Categories

- `Approved`
- `Approved with Conditions`
- `Needs Revision`
- `Insufficient Evidence`

## Security Architecture

### Identity

Use managed identity wherever possible.

Recommended identities:

- Function App managed identity
- Container App managed identity for Azure MCP Server
- Foundry project managed identity where supported

### Storage Access

Grant least privilege RBAC:

- Blob Data Contributor for upload processor where needed
- Blob Data Reader for retrieval-only workloads
- Blob Data Contributor for output writer

### Secrets

- avoid hardcoded secrets
- store configuration in app settings or Key Vault
- use managed identity over connection strings where feasible in later hardening phases

## Observability and Monitoring

Each operation should emit correlation-aware logs.

Track:

- review creation
- upload start and completion
- indexing start and completion
- Foundry invocation start and completion
- output generation and persistence
- user-facing errors

Recommended telemetry fields:

- reviewId
- fileId
- blobPath
- correlationId
- jobId
- userId
- processingStage
- status
- durationMs

## Data Model

### Review entity

- reviewId
- customerName
- projectName
- createdBy
- createdAt
- updatedAt
- status
- approvalRecommendation
- score
- missingEvidenceCount
- criticalBlockerCount

### File entity

- fileId
- reviewId
- fileName
- blobPath
- fileType
- uploadedBy
- uploadedAt
- ingestionStatus
- indexingStatus

### Output entity

- outputId
- reviewId
- outputType
- blobPath
- generatedAt
- agentVersion
- status

## Output Artifacts

Write outputs into `output-arb-files` using deterministic naming.

Suggested naming:

- `<reviewId>-architecture-review-report.md`
- `<reviewId>-architecture-review.json`
- `<reviewId>-executive-summary.md`

## Non-Functional Requirements

- secure by default
- observable
- auditable
- Azure-compliant naming
- resilient to partial failures
- retriable processing
- clear user-facing processing states

## Risks and Constraints

- Azure AI Search Free may be too small for larger document sets
- Foundry agent and MCP integration may require preview features depending on tenant and region
- document extraction quality varies by file type and document quality
- true enterprise approval workflow is out of scope for the first phase

## Recommended Initial Scope

Phase 1 should focus on:

- file upload
- storage persistence
- extraction and indexing
- Foundry-based review
- report generation
- scorecard and approval display

Defer for later phases:

- full workflow approvals
- multi-reviewer collaboration
- advanced RBAC
- deep human-in-the-loop workflow management
