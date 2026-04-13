# Azure Review Assistant - Deployment Guide

**Expert Team Implementation: Cloud Architects, Cloud Directors, Pre-Sales Architects, Cloud Engineers**

---

## 1. Prerequisites

### Required Credentials & Permissions
- **Azure Subscription** with Owner or Contributor role
- **GitHub CLI** (`gh auth login`) - if deploying from Git
- **Azure CLI** (`az login`) - authenticated to target subscription
- **Local Node.js** 20+ (for local testing before deployment)

### Azure Resources to Create
- **Resource Group** (new or existing)
- **Storage Account** with containers `arb-inputfiles`, `arb-outputfiles`
- **Azure Search Service** (free or standard tier)
- **Azure Functions App** (consumption plan recommended)
- **Azure AI Foundry Project** with `Azure-ARB-Agent` configured
- **Key Vault** for secret management

---

## 2. Deployment Steps

### Step A: Prepare Resource Group

```bash
# Set variables
$resourceGroup = "arb-prod-rg"
$location = "uksouth"  # or your preferred region
$subscriptionId = "XXXX-XXXX-XXXX"

# Create resource group
az group create `
  --name $resourceGroup `
  --location $location `
  --subscription $subscriptionId

# Verify
az group show --name $resourceGroup
```

### Step B: Deploy Core Infrastructure (Bicep)

```bash
# Validate Bicep template
az bicep build --file infrastructure/main.bicep

# Deploy resources
az deployment group create `
  --resource-group $resourceGroup `
  --template-file infrastructure/main.bicep `
  --parameters infrastructure/parameters.json `
  --parameters environment=prod `
  --subscription $subscriptionId

# Capture outputs
$deployment = az deployment group show `
  --name main `
  --resource-group $resourceGroup `
  --query properties.outputs `
  --output json | ConvertFrom-Json

$functionAppName = $deployment.functionAppName.value
$storageAccountName = $deployment.storageAccountName.value
$searchServiceName = $deployment.searchServiceName.value
```

### Step C: Deploy Azure Functions Backend

```bash
# Navigate to API folder
cd api

# Install dependencies
npm install

# Create production build
npm run build:prod  # or equivalent

# Create deployment package
npm prune --production

# Deploy to Azure Functions
func azure functionapp publish $functionAppName --build remote

# Verify deployment
func azure functionapp list-functions $functionAppName
```

**Expected Functions:**
- `arbRunAgentReview` - HTTP triggered, POST `/api/arb/run-agent-review`
- `arbUploadFiles` - HTTP triggered, POST `/api/arb/upload-files`
- `arbExtractFiles` - HTTP triggered, POST `/api/arb/extract-files`

### Step D: Configure Azure AI Foundry Agent

1. Go to **Azure AI Foundry** → Your Project
2. **Agents** → Select `Azure-ARB-Agent`
3. Update environment variables in deployment:
   ```
   FOUNDRY_PROJECT_ENDPOINT = https://<region>.api.cognitive.microsoft.com
   FOUNDRY_AGENT_ID = <agent-uuid>
   FOUNDRY_API_KEY = <api-key>
   ```

4. Configure MCP Server (Microsoft Learn integration):
   - Ensure `arb-foundry-agent.js` can reach MCP endpoint
   - Verify Microsoft Learn documentation fetching works

### Step E: Link Static Web App to Functions Backend

```bash
# Option 1: Via Azure CLI
$swaName = "jolly-sea-014792b10"  # Your SWA instance name
$functionResourceId = "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.Web/sites/$functionAppName"

az staticwebapp backends link `
  --resource-group $resourceGroup `
  --name $swaName `
  --backend-resource-id $functionResourceId `
  --location $location

# Option 2: Via Azure Portal
# Static Web Apps → API → Link backend → Select Functions App
```

### Step F: Update Static Web App Configuration

Edit `staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated", "anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "*.{css,scss,js,png,gif,ico,jpg,svg,woff,woff2}"]
  },
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "userDetailsClaim": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      }
    }
  }
}
```

Redeploy Static Web App:
```bash
# Push to GitHub (CI/CD will trigger)
git push origin main
```

---

## 3. Environment Variables & Configuration

### Function App Settings (via Azure Portal or CLI)

