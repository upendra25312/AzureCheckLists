> **Cost claim notice (2026-04-29):** This document describes the **Production tier** ($500–700/month). The repo also documents a **Pilot tier** ($25–60/month) using a different service set. See [`docs/internal/cost-narrative-reconciliation-2026-04-29.md`](../docs/internal/cost-narrative-reconciliation-2026-04-29.md) before quoting cost figures externally.

# Azure Review Assistant - Infrastructure & Deployment Index

**Status**: ✅ **PRODUCTIONREADY**  
**Last Updated**: April 12, 2026

---

## Quick Navigation

### For Team Leads / Directors
👉 **Start Here**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- 5-minute executive overview
- What's been completed
- Success criteria & validation results
- Risk assessment & decisions  
- Cost model & ROI

### For Cloud Engineers / DevOps
👉 **Start Here**: [QUICK_START.md](./QUICK_START.md)
- 5-minute deployment (15 min actual time)
- Step-by-step guide
- Critical configuration steps
- Validation checklist

### For Pre-Sales / Solutions Architects
👉 **Start Here**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Complete system design with diagram
- Data flow (upload → analyze → export)
- Technology stack with rationale
- Security model breakdown
- Performance characteristics
- Cost analysis ($500–700/month)
- Scalability strategy

### For Operations Teams
👉 **Start Here**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Detailed deployment procedures (7 sections)
- Environment setup with commands
- RBAC assignments
- Monitoring & alerting setup
- Troubleshooting reference
- Maintenance schedule

### For Configuration / Secrets Management
👉 **Start Here**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- Complete variable reference
- How to retrieve values from Azure
- Setting variables in Function App
- Security guidelines (do's/don'ts)
- Troubleshooting commands

### For Health Checks & Diagnostics
👉 **Run This**: [healthcheck.ps1](./healthcheck.ps1)
```powershell
.\healthcheck.ps1 -FunctionAppName "arb-api-xyz" -ResourceGroup "arb-prod-rg"
```
- Validates all Azure services connectivity
- Confirms every configuration variable is set
- Generates pass/fail diagnostic report

---

## Document Inventory

| Document | Purpose | Audience | Time |
|----------|---------|----------|------|
| **IMPLEMENTATION_SUMMARY.md** | Executive overview, what's done, validation results | Directors, Team Leads | 5 min |
| **QUICK_START.md** | Fast 15-minute deployment path | Cloud Engineers | 5 min read + 15 min deploy |
| **DEPLOYMENT_GUIDE.md** | Complete step-by-step with troubleshooting | DevOps, Operations | 30–60 min |
| **ARCHITECTURE.md** | System design, data flow, security, cost | Architects, Pre-Sales | 20 min |
| **ENVIRONMENT_VARIABLES.md** | Configuration reference & retrieval | Cloud Engineers, SecOps | 10 min |

---

## Infrastructure Files

| File | Purpose | Size |
|------|---------|------|
| **main.bicep** | Core Azure resources (Functions, Storage, Search, KeyVault) | 300 lines |
| **staticwebapp.bicep** | Frontend-backend networking | 30 lines |
| **parameters.json** | Environment configuration values | 20 lines |
| **healthcheck.ps1** | Automated diagnostics script | 140 lines |

---

## Supported Scenarios

### Scenario 1: Deploy to New Azure Subscription
**Time**: 15–30 minutes  
**Steps**:
1. Read [QUICK_START.md](./QUICK_START.md)
2. Execute Bicep deployment
3. Configure Foundry credentials
4. Run [healthcheck.ps1](./healthcheck.ps1)
5. Test with sample document

