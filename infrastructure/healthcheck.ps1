#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Health check and diagnostics script for Azure Review Assistant backend.
    
.DESCRIPTION
    Validates connectivity to all Azure services required for ARB operation.
    Reports on function app status, storage, search, and Foundry agent.
    
.PARAMETER FunctionAppName
    Name of the Azure Functions app.
    
.PARAMETER ResourceGroup
    Azure resource group containing ARB resources.
    
.PARAMETER SubscriptionId
    Azure subscription ID (optional if default is set).
    
.EXAMPLE
    .\healthcheck.ps1 -FunctionAppName "arb-api-xyz" -ResourceGroup "arb-prod-rg"
#>

param(
    [string]$FunctionAppName = "arb-api",
    [string]$ResourceGroup = "arb-prod-rg",
    [string]$SubscriptionId = ""
)

$ErrorActionPreference = "Continue"
$checks = @()

function Write-Result {
    param(
        [string]$Service,
        [bool]$Status,
        [string]$Message
    )
    
    $icon = if ($Status) { "✓" } else { "✗" }
    $color = if ($Status) { "Green" } else { "Red" }
    Write-Host "$icon $Service`: $Message" -ForegroundColor $color
    $checks += @{ Service = $Service; Status = $Status; Message = $Message }
}

Clear-Host
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Azure Review Assistant - Health Check & Diagnostics" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Check Azure CLI
Write-Host "1. Checking prerequisites..." -ForegroundColor Yellow
try {
    $cliVersion = az --version 2>&1 | Select-Object -First 1
    Write-Result "Azure CLI" $true "v$cliVersion"
} catch {
    Write-Result "Azure CLI" $false "Not installed or not in PATH"
    exit 1
}

# Set subscription if provided
if ($SubscriptionId) {
    az account set --subscription $SubscriptionId
}

# Check authentication
try {
    $account = az account show --query "name" --output tsv 2>&1
    Write-Result "Authentication" $true "Logged in as $account"
} catch {
    Write-Result "Authentication" $false "Not authenticated. Run 'az login'"
    exit 1
}

Write-Host ""
Write-Host "2. Checking Azure Function App..." -ForegroundColor Yellow

# Check Function App exists and is running
try {
    $funcApp = az functionapp show --name $FunctionAppName --resource-group $ResourceGroup --query "state" --output tsv
    $running = $funcApp -eq "Running"
    Write-Result "Function App Status" $running "State: $funcApp"
} catch {
    Write-Result "Function App" $false "Not found or access denied"
}

# Get Function App properties
try {
    $appSettings = az functionapp config appsettings list --name $FunctionAppName --resource-group $ResourceGroup --output json | ConvertFrom-Json
    
    $storageConn = $appSettings | Where-Object { $_.name -eq "AZURE_STORAGE_CONNECTION_STRING" } | Select-Object -First 1
    $searchEndpoint = $appSettings | Where-Object { $_.name -eq "AZURE_SEARCH_ENDPOINT" } | Select-Object -First 1
    $foundryKey = $appSettings | Where-Object { $_.name -eq "FOUNDRY_API_KEY" } | Select-Object -First 1
    
    Write-Result "Storage Connection" ($null -ne $storageConn) "Configured"
    Write-Result "Search Endpoint" ($null -ne $searchEndpoint) "Configured"
    Write-Result "Foundry API Key" ($searchEndpoint -ne $null) "Configured"
} catch {
    Write-Result "App Settings" $false "Could not read configuration"
}

Write-Host ""
Write-Host "3. Checking Storage Account..." -ForegroundColor Yellow

try {
    $storageAccountName = $appSettings | Where-Object { $_.name -eq "AZURE_STORAGE_CONNECTION_STRING" } | Select-Object -ExpandProperty value | 
        Select-String -Pattern "AccountName=([^;]+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    
    if ($storageAccountName) {
        # Check storage account status
        $sa = az storage account show --name $storageAccountName --resource-group $ResourceGroup --query "provisioningState" --output tsv
        Write-Result "Storage Account Status" ($sa -eq "Succeeded") "State: $sa"
        
        # Check containers
        try {
            $inputContainer = az storage container exists --account-name $storageAccountName --name "arb-inputfiles" --query "exists" --output tsv
            Write-Result "Input Files Container" ($inputContainer -eq "true") "arb-inputfiles exists"
        } catch {
            Write-Result "Input Files Container" $false "Cannot access or does not exist"
        }
        
        try {
            $outputContainer = az storage container exists --account-name $storageAccountName --name "arb-outputfiles" --query "exists" --output tsv
            Write-Result "Output Files Container" ($outputContainer -eq "true") "arb-outputfiles exists"
        } catch {
            Write-Result "Output Files Container" $false "Cannot access or does not exist"
        }
    } else {
        Write-Result "Storage Account" $false "Name not found in connection string"
    }
} catch {
    Write-Result "Storage Account" $false $_.Exception.Message
}

Write-Host ""
Write-Host "4. Checking Azure Search..." -ForegroundColor Yellow

