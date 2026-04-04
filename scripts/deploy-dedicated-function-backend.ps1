param(
  [string]$ResourceGroupName = "Azure-Review-Checklists-RG",
  [string]$StaticWebAppName = "azure-review-checklists",
  [string]$FunctionAppName = "azure-review-checklists-api",
  [string]$StorageAccountName = "azreviewcheckapi01",
  [string]$Location = "centralus",
  [int]$MaximumInstanceCount = 10,
  [int]$InstanceMemoryMb = 512,
  [string]$CommercialRefreshSchedule = "0 0 7 * * 1",
  [int]$CommercialCacheTtlHours = 168,
  [string]$WarmServiceIndexUrl = "",
  [int]$WarmServiceLimit = 0
)

$ErrorActionPreference = "Stop"

Write-Host "Ensuring Static Web App is on Standard SKU..."
az staticwebapp update `
  --name $StaticWebAppName `
  --resource-group $ResourceGroupName `
  --sku Standard `
  --only-show-errors | Out-Null

Write-Host "Creating storage account if needed..."
az storage account create `
  --name $StorageAccountName `
  --resource-group $ResourceGroupName `
  --location $Location `
  --sku Standard_LRS `
  --kind StorageV2 `
  --allow-blob-public-access false `
  --min-tls-version TLS1_2 `
  --only-show-errors | Out-Null

Write-Host "Creating dedicated Azure Function App on Flex Consumption..."
az functionapp create `
  --resource-group $ResourceGroupName `
  --name $FunctionAppName `
  --storage-account $StorageAccountName `
  --flexconsumption-location $Location `
  --runtime node `
  --runtime-version 22 `
  --functions-version 4 `
  --instance-memory $InstanceMemoryMb `
  --maximum-instance-count $MaximumInstanceCount `
  --https-only true `
  --only-show-errors | Out-Null

$storageConnectionString = az storage account show-connection-string `
  --name $StorageAccountName `
  --resource-group $ResourceGroupName `
  --query connectionString `
  --output tsv

Write-Host "Setting application settings..."
az functionapp config appsettings set `
  --name $FunctionAppName `
  --resource-group $ResourceGroupName `
  --settings `
    "AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString" `
    "AZURE_STORAGE_REVIEW_CONTAINER_NAME=review-notes" `
    "AZURE_STORAGE_REVIEW_ARTIFACT_CONTAINER_NAME=review-artifacts" `
    "AZURE_STORAGE_COMMERCIAL_CACHE_CONTAINER_NAME=commercial-data-cache" `
    "AZURE_COMMERCIAL_REFRESH_SCHEDULE=$CommercialRefreshSchedule" `
    "AZURE_COMMERCIAL_CACHE_TTL_HOURS=$CommercialCacheTtlHours" `
    "AZURE_AVAILABILITY_CACHE_TTL_HOURS=$CommercialCacheTtlHours" `
    "AZURE_PRICING_CACHE_TTL_HOURS=$CommercialCacheTtlHours" `
    "AZURE_COMMERCIAL_WARM_SERVICE_INDEX_URL=$WarmServiceIndexUrl" `
    "AZURE_COMMERCIAL_WARM_SERVICE_LIMIT=$WarmServiceLimit" `
  --only-show-errors | Out-Null

$functionResourceId = az functionapp show `
  --name $FunctionAppName `
  --resource-group $ResourceGroupName `
  --query id `
  --output tsv

Write-Host "Linking Function App to Static Web App..."
az staticwebapp functions link `
  --name $StaticWebAppName `
  --resource-group $ResourceGroupName `
  --function-resource-id $functionResourceId `
  --force `
  --only-show-errors | Out-Null

Write-Host "Dedicated backend is ready."
Write-Host "Static Web App: $StaticWebAppName"
Write-Host "Function App: $FunctionAppName"
Write-Host "Commercial refresh schedule: $CommercialRefreshSchedule"
Write-Host "Commercial cache TTL hours: $CommercialCacheTtlHours"
Write-Host "Next step: deploy the backend code with Azure Functions Core Tools, for example:"
Write-Host "  func azure functionapp publish $FunctionAppName --javascript --no-build --force"