```bash
# Set all required environment variables
$envVars = @(
    @{ name = "AZURE_STORAGE_CONNECTION_STRING"; value = "<connection-string>" }
    @{ name = "AZURE_SEARCH_ENDPOINT"; value = "https://$searchServiceName.search.windows.net" }
    @{ name = "AZURE_SEARCH_KEY"; value = "<search-admin-key>" }
    @{ name = "AZURE_SEARCH_INDEX_NAME"; value = "arb-documents" }
    @{ name = "TABLE_STORAGE_CONNECTION_STRING"; value = "<connection-string>" }
    @{ name = "ARB_INPUT_CONTAINER_NAME"; value = "arb-inputfiles" }
    @{ name = "ARB_OUTPUT_CONTAINER_NAME"; value = "arb-outputfiles" }
    @{ name = "FOUNDRY_PROJECT_ENDPOINT"; value = "https://region.api.cognitive.microsoft.com" }
    @{ name = "FOUNDRY_AGENT_ID"; value = "<agent-id>" }
    @{ name = "FOUNDRY_API_KEY"; value = "<api-key>" }
    @{ name = "KEY_VAULT_ENDPOINT"; value = "https://$keyVaultName.vault.azure.net/" }
    @{ name = "Node_ENV"; value = "production" }
)

foreach ($var in $envVars) {
    az functionapp config appsettings set `
        --name $functionAppName `
        --resource-group $resourceGroup `
        --settings "$($var.name)=$($var.value)"
}
```

### Retrieve Storage Connection String

```bash
$connString = az storage account show-connection-string `
  --name $storageAccountName `
  --resource-group $resourceGroup `
  --query connectionString `
  --output tsv

Write-Host "Connection String: $connString"
```

### Retrieve Search Service Keys

```bash
$searchKey = az search admin-key show `
  --service-name $searchServiceName `
  --resource-group $resourceGroup `
  --query primaryKey `
  --output tsv

Write-Host "Search Admin Key: $searchKey"
```

---

## 4. RBAC Assignments (Managed Identity)

The Functions App uses **System Assigned Managed Identity** for secure access. Assign permissions:

```bash
# Get Function App Managed Identity Principal ID
$principalId = az functionapp show `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --query identity.principalId `
  --output tsv

# Assign Storage Blob Contributor
az role assignment create `
  --assignee-object-id $principalId `
  --role "Storage Blob Data Contributor" `
  --scope "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.Storage/storageAccounts/$storageAccountName"

# Assign Table Storage Contributor
az role assignment create `
  --assignee-object-id $principalId `
  --role "Storage Table Data Contributor" `
  --scope "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.Storage/storageAccounts/$storageAccountName"

# Assign Search Index Data Contributor
az role assignment create `
  --assignee-object-id $principalId `
  --role "Search Index Data Contributor" `
  --scope "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.Search/searchServices/$searchServiceName"
```

---

## 5. Validation & Testing

### Test Function Endpoints

```bash
$functionUrl = "https://$functionAppName.azurewebsites.net"

# Health check
curl "$functionUrl/api/health"

# Test upload endpoint
curl -X POST "$functionUrl/api/arb/upload-files" `
  -H "Content-Type: application/json" `
  -d '{"reviewId":"test-001","userId":"user-123"}'

# Test agent review endpoint  
curl -X POST "$functionUrl/api/arb/run-agent-review" `
  -H "Content-Type: application/json" `
  -d '{"reviewId":"test-001"}'
```

### Test End-to-End Flow

1. **Upload Phase**
   - Navigate to `https://jolly-sea-014792b10.6.azurestaticapps.net/arb?step=upload`
   - Upload sample document (PDF/DOCX)
   - Verify file appears in `arb-inputfiles` container

2. **Extraction Phase**
   - Click "Extract & Index"
   - Verify text chunks appear in Azure Search index
   - Check `arbreviews` table for metadata

3. **AI Review Phase**
   - Click "Run AI Review"
   - Monitor Function App logs: `az functionapp log tail -n $functionAppName -g $resourceGroup`
   - Wait for agent to complete (2–5 minutes)

4. **Export Phase**
   - Verify exported artifacts in `arb-outputfiles` container
   - Check `arbexports` table for export records
   - Download Markdown/CSV/HTML exports

### Monitor Logs

```bash
# Stream live logs
az functionapp log tail --name $functionAppName --resource-group $resourceGroup

# View specific invocation
$invocationId = "xxxx-xxxx"
az functionapp log tail --name $functionAppName --resource-group $resourceGroup --filter $invocationId
```

---

## 6. Infrastructure Verification Checklist

- [ ] Resource Group created and verified
- [ ] Storage Account with `arb-inputfiles` and `arb-outputfiles` containers
- [ ] Search Service with `arb-documents` index
- [ ] Azure Functions App deployed and running
- [ ] Function App environment variables configured
- [ ] Managed Identity RBAC roles assigned
- [ ] Static Web App linked to Functions backend
- [ ] `staticwebapp.config.json` updated with `/api/*` routing
- [ ] Azure AI Foundry Agent configured
- [ ] Microsoft Learn MCP Server reachable from Function App
- [ ] Upload test file and verify flow end-to-end
- [ ] Export artifacts generated to blob storage