try {
    $searchEndpointValue = $appSettings | Where-Object { $_.name -eq "AZURE_SEARCH_ENDPOINT" } | Select-Object -ExpandProperty value
    $searchKey = $appSettings | Where-Object { $_.name -eq "AZURE_SEARCH_KEY" } | Select-Object -ExpandProperty value
    
    if ($searchEndpointValue -and $searchKey) {
        $searchName = $searchEndpointValue -replace "https://", "" -replace ".search.windows.net", ""
        
        # Check search service status
        $searchSvc = az search service show --name $searchName --resource-group $resourceGroup --query "provisioningState" --output tsv 2>&1
        Write-Result "Search Service Status" ($searchSvc -eq "Succeeded") "State: $searchSvc"
        
        # Check index via REST API
        $indexCheckResult = curl -s -X GET "$searchEndpointValue/indexes" `
            -H "api-key: $searchKey" `
            -H "Content-Type: application/json" | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if ($indexCheckResult) {
            $hasArbIndex = $indexCheckResult.value | Where-Object { $_.name -eq "arb-documents" }
            Write-Result "Document Index" ($null -ne $hasArbIndex) "arb-documents exists"
        } else {
            Write-Result "Search API" $false "Could not connect to search endpoint"
        }
    } else {
        Write-Result "Search Configuration" $false "Endpoint or key not configured"
    }
} catch {
    Write-Result "Azure Search" $false $_.Exception.Message
}

Write-Host ""
Write-Host "5. Checking Azure AI Foundry..." -ForegroundColor Yellow

try {
    $foundryEndpoint = $appSettings | Where-Object { $_.name -eq "FOUNDRY_PROJECT_ENDPOINT" } | Select-Object -ExpandProperty value
    $foundryApiKey = $appSettings | Where-Object { $_.name -eq "FOUNDRY_API_KEY" } | Select-Object -ExpandProperty value
    $foundryDeployment = $appSettings | Where-Object { $_.name -eq "FOUNDRY_DEPLOYMENT_NAME" } | Select-Object -ExpandProperty value
    
    Write-Result "Foundry Endpoint Configured" ($null -ne $foundryEndpoint) "Endpoint exists"
    Write-Result "Foundry API Key Configured" ($null -ne $foundryApiKey) "API key exists"
    Write-Result "Foundry Deployment" ($null -ne $foundryDeployment) "Deployment: $($foundryDeployment ?? 'gpt-4')"
    
    # Try test call (basic connectivity check)
    if ($foundryEndpoint -and $foundryApiKey) {
        Write-Host "  (Skipping direct connectivity test - requires valid agent setup)" -ForegroundColor Gray
    }
} catch {
    Write-Result "Azure AI Foundry" $false $_.Exception.Message
}

Write-Host ""
Write-Host "6. Checking Function Endpoints..." -ForegroundColor Yellow

try {
    $funcUrl = "https://$FunctionAppName.azurewebsites.net"
    
    # Get list of functions
    $functions = az functionapp function list --name $FunctionAppName --resource-group $ResourceGroup --output json | ConvertFrom-Json
    $arbFunctions = $functions | Where-Object { $_.name -like "arb*" }
    
    Write-Result "Function Count" ($arbFunctions.Count -gt 0) "Found $($arbFunctions.Count) ARB functions"
    foreach ($func in $arbFunctions) {
        Write-Host "  - $($func.name)" -ForegroundColor Gray
    }
} catch {
    Write-Result "Function List" $false $_.Exception.Message
}

Write-Host ""
Write-Host "7. Checking Key Vault (if configured)..." -ForegroundColor Yellow

try {
    $kvEndpoint = $appSettings | Where-Object { $_.name -eq "KEY_VAULT_ENDPOINT" } | Select-Object -ExpandProperty value
    if ($kvEndpoint) {
        $kvName = $kvEndpoint -replace "https://", "" -replace ".vault.azure.net/", ""
        $kvStatus = az keyvault show --name $kvName --resource-group $resourceGroup --query "properties.provisioningState" --output tsv 2>&1
        Write-Result "Key Vault Status" ($kvStatus -eq "Succeeded") "State: $kvStatus"
    } else {
        Write-Result "Key Vault" $true "Not configured (optional)"
    }
} catch {
    Write-Result "Key Vault" $false $_.Exception.Message
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan

# Summary
$passed = ($checks | Where-Object { $_.Status }).Count
$failed = ($checks | Where-Object { -not $_.Status }).Count
$total = $checks.Count

Write-Host ""
Write-Host "Summary: $passed/$total checks passed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "Failed checks:" -ForegroundColor Red
    $checks | Where-Object { -not $_.Status } | ForEach-Object {
        Write-Host "  • $($_.Service): $($_.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "  1. Review ENVIRONMENT_VARIABLES.md for configuration details"
    Write-Host "  2. Verify all Azure credentials are valid: az account show"
    Write-Host "  3. Check Function App logs: az functionapp log tail --name $FunctionAppName --resource-group $ResourceGroup"
    Write-Host "  4. Verify RBAC roles: az role assignment list --resource-group $ResourceGroup"
}

Write-Host ""
Write-Host "Report generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