### Scenario 2: Understand System Architecture
**Time**: 20 minutes  
**Documents**:
1. [ARCHITECTURE.md](./ARCHITECTURE.md#system-architecture-overview) - System diagram
2. [ARCHITECTURE.md](./ARCHITECTURE.md#data-flow-complete-journey) - Data flow walkthrough
3. [ARCHITECTURE.md](./ARCHITECTURE.md#technology-stack) - Service breakdown

### Scenario 3: Troubleshoot Live Deployment
**Time**: 5–15 minutes  
**Tools**:
1. Run [healthcheck.ps1](./healthcheck.ps1) for automated diagnostics
2. Review [ENVIRONMENT_VARIABLES.md#troubleshooting](./ENVIRONMENT_VARIABLES.md#troubleshooting) for quick issues
3. Consult [DEPLOYMENT_GUIDE.md#troubleshooting](./DEPLOYMENT_GUIDE.md#7-troubleshooting--common-issues) for detailed fixes

### Scenario 4: Prepare Stakeholder Presentation
**Time**: 30 minutes  
**Documents**:
1. [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Executive points
2. [ARCHITECTURE.md](./ARCHITECTURE.md#cost-model-monthly-estimate) - Cost breakdown
3. [ARCHITECTURE.md](./ARCHITECTURE.md#security-model) - Security highlights

### Scenario 5: Plan Post-Deployment Operations
**Time**: 45 minutes  
**Documents**:
1. [DEPLOYMENT_GUIDE.md#1-prerequisites](./DEPLOYMENT_GUIDE.md#1-prerequisites) - Credentials/access
2. [DEPLOYMENT_GUIDE.md#monitoring--alerts](./DEPLOYMENT_GUIDE.md#monitoring--alerts-recommended) - Observability setup
3. [ARCHITECTURE.md#maintenance--upgrades](./ARCHITECTURE.md#maintenance--upgrades) - Maintenance schedule
4. [ARCHITECTURE.md#support--escalation](./ARCHITECTURE.md#support--escalation) - Incident response

---

## Frontend Integration (Static Web App)

**Current Status**: ✅ Query-parameter routing working  
**Backend Link**: Requires deployment via QUICK_START.md or DEPLOYMENT_GUIDE.md

Once backend is deployed:
1. Static Web App will route `/api/*` calls to Functions app
2. Frontend `src/arb/api.ts` will use real backend instead of mock fallback
3. File uploads → immediate AI review → export artifacts flow

**Deploy Frontend**: 
```bash
git push origin main  # Triggers GitHub Actions workflow
# Wait 5–10 minutes for Static Web App to build and deploy
```

---

## Bicep Template Structure

```bicep
main.bicep
├── Metadata & Parameters
│   ├── location: Azure region (default: uksouth)
│   ├── environment: dev/staging/prod
│   └── appName: Prefix for resource names
│
├── Storage Account Resources
│   ├── Storage Account (Standard LRS)
│   ├── Container: arb-inputfiles
│   ├── Container: arb-outputfiles
│   ├── Table: arbreviews
│   └── Table: arbexports
│
├── Azure Search
│   ├── Search Service (Standard tier)
│   └── Index: arb-documents (with schema)
│
├── Key Vault
│   └── Secret storage (RBAC-based access)
│
├── Azure Functions
│   ├── App Service Plan (Consumption)
│   ├── Function App (Node.js 20)
│   └── Function App Settings
│       ├── Storage connection string
│       ├── Search endpoint & key
│       ├── Foundry credentials
│       └── Table storage connection
│
└── Outputs
    ├── functionAppName
    ├── storageAccountName
    ├── searchServiceEndpoint
    └── keyVaultUri
```

---

## Deployment Checklist

### Pre-Deployment (Day Before)
- [ ] Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- [ ] Review cost model in [ARCHITECTURE.md](./ARCHITECTURE.md#cost-model-monthly-estimate)
- [ ] Confirm Azure subscription and role access
- [ ] Prepare Foundry Agent credentials
- [ ] Assign team member for execution

### Deployment Day (You Are Here)
- [ ] Execute [QUICK_START.md](./QUICK_START.md) (15 min)
  - [ ] Create resource group
  - [ ] Deploy Bicep template
  - [ ] Set environment variables
  - [ ] Link Frontend / Functions
- [ ] Run [healthcheck.ps1](./healthcheck.ps1) (2 min)
  - [ ] Verify all services connected
  - [ ] Confirm variables configured
- [ ] Test end-to-end (10 min)
  - [ ] Upload sample document
  - [ ] Run AI review
  - [ ] Download exports
- [ ] Document sign-off (team lead)

### Post-Deployment (Day After)
- [ ] Set up Application Insights alerts
- [ ] Configure backup/disaster recovery
- [ ] Schedule team training
- [ ] Document runbooks for ops team
- [ ] Review [ARCHITECTURE.md#monitoring--observability](./ARCHITECTURE.md#monitoring--observability) setup

---

## Support & Troubleshooting

### "command not found" errors
👉 See [DEPLOYMENT_GUIDE.md#prerequisites](./DEPLOYMENT_GUIDE.md#1-prerequisites)

### "Storage connection string invalid"
👉 See [ENVIRONMENT_VARIABLES.md#invalid-connection-string](./ENVIRONMENT_VARIABLES.md#invalid-connection-string)

### "Function app won't start"
👉 See [DEPLOYMENT_GUIDE.md#troubleshooting](./DEPLOYMENT_GUIDE.md#8-troubleshooting--common-issues)

### "Agent review times out"
👉 See [DEPLOYMENT_GUIDE.md#agent-review-timeout](./DEPLOYMENT_GUIDE.md#agent-review-timeout)

### "Search index not updating"
👉 See [DEPLOYMENT_GUIDE.md#search-index-not-updating](./DEPLOYMENT_GUIDE.md#search-index-not-updating)

### "All checks fail"
👉 Run [healthcheck.ps1](./healthcheck.ps1) first; review output for specific service issues

---

## Key Metrics & SLAs

| Metric | Target | Notes |
|--------|--------|-------|
| **Deployment Time** | 15 min | Includes all Azure resource provisioning |
| **Review Latency** | 2–3 min | Upload → agent analysis → export complete |
| **Function Timeout** | 10 min | Agent processing limit |
| **Search Query Latency** | <200ms | Per query for RAG context |
| **Storage Throughput** | Auto-scales | No bottleneck up to 1000s files/day |
| **Availability** | 99.9%+ | Azure SLA + consumption plan redundancy |
| **Monthly Cost** | $500–700 | Before Foundry agent variable costs |

---

## Governance & Compliance

### Data Retention
- **Input files**: Auto-deleted 7 days after extraction
- **Export artifacts**: Retained 30 days, then auto-deleted
- **Metadata**: Retained 90 days

### Access Control
- **Managed Identity**: All Functions → Services (no API key in code)
- **RBAC**: Separate role assignments per service
- **Encryption**: TLS 1.2+ in transit; AES-256 at rest
- **Audit**: All operations logged to Application Insights

### Compliance Standards
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Encryption at rest (Azure managed keys)
- ✅ No hardcoded secrets
- ✅ Audit logging enabled
- ✅ RBAC-based access control
- ✅ 7-day file retention policy
- ⚠️ **NOT SOC 2 / FedRAMP certified** (out of scope)

---

## Versioning & Changes

| Commit | Date | Change | Impact |
|--------|------|--------|--------|
| `dbcd6fa` | 2026-04-12 | Add IMPLEMENTATION_SUMMARY.md | 📄 Docs |
| `ba71db4` | 2026-04-12 | Complete infrastructure deployment package | 🚀 Deployment |
| `99a8ed1` | 2026-04-12 | Wire output persistence in arbRunAgentReview | 🔧 Backend |

---

## Contact & Escalation

**Deployment Issues**: Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#8-troubleshooting--common-issues)  
**Architecture Questions**: Review [ARCHITECTURE.md](./ARCHITECTURE.md)  
**Cost Optimization**: Review [DEPLOYMENT_GUIDE.md#7-cost-optimization](./DEPLOYMENT_GUIDE.md#7-cost-optimization)  
**Operational Runbooks**: Review [ARCHITECTURE.md#maintenance--upgrades](./ARCHITECTURE.md#maintenance--upgrades)

---

## Recommended Reading Order

### For Quick Deployment (15 min)
1. This page (you're here) — 5 min
2. [QUICK_START.md](./QUICK_START.md) — 5 min  
3. Execute deployment steps — 15 min
4. Run [healthcheck.ps1](./healthcheck.ps1) — 2 min

### For Complete Understanding (1 hour)
1. [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) — 10 min
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — 30 min
3. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — 20 min
4. Execute deployment — 15 min

### For Troubleshooting (5–15 min)
1. Run [healthcheck.ps1](./healthcheck.ps1) — 2 min
2. Review output against [ENVIRONMENT_VARIABLES.md#troubleshooting](./ENVIRONMENT_VARIABLES.md#troubleshooting) — 3 min
3. Check specific service issue in [DEPLOYMENT_GUIDE.md#troubleshooting](./DEPLOYMENT_GUIDE.md#8-troubleshooting--common-issues) — 5–10 min

---

**Status**: ✅ All documents complete and ready  
**Next Step**: Choose your scenario above and follow the link  
**Expected Outcome**: Production-grade backend deployed in 15–30 minutes
