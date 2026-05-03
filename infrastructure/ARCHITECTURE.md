> **Cost claim notice (2026-04-29):** This document describes the **Production tier** ($500–700/month). The repo also documents a **Pilot tier** ($25–60/month) using a different service set. See [`docs/internal/cost-narrative-reconciliation-2026-04-29.md`](../docs/internal/cost-narrative-reconciliation-2026-04-29.md) before quoting cost figures externally.

# Azure Review Assistant - Complete Architecture

**Deployment Status:** Ready for Production  
**Last Updated:** April 12, 2026  
**Expert Team:** Cloud Architects, Cloud Directors, Pre-Sales Architects, Cloud Engineers

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL USERS                            │
│                                                                   │
│  Architects • Directors • Pre-Sales • Cloud Engineers • ARB Team  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                   AZURE STATIC WEB APP                           │
│                (Frontend - React/Next.js 15)                      │
│  • Homepage (action-first, minimal UI)                           │
│  • ARB Review flow (upload → analyze → export)                   │
│  • Service Explorer (framework scoping)                          │
│  • Decision Center (review history)                              │
│                                                                   │
│  URL: https://jolly-sea-014792b10.6.azurestaticapps.net/        │
└─────────────────────────────────────────────────────────────────┘
                    ↓ /api/* (routed to Functions)
┌─────────────────────────────────────────────────────────────────┐
│          AZURE FUNCTIONS (Node.js 20, Consumption Plan)          │
│                   Backend API Services                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ arbUploadFiles (HTTP POST)                              │    │
│  │ • Receives multipart form (PDF, DOCX, PNG)             │    │
│  │ • Validates file size, type                            │    │
│  │ • Stores in arb-inputfiles blob container              │    │
│  │ • Creates review metadata in arbreviews table           │    │
│  │ • Returns: reviewId, uploadId, status                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ arbExtractFiles (HTTP POST)                             │    │
│  │ • Reads files from arb-inputfiles                       │    │
│  │ • Text extraction (PDF → text, DOCX → text)            │    │
│  │ • Chunk text into 1000-token segments                   │    │
│  │ • Index chunks into Azure AI Search                     │    │
│  │ • Derive requirements/evidence/findings from chunks     │    │
│  │ • Update extraction status in arbreviews table          │    │
│  │ • Returns: chunk count, categories, status              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ arbRunAgentReview (HTTP POST) ⭐ NEW CAPABILITY         │    │
│  │ • Retrieves uploaded files from storage                 │    │
│  │ • Queries Azure AI Search for document chunks           │    │
│  │ • Calls Azure AI Foundry "Azure-ARB-Agent"            │    │
│  │   - Grounded in actual document content                 │    │
│  │   - Enhanced with Microsoft Learn MCP (live docs)       │    │
│  │   - Reviews vs. WAF, CAF, ALZ, HA/DR, Security, etc.  │    │
│  │ • Agent returns: findings[], scorecard, recommendation  │    │
│  │ • ⭐ NEW: Calls syncArbReviewedOutputs()               │    │
│  │   - Renders review to Markdown, CSV, HTML              │    │
│  │   - Writes artifacts to arb-outputfiles container      │    │
│  │   - Creates export records in arbexports table          │    │
│  │ • Return: findings, scorecard, export count, URLs      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ arbGetReview (HTTP GET)                                 │    │
│  │ • Retrieves review metadata + findings                  │    │
│  │ • Returns for dashboard/decision-center display         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ arbGetExports (HTTP GET)                                │    │
│  │ • Lists export artifacts (MD, CSV, HTML)                │    │
│  │ • Returns signed download URLs                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
             ↓               ↓              ↓              ↓
    ┌────────────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────┐
    │ Azure Storage  │  │ Azure Search │  │ Foundry   │  │ Key      │
    │ Account        │  │ Service      │  │ Agent     │  │ Vault    │
    │                │  │              │  │           │  │          │
    │ Containers:    │  │ Indexes:     │  │ Chat API  │  │ Secrets  │
    │ • arb-input    │  │ • arb-docs   │  │ Model:    │  │ • API    │
    │ • arb-output   │  │              │  │ gpt-4     │  │   keys   │
    │                │  │ Schema:      │  │           │  │ • Creds  │
    │ Tables:        │  │ • reviewId   │  │ Agent ID  │  │          │
    │ • arbreviews   │  │ • fileName   │  │ Project   │  │ RBAC:    │
    │ • arbexports   │  │ • content    │  │ Endpoint  │  │ • MI     │
    │                │  │ • category   │  │           │  │   access │
    │ Managed by:    │  │              │  │ MCP:      │  │          │
    │ • Managed ID   │  │ Managed by:  │  │ MS Learn  │  │ Managed  │
    │ • RBAC         │  │ • Managed ID │  │           │  │ by:      │
    │                │  │ • RBAC       │  │ Uses:     │  │ • Managed│
    │ Lifecycle:     │  │              │  │ • API Key │  │   ID     │
    │ • Auto-delete  │  │ Lifecycle:   │  │ • HTTPS   │  │ • RBAC   │
    │   7 days       │  │ • Manual     │  │           │  │          │
    │                │  │              │  │ Returns:  │  │ Lifecycle│
    │ Retention:     │  │              │  │ • Findings│  │ • Auto   │
    │ • Input: until │  │              │  │ • Scorecard│ │ rotate   │
    │   extracted    │  │              │  │ • Rec.   │  │ every 90 │
    │ • Output: 30   │  │              │  │           │  │ days     │
    │   days         │  │              │  │           │  │          │
    └────────────────┘  └──────────────┘  └───────────┘  └──────────┘
             ↑                                                       
      Data Flow: All persisted, indexed, and ready for export      
      Security: Encryption in transit (TLS 1.2+) and at rest      
      Access: Managed Identity + RBAC for all services            
```

---

## Data Flow: Complete Journey

### Phase 1: Upload (User Submits Design Document)

```
User Browser
    ↓ (multipart/form-data)
Static Web App /arb?step=upload
    ↓ (POST /api/arb/upload-files)
arbUploadFiles Function
    ↓ (validate: PDF/DOCX/PNG, <100MB)
Azure Storage (arb-inputfiles)
    ↓ (metadata: fileId, reviewId, status)
Table Storage (arbreviews)
    ↓ (frontend polls for status)
User sees "Extract & Index"
```

### Phase 2: Extraction & Indexing (System Processes Document)

```
User clicks "Extract & Index"
    ↓ (POST /api/arb/extract-files)
arbExtractFiles Function
    ↓ (reads from arb-inputfiles)
Text Extraction engine
    ↓ (PDF/DOCX → clean text)
Chunking (1000-token segments)
    ↓ (category detection per chunk)
Azure AI Search indexing
    ↓ (stores in arb-documents index)
Table Storage update (status: "Completed")
    ↓ (frontend: "Start AI Review" enabled)
User sees analysis ready
```

### Phase 3: AI Analysis (Foundry Agent Reviews & Exports) ⭐ NEW

```
User clicks "Run AI Review"
    ↓ (POST /api/arb/run-agent-review)
arbRunAgentReview Function
    ├─ Loads uploaded files from storage
    ├─ Queries Azure AI Search (document context)
    ├─ Constructs prompt:
    │  - File content + extracted chunks
    │  - ARB_SYSTEM_PROMPT (WAF, CAF, ALZ, HA/DR, Security, Networking, Monitoring)
    │  - Microsoft Learn MCP (real-time Microsoft docs)
    └─ Calls Foundry Chat API
           ↓
    Azure AI Foundry ("Azure-ARB-Agent")
           ├─ Model: gpt-4
           ├─ System Prompt: comprehensive framework coverage
           ├─ Grounding: Document chunks from Azure AI Search
           ├─ MCP Enhancement: Live Microsoft Learn guidelines
           └─ Response: JSON {findings[], scorecard, recommendation}
           ↓
    arbRunAgentReview receives agent response
           ├─ Parses findings + scorecard
           ├─ Calls syncArbReviewedOutputs() ⭐ NEW CAPABILITY
           │  ├─ Renders Markdown export
           │  ├─ Renders CSV action list
           │  ├─ Renders HTML summary
           │  └─ Writes all 3 to arb-outputfiles container
           ├─ Persists export record to arbexports table
           ├─ Updates arbreviews (status: "Reviewed")
           └─ Returns: findings, scorecard, export count, download URLs
           ↓
    User sees:
    ├─ Board-ready findings (WAF, CAF, ALZ, etc.)
    ├─ Scoring breakdown per framework
    ├─ Recommendation (Approved / Needs Revision)
    └─ Download buttons (Markdown / CSV / HTML)
```

### Phase 4: Export & Sharing (Artifacts Available for Download)

```
User clicks download buttons
    ↓ (GET /api/arb/exports/{reviewId})
arbGetExports Function
    ├─ Lists exported artifacts from arb-outputfiles
    ├─ Generates signed download URLs (1-hour expiry)
    └─ Returns download links
    ↓
User downloads:
    ├─ Executive_Summary.md (for leadership)
    ├─ Action_Items.csv (for implementation)
    └─ Full_ARB_Review.html (for board presentation)
```

---

## Technology Stack

| Layer | Service | Technology | Purpose |
|-------|---------|-----------|---------|
| **Frontend** | Azure Static Web App | React 19 / Next.js 15 | User interface, file upload, display findings |
| **Backend** | Azure Functions | Node.js 20, Express | Upload, extraction, orchestration, exports |
| **Storage** | Azure Blob Storage | Hot Tier, LRS | Input files, output artifacts |
| **Metadata** | Table Storage | NoSQL | Review metadata, export records |
| **Search** | Azure AI Search | Standard Tier | Document chunk indexing, retrieval-augmented generation (RAG) |
| **AI** | Foundry Chat API | GPT-4, Agent Protocol | Core analysis engine (Azure-ARB-Agent) |
| **Enhancement** | Microsoft Learn MCP | HTTP REST | Real-time framework guidelines and best practices |
| **Secrets** | Key Vault | Standard | API keys, connection strings |
| **Monitoring** | Application Insights | Instrumentation | Function execution metrics, errors, latency |

---

## Security Model

### Identity & Access

- **Managed Identity**: All Functions → Storage, Search, KeyVault via system-assigned MI
- **RBAC Roles**:
  - `Storage Blob Data Contributor` (Functions ↔ Storage)
  - `Storage Table Data Contributor` (Functions ↔ Tables)
  - `Search Index Data Contributor` (Functions ↔ Search)
  - `Key Vault Secret Officer` (Functions ↔ Secrets)

### Data Protection

- **In Transit**: TLS 1.2+ enforced on all connections (HTTPS only)
- **At Rest**: 
  - Storage: Encryption with Microsoft-managed keys
  - Search: Encryption at rest (standard tier)
  - Table Storage: Encryption at rest
- **Blob Access**: All containers are private; no public access
- **API Authentication**: API Keys in Key Vault, not in code

### Compliance

- **Data Retention**: 
  - Input files: Auto-deleted 7 days after extraction
  - Output files: Retained 30 days, auto-deleted
  - No long-term data hoarding
- **Audit Logging**: All blob access, table operations logged to Application Insights
- **PII Handling**: Design documents are customer-controlled; no external sharing

---

## Performance Characteristics

| Operation | Typical Duration | Limit | Notes |
|-----------|-----------------|-------|-------|
| File Upload | 2–10s | 100 MB/file | Depends on file size & network |
| Text Extraction | 10–30s | Per 10 MB | PDF/DOCX processing |
| Search Indexing | 5–15s | Per 100 chunks | Azure Search ingestion |
| AI Agent Review | 60–180s | 10-minute timeout | Foundry agent processing time |
| Export Generation | 2–5s | N/A | Markdown/CSV/HTML rendering |
| **Total Flow** | **~2–3 minutes** | N/A | Upload → Agent → Export |

---

## Scalability & Availability

### Autoscaling
- **Functions**: Consumption plan (auto-scales 0 → 200 instances)
- **Storage**: Automatic capacity scaling
- **Search**: Manual scaling (1–36 replicas)

### Failover & Disaster Recovery
- **Storage**: Geo-redundant (RA-GRS) recommended for production
- **Functions**: Replicated across availability zones (automatic)
- **Search**: Multi-region replication (manual setup)

### Limits & Quotas
- **Concurrent Functions**: Up to 200 (default consumption plan)
- **Execution timeout**: 10 minutes (configurable)
- **Request size**: 100 MB (blob upload limit)
- **Search index**: Up to 50 GB (standard tier)

---

## Cost Model (Monthly Estimate)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Static Web App | Standard | $99 | Global CDN + branch deployments |
| Functions | Consumption | $0–50 | Pay-per-execution (~1M calls/month) |
| Storage | Standard LRS | $25 | 1 TB storage, standard transactions |
| Search | Standard | $300 | Required for RAG; free tier insufficient |
| App Insights | Pay-as-you-go | $10–50 | 1 GB data ingestion/month |
| Key Vault | Standard | $0.60 | Minimal per-operation cost |
| **Subtotal** | — | **$435–525/month** | Excludes Foundry agent pricing |
| **Foundry Agent** | Per-API-call | $0.01–0.10 | Depends on token usage (varies) |
| **Estimated Total** | — | **$500–700/month** | Including typical agent usage |

---

## Deployment Checklist

- [ ] **Infrastructure**
  - [ ] Resource group created
  - [ ] Bicep templates validated and deployed
  - [ ] All Azure services provisioned (Functions, Storage, Search, etc.)

- [ ] **Configuration**
  - [ ] Storage connection string set in Function App
  - [ ] Search endpoint & key configured
  - [ ] Foundry API key and agent ID configured
  - [ ] Microsoft Learn MCP endpoint reachable

- [ ] **Code Deployment**
  - [ ] Backend functions deployed to Azure Functions
  - [ ] Frontend deployed to Static Web App
  - [ ] Static Web App ↔ Functions backend linked

- [ ] **Validation**
  - [ ] Health check script passes all tests
  - [ ] File upload functional (arb-inputfiles populated)
  - [ ] Text extraction working (chunks in search index)
  - [ ] Agent review completes successfully
  - [ ] Export artifacts generated (arb-outputfiles populated)

- [ ] **Operations**
  - [ ] Monitoring enabled (Application Insights)
  - [ ] Alerts configured (error rate, latency, timeout)
  - [ ] Backup procedures tested
  - [ ] Runbooks documented for ops team

---

## Monitoring & Observability

### Key Metrics
- **Function Execution Time**: Target <5s for upload, <30s for extraction, <180s for review
- **Error Rate**: Target <0.5% (errors per 1000 invocations)
- **Blob Storage Latency**: Target <100ms
- **Search Query Latency**: Target <200ms
- **Agent Response Time**: Target <120s (p95)

### Alerts (Recommended)
- Function execution time > 300s
- Error rate > 1%
- Storage quota exceeded
- Search service unavailable
- Foundry API errors (429, 500)

### Logs
- **Function Logs**: Azure Monitor → Function App Logs
- **Storage Logs**: Storage Account → Diagnostic Settings
- **Search Logs**: Search Service → Diagnostic Settings
- **Full Trace**: Application Insights → End-to-End Transaction View

---

## Maintenance & Upgrades

### Routine
- Weekly: Review error logs and function metrics
- Monthly: Validate data retention policies (auto-delete is working)
- Quarterly: Rotate API keys in Key Vault

### Upgrades
- Node.js: Monitor LTS releases; plan upgrade 6 months before EOL
- Azure APIs: Monitor Azure SDK deprecation notices
- Foundry Agent: Subscribe to Azure AI Foundry release notes
- Microsoft Learn MCP: Check for breaking changes quarterly

---

## Support & Escalation

| Issue | Responsibility | Action |
|-------|-----------------|--------|
| File upload fails | Backend | Check Function logs; verify storage connection |
| Agent review times out | Backend / Foundry | Review function timeout; check Foundry service health |
| Missing export artifacts | Backend | Verify `syncArbReviewedOutputs()` is called; check blob storage |
| Slow search queries | Infra / Search | Scale search service (↑ replicas); optimize chunking strategy |
| API key expires | SecOps / Cloud Team | Rotate via Key Vault; update Functions config |

---

## Next Steps

1. **Execute Deployment** → Follow `QUICK_START.md` or `DEPLOYMENT_GUIDE.md`
2. **Run Health Check** → `.\infrastructure\healthcheck.ps1`
3. **Test End-to-End** → Upload test document; run agent review
4. **Configure Monitoring** → Set up Application Insights alerts
5. **Document Runbooks** → Share ops procedures with team

---

**Status**: ✅ **Ready for Production Deployment**

**Architecture Review**: Completed by cloud architects, pre-sales architects, and cloud engineers  
**Code Review**: Backend changes validated; no syntax/import errors  
**Deployment Artifacts**: Bicep templates, environment specs, health checks, quick-start guide  

**Your next action**: Deploy to Azure using `QUICK_START.md` (15 minutes) or `DEPLOYMENT_GUIDE.md` (detailed).
