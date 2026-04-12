# Quick Start Guide - Azure Review Assistant Backend Deployment

**For: Cloud Architects, Directors, Pre-Sales & Cloud Engineers**

---

## 5-Minute Setup Overview

### Prerequisites Checklist
- [ ] Azure Subscription with Owner/Contributor access
- [ ] Azure CLI installed and authenticated (`az login`)
- [ ] GitHub CLI (optional, for Git-based deployment)
- [ ] Node.js 20+ (for local testing)

### Step 1: Clone and Prepare (1 min)

```bash
# Navigate to project
cd "C:\Azure HA DR\AzureCheckLists"

# Verify structure
ls -la infrastructure/
```

### Step 2: Deploy Infrastructure (3 min)

```bash
# Set your variables
$resourceGroup = "arb-prod-rg"
$location = "uksouth"
$subscriptionId = "YOUR_SUBSCRIPTION_ID"

# Create resource group
az group create --name $resourceGroup --location $location --subscription $subscriptionId

# Deploy Bicep template
az deployment group create `
  --resource-group $resourceGroup `
  --template-file infrastructure/main.bicep `
  --parameters infrastructure/parameters.json `
  --subscription $subscriptionId
```

### Step 3: Deploy Functions (1 min)

```bash
# Get Function App name from deployment output
$deployment = az deployment group show -n main -g $resourceGroup --query properties.outputs.functionAppName.value -o tsv

# Deploy backend
cd api
npm install
func azure functionapp publish $deployment --build remote
```

---

## Critical Configuration (Must Do Before First Use)

```bash
# Retrieve storage connection string
$storageAccount = az deployment group show -n main -g $resourceGroup --query properties.outputs.storageAccountName.value -o tsv

$connString = az storage account show-connection-string --name $storageAccount --resource-group $resourceGroup --query connectionString -o tsv

# Retrieve search admin key
$searchService = az deployment group show -n main -g $resourceGroup --query properties.outputs.searchServiceName.value -o tsv

$searchKey = az search admin-key show --service-name $searchService --resource-group $resourceGroup --query primaryKey -o tsv

# Set Function App environment variables
az functionapp config appsettings set `
  --name $deployment `
  --resource-group $resourceGroup `
  --settings `
    "AZURE_STORAGE_CONNECTION_STRING=$connString" `
    "AZURE_SEARCH_KEY=$searchKey" `
    "FOUNDRY_API_KEY=<YOUR_FOUNDRY_KEY>" `
    "FOUNDRY_AGENT_ID=<YOUR_AGENT_ID>" `
    "FOUNDRY_PROJECT_ENDPOINT=<YOUR_FOUNDRY_ENDPOINT>"
```

### Get Foundry Credentials

1. Go to **Azure AI Foundry** → Your Project
2. **Settings** → Copy **Project Endpoint**
3. **Agents** → Select **Azure-ARB-Agent**
4. **Agent Details** → Copy **Agent ID**
5. **API Keys** → Create/copy **API Key**

---

## Link Static Web App (Optional but Recommended)

If using Azure Static Web Apps:

```bash
# Get Static Web App name
$swaName = "your-swa-name"  # From your Azure Portal

# Link Functions backend
az staticwebapp backends link `
  --resource-group $resourceGroup `
  --name $swaName `
  --backend-resource-id "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.Web/sites/$deployment" `
  --location $location
```

---

## Validate Setup

```bash
# Run health check
.\infrastructure\healthcheck.ps1 -FunctionAppName $deployment -ResourceGroup $resourceGroup

# Expected output: All checks should show ✓
```

---

## Test End-to-End

1. **Upload Test**
   ```bash
   $funcUrl = "https://$($deployment).azurewebsites.net"
   curl -X POST "$funcUrl/api/arb/upload-files" `
     -H "Content-Type: application/json" `
     -d '{"reviewId":"test-001","userId":"user-123"}'
   ```

2. **Agent Review Test**
   ```bash
   curl -X POST "$funcUrl/api/arb/run-agent-review" `
     -H "Content-Type: application/json" `
     -d '{"reviewId":"test-001"}'
   ```

3. **Check Outputs**
   ```bash
   # List exported artifacts in blob storage
   az storage blob list `
     --account-name $storageAccount `
     --container-name arb-outputfiles `
     --resource-group $resourceGroup
   ```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Storage not found" | Verify connection string is set: `az functionapp config appsettings list --name $deployment` |
| "Search unauthorized" | Confirm API key is correct: `az search admin-key show --service-name $searchService` |
| "Function returns 500" | Check logs: `az functionapp log tail --name $deployment --resource-group $resourceGroup` |
| "/api routes not working" | Verify Static Web App backend link and `staticwebapp.config.json` |
| Agent times out | Increase timeout in `api/host.json`: `"functionTimeout": "00:10:00"` |

---

## Post-Deployment (Production)

- [ ] Enable Application Insights monitoring
- [ ] Set up Auto-scaling rules
- [ ] Configure Key Vault for secrets
- [ ] Enable audit logging
- [ ] Test disaster recovery procedures
- [ ] Document runbook for operations team

---

## Support References

- **Complete Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Environment Variables**: See `ENVIRONMENT_VARIABLES.md`
- **Architecture**: See `../Architecture/` folder
- **Backend Code**: See `../api/src/`

---

**Total Time to Full Backend Live: ~15 minutes**

**Next Step:** Run the health check to validate everything is connected.
