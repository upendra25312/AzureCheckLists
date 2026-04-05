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
  [int]$WarmServiceLimit = 0,
  [string]$ReviewUserTableName = "reviewusers",
  [string]$ProjectReviewTableName = "projectreviews",
  [string]$OpenAiEndpoint = "",
  [string]$OpenAiApiKey = "",
  [string]$OpenAiDeployment = "",
  [string]$OpenAiModelName = "gpt-4.1-mini",
  [string]$OpenAiApiVersion = "2024-10-21",
  [string]$AdminOpenAiResourceName = "",
  [string]$AdminScopeRegion = "Central US",
  [string]$AzureMcpServerUrl = "",
  [string]$CommercialRefreshKey = ""
)

$ErrorActionPreference = "Stop"

function Test-AzureCliResourceExists {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Command
  )

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $output = & az @Command 2>$null
    return $LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($output | Out-String))
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

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
$functionAppExists = Test-AzureCliResourceExists -Command @(
  "functionapp", "show",
  "--name", $FunctionAppName,
  "--resource-group", $ResourceGroupName,
  "--query", "id",
  "--output", "tsv"
)

if ($functionAppExists) {
  Write-Host "Function App already exists; skipping create."
} else {
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
}

$storageConnectionString = az storage account show-connection-string `
  --name $StorageAccountName `
  --resource-group $ResourceGroupName `
  --query connectionString `
  --output tsv

Write-Host "Setting application settings..."
$appSettings = @(
  "AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString",
  "AZURE_STORAGE_REVIEW_CONTAINER_NAME=review-notes",
  "AZURE_STORAGE_REVIEW_ARTIFACT_CONTAINER_NAME=review-artifacts",
  "AZURE_STORAGE_COMMERCIAL_CACHE_CONTAINER_NAME=commercial-data-cache",
  "AZURE_STORAGE_REVIEW_USER_TABLE_NAME=$ReviewUserTableName",
  "AZURE_STORAGE_PROJECT_REVIEW_TABLE_NAME=$ProjectReviewTableName",
  "AZURE_COMMERCIAL_REFRESH_SCHEDULE=$CommercialRefreshSchedule",
  "AZURE_COMMERCIAL_CACHE_TTL_HOURS=$CommercialCacheTtlHours",
  "AZURE_AVAILABILITY_CACHE_TTL_HOURS=$CommercialCacheTtlHours",
  "AZURE_PRICING_CACHE_TTL_HOURS=$CommercialCacheTtlHours",
  "AZURE_COMMERCIAL_WARM_SERVICE_INDEX_URL=$WarmServiceIndexUrl",
  "AZURE_COMMERCIAL_WARM_SERVICE_LIMIT=$WarmServiceLimit",
  "ADMIN_ALLOWED_RESOURCE_GROUP=$ResourceGroupName",
  "ADMIN_STATIC_WEB_APP_NAME=$StaticWebAppName",
  "ADMIN_FUNCTION_APP_NAME=$FunctionAppName",
  "ADMIN_SCOPE_REGION=$AdminScopeRegion"
)

if ($CommercialRefreshKey) {
  $appSettings += "AZURE_COMMERCIAL_REFRESH_KEY=$CommercialRefreshKey"
}

if ($OpenAiEndpoint) {
  $appSettings += "AZURE_OPENAI_ENDPOINT=$OpenAiEndpoint"
}

if ($OpenAiApiKey) {
  $appSettings += "AZURE_OPENAI_API_KEY=$OpenAiApiKey"
}

if ($OpenAiDeployment) {
  $appSettings += "AZURE_OPENAI_DEPLOYMENT=$OpenAiDeployment"
  $appSettings += "ADMIN_OPENAI_DEPLOYMENT=$OpenAiDeployment"
}

if ($OpenAiModelName) {
  $appSettings += "AZURE_OPENAI_MODEL_NAME=$OpenAiModelName"
}

if ($OpenAiApiVersion) {
  $appSettings += "AZURE_OPENAI_API_VERSION=$OpenAiApiVersion"
}

if ($AdminOpenAiResourceName) {
  $appSettings += "ADMIN_OPENAI_RESOURCE_NAME=$AdminOpenAiResourceName"
}

if ($AzureMcpServerUrl) {
  $appSettings += "AZURE_MCP_SERVER_URL=$AzureMcpServerUrl"
}

az functionapp config appsettings set `
  --name $FunctionAppName `
  --resource-group $ResourceGroupName `
  --settings $appSettings `
  --only-show-errors | Out-Null

$functionResourceId = az functionapp show `
  --name $FunctionAppName `
  --resource-group $ResourceGroupName `
  --query id `
  --output tsv

Write-Host "Linking Function App to Static Web App..."
$linkedBackendId = az staticwebapp show `
  --name $StaticWebAppName `
  --resource-group $ResourceGroupName `
  --query "linkedBackends[0].backendResourceId" `
  --output tsv

if ($linkedBackendId -eq $functionResourceId) {
  Write-Host "Static Web App is already linked to the target Function App; skipping link."
} else {
  az staticwebapp functions link `
    --name $StaticWebAppName `
    --resource-group $ResourceGroupName `
    --function-resource-id $functionResourceId `
    --force `
    --only-show-errors | Out-Null
}

Write-Host "Dedicated backend is ready."
Write-Host "Static Web App: $StaticWebAppName"
Write-Host "Function App: $FunctionAppName"
Write-Host "Commercial refresh schedule: $CommercialRefreshSchedule"
Write-Host "Commercial cache TTL hours: $CommercialCacheTtlHours"
Write-Host "Review user table: $ReviewUserTableName"
Write-Host "Project review table: $ProjectReviewTableName"
Write-Host "Next step: deploy the backend code with Azure Functions Core Tools, for example:"
Write-Host "  func azure functionapp publish $FunctionAppName --javascript --no-build --force"