---

## 7. Post-Deployment Configuration

### Enable Monitoring & Alerts

```bash
# Create Application Insights
az monitor app-insights component create `
  --app arb-insights `
  --location $location `
  --resource-group $resourceGroup `
  --application-type web

# Link to Function App
$appInsightsKey = az monitor app-insights component show `
  --app arb-insights `
  --resource-group $resourceGroup `
  --query instrumentationKey `
  --output tsv

az functionapp config appsettings set `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --settings "APPINSIGHTS_INSTRUMENTATIONKEY=$appInsightsKey"
```

### Set Up Key Vault for Secrets

```bash
# Create Key Vault
az keyvault create `
  --name $keyVaultName `
  --resource-group $resourceGroup `
  --location $location

# Store secrets
az keyvault secret set `
  --vault-name $keyVaultName `
  --name "foundry-api-key" `
  --value "<your-foundry-api-key>"

# Grant Function App access
az keyvault set-policy `
  --name $keyVaultName `
  --object-id $principalId `
  --secret-permissions get list
```

### Configure Auto-Scaling (Optional)

For production workloads with variable demand:

```bash
# Set up scaling rules
az monitor autoscale create `
  --resource-group $resourceGroup `
  --resource $functionAppName `
  --resource-type Microsoft.Web/serverfarms `
  --name arb-autoscale `
  --min-count 1 `
  --max-count 10 `
  --count 1
```

---

## 8. Troubleshooting & Common Issues

### Function App Won't Start
```bash
# Check deployment logs
az functionapp deployment log --name $functionAppName --resource-group $resourceGroup

# Verify Node runtime
az functionapp config show --name $functionAppName --resource-group $resourceGroup --query linuxFxVersion
```

### Blob Storage 403 Errors
- Verify Managed Identity RBAC roles are assigned
- Check storage account firewall rules allow Functions App
- Confirm connection string is correct

### Search Index Not Updating
- Verify search service key in Function App settings
- Check index schema matches expected fields
- Review Function App logs for indexing errors

### Agent Review Timeout
- Increase Function App timeout in `host.json`: `"functionTimeout": "00:10:00"`
- Monitor Azure AI Foundry console for agent execution logs
- Check Microsoft Learn MCP Server availability

### Static Web App /api Routing Not Working
```bash
# Verify backend link
az staticwebapp backends list --name $swaName --resource-group $resourceGroup

# Check staticwebapp.config.json is deployed
# Redeploy if needed
git push origin main
```

---

## 9. Cost Optimization

### Tier Recommendations

| Service | Tier | Cost/Month | Rationale |
|---------|------|-----------|-----------|
| Functions | Consumption | ~$0–20 | Pay-per-execution, scales automatically |
| Storage | Standard LRS | ~$25 | Sufficient for document storage, single region OK |
| Search | Standard | ~$300 | Required for document indexing; free tier too limited |
| App Insights | Pay-as-you-go | ~$5–50 | Monitor function execution |
| Key Vault | Standard | ~$0.60 | Minimal overhead for secret storage |

**Estimated Monthly Cost:** $330–395 (excluding Foundry agent usage)

---

## 10. Security Best Practices

1. **Never commit secrets** — Use Key Vault or environment variables
2. **Enable HTTPS only** — Storage accounts and Functions should reject HTTP
3. **Restrict blob public access** — All containers should be private
4. **Use managed identities** — Avoid connection strings in code
5. **Enable Azure Firewall rules** — Restrict Functions App IP if needed
6. **Audit logs** — Enable Azure Monitor diagnostic logs for all services
7. **Rotate keys regularly** — Use Key Vault for key rotation automation
8. **Encrypt data in transit** — TLS 1.2+ enforced on all connections

---

## Summary

**Implementation Status:**
- ✅ Bicep infrastructure templates created
- ✅ Deployment steps documented
- ✅ Environment variable checklist provided
- ✅ RBAC assignments specified
- ✅ Validation procedures defined
- ✅ Cost and security guidance included

**Next Action:** Execute Deployment Steps A–F in order. Functions App will be live within 10 minutes. Full end-to-end flow validated in under 30 minutes.

Questions? Review the troubleshooting section or consult Azure Documentation links below.

**References:**
- [Azure Functions Deployment](https://learn.microsoft.com/en-us/azure/azure-functions/)
- [Static Web Apps Backend API](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-overview)
- [Azure Search Service](https://learn.microsoft.com/en-us/azure/search/)
- [Azure Storage Security](https://learn.microsoft.com/en-us/azure/storage/common/storage-security-guide)
