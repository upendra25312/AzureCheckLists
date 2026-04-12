# Environment Variables Checklist

## Required Variables for Azure Review Assistant Functions Backend

### Storage Configuration
```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=<storage-account-name>;AccountKey=<account-key>;EndpointSuffix=core.windows.net
TABLE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=<storage-account-name>;AccountKey=<account-key>;EndpointSuffix=core.windows.net
ARB_INPUT_CONTAINER_NAME=arb-inputfiles
ARB_OUTPUT_CONTAINER_NAME=arb-outputfiles
```

### Azure Search Configuration
```
AZURE_SEARCH_ENDPOINT=https://<search-service-name>.search.windows.net
AZURE_SEARCH_KEY=<search-admin-key>
AZURE_SEARCH_INDEX_NAME=arb-documents
```

### Azure AI Foundry Configuration
```
FOUNDRY_PROJECT_ENDPOINT=https://<region>.api.cognitive.microsoft.com
FOUNDRY_AGENT_ID=<agent-uuid>
FOUNDRY_API_KEY=<api-key>
FOUNDRY_DEPLOYMENT_NAME=gpt-4
```

### Key Vault Configuration (Optional but Recommended)
```
KEY_VAULT_ENDPOINT=https://<key-vault-name>.vault.azure.net/
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<client-id>
AZURE_CLIENT_SECRET=<client-secret>
```

### Application Settings
```
Node_ENV=production
AZURE_LOG_LEVEL=info
REQUEST_TIMEOUT_MS=300000
```

---

## How to Retrieve Values

### Storage Account Connection String
```powershell
az storage account show-connection-string `
  --name <storage-account-name> `
  --resource-group <resource-group> `
  --query connectionString `
  --output tsv
```

### Azure Search Keys
```powershell
az search admin-key show `
  --service-name <search-service-name> `
  --resource-group <resource-group>
```

### Foundry Project Details
1. Go to **Azure AI Foundry** → **Your Project**
2. **Settings** → **Project Properties**
3. Copy: Project Name, Region, Endpoint
4. **Agents** → **Azure-ARB-Agent** → Copy Agent ID
5. **API Keys** → Create/copy API key

### Key Vault Endpoint
```powershell
az keyvault show `
  --name <key-vault-name> `
  --resource-group <resource-group> `
  --query properties.vaultUri `
  --output tsv
```

---

## Setting Variables in Function App

### Via Azure CLI (Batch)
```powershell
$vars = @{
    AZURE_STORAGE_CONNECTION_STRING = "<conn-string>"
    AZURE_SEARCH_ENDPOINT = "https://search-service.search.windows.net"
    AZURE_SEARCH_KEY = "<search-key>"
    AZURE_SEARCH_INDEX_NAME = "arb-documents"
    TABLE_STORAGE_CONNECTION_STRING = "<conn-string>"
    ARB_INPUT_CONTAINER_NAME = "arb-inputfiles"
    ARB_OUTPUT_CONTAINER_NAME = "arb-outputfiles"
    FOUNDRY_PROJECT_ENDPOINT = "https://region.api.cognitive.microsoft.com"
    FOUNDRY_AGENT_ID = "<agent-id>"
    FOUNDRY_API_KEY = "<api-key>"
    KEY_VAULT_ENDPOINT = "https://key-vault.vault.azure.net/"
    Node_ENV = "production"
}

$settingsString = $vars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Join-String -Separator ' '

az functionapp config appsettings set `
  --name <function-app-name> `
  --resource-group <resource-group> `
  --settings $settingsString
```

### Via Azure Portal
1. **Function App** → **Settings** → **Environment variables**
2. Under **App settings**, add each variable
3. Click **Save**

---

## Verification Commands

```powershell
# List all app settings
az functionapp config appsettings list `
  --name <function-app-name> `
  --resource-group <resource-group> `
  --output table

# Test storage connectivity
$connStr = $env:AZURE_STORAGE_CONNECTION_STRING
[Azure.Storage.StorageSharedKeyCredential]::new($connStr)

# Test search connectivity
curl -X GET "https://<search-service>.search.windows.net/indexes" `
  -H "api-key: <search-key>" `
  -H "Content-Type: application/json"

# Test Foundry Agent connectivity
curl -X POST "https://<region>.api.cognitive.microsoft.com/chat/completions" `
  -H "api-key: <foundry-api-key>" `
  -H "Content-Type: application/json"
```

---

## Security Guidelines

✅ **DO:**
- Store secrets in Azure Key Vault
- Use Managed Identity for service-to-service auth
- Rotate API keys every 90 days
- Use connection strings with SAS tokens for short-lived access
- Log all secret access via Azure Monitor

❌ **DON'T:**
- Hardcode secrets in code or config files
- Commit `.env` files to Git
- Share API keys via email or Slack
- Use the same key across environments (dev/staging/prod)
- Print secrets in logs

---

## Troubleshooting

### "Invalid connection string"
- Verify AccountKey is correct: `az storage account keys list --name <storage-account> --resource-group <resource-group>`
- Ensure string starts with `DefaultEndpointsProtocol=https`
- Check for trailing spaces

### "Search service not found"
- Verify endpoint format: `https://<service-name>.search.windows.net` (NOT `http://`)
- Confirm service exists: `az search service list --resource-group <resource-group>`

### "Unauthorized" errors
- Check API key hasn't expired
- Verify Managed Identity has correct RBAC roles
- Review Function App identity: `az functionapp identity show --name <function-app-name> --resource-group <resource-group>`

### Agent not responding
- Verify Foundry project exists and agent is active
- Check Foundry API key is valid
- Review Function App logs for timeout errors
