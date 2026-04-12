metadata description = 'Azure Review Assistant - Infrastructure as Code (Bicep)'
metadata author = 'Cloud Architecture Team'

param location string = resourceGroup().location
param environment string = 'prod'
param appName string = 'arb'
param functionAppName string = '${appName}-api-${uniqueString(resourceGroup().id)}'
param storageAccountName string = '${appName}storage${uniqueString(resourceGroup().id)}'
param searchServiceName string = '${appName}-search-${uniqueString(resourceGroup().id)}'
param keyVaultName string = '${appName}-kv-${uniqueString(resourceGroup().id)}'

@minLength(3)
@maxLength(24)
param projectName string = 'AzureReviewAssistant'

// ============================================================================
// Variables
// ============================================================================

var storageApiVersion = '2023-01-01'
var functionApiVersion = '2023-11-01'
var searchApiVersion = '2023-11-01'
var tableStorageConnectionStringResource = '${storageAccount.id}/listKeys(2021-06-01)'
var functionWorkerRuntime = 'node'
var functionNodeVersion = '20'

// ============================================================================
// Resources
// ============================================================================

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
  }
}

// Input Files Container
resource inputContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: storageAccount::blobServices
  name: 'arb-inputfiles'
  properties: {
    publicAccess: 'None'
  }
}

// Output Files Container
resource outputContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: storageAccount::blobServices
  name: 'arb-outputfiles'
  properties: {
    publicAccess: 'None'
  }
}

// Table Storage for Metadata
resource storageAccountTables 'Microsoft.Storage/storageAccounts/tableServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource reviewsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  parent: storageAccountTables
  name: 'arbreviews'
}

resource exportsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  parent: storageAccountTables
  name: 'arbexports'
}

// Azure Search Service
resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchServiceName
  location: location
  sku: {
    name: 'standard'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'Enabled'
  }
}

// Search Index
resource searchIndex 'Microsoft.Search/searchServices/indexes@2023-11-01' = {
  parent: searchService
  name: 'arb-documents'
  properties: {
    fields: [
      {
        name: 'id'
        type: 'Edm.String'
        key: true
      }
      {
        name: 'reviewId'
        type: 'Edm.String'
        filterable: true
        facetable: true
      }
      {
        name: 'fileId'
        type: 'Edm.String'
        filterable: true
      }
      {
        name: 'fileName'
        type: 'Edm.String'
        searchable: true
      }
      {
        name: 'logicalCategory'
        type: 'Edm.String'
        filterable: true
        facetable: true
      }
      {
        name: 'chunkIndex'
        type: 'Edm.Int32'
      }
      {
        name: 'content'
        type: 'Edm.String'
        searchable: true
      }
    ]
    scoringProfiles: []
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: []
    enableRbacAuthorization: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: false
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${listKeys(storageAccount.id, storageApiVersion).keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${listKeys(storageAccount.id, storageApiVersion).keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: 'arb-api-${uniqueString(resourceGroup().id)}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: functionWorkerRuntime
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'Node_ENV'
          value: environment
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${listKeys(storageAccount.id, storageApiVersion).keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'AZURE_SEARCH_ENDPOINT'
          value: 'https://${searchServiceName}.search.windows.net'
        }
        {
          name: 'AZURE_SEARCH_KEY'
          value: listAdminKeys(searchService.id, searchApiVersion).primaryKey
        }
        {
          name: 'AZURE_SEARCH_INDEX_NAME'
          value: 'arb-documents'
        }
        {
          name: 'TABLE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${listKeys(storageAccount.id, storageApiVersion).keys[0].value];EndpointSuffix=core.windows.net'
        }
        {
          name: 'ARB_INPUT_CONTAINER_NAME'
          value: 'arb-inputfiles'
        }
        {
          name: 'ARB_OUTPUT_CONTAINER_NAME'
          value: 'arb-outputfiles'
        }
        {
          name: 'KEY_VAULT_ENDPOINT'
          value: keyVault.properties.vaultUri
        }
      ]
      linuxFxVersion: 'node|${functionNodeVersion}'
      http20Enabled: true
      cors: {
        allowedOrigins: [
          '*'
        ]
      }
    }
  }
}

// Outputs
output functionAppName string = functionApp.name
output functionAppId string = functionApp.id
output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output searchServiceName string = searchService.name
output searchServiceEndpoint string = 'https://${searchServiceName}.search.windows.net'
output keyVaultUri string = keyVault.properties.vaultUri
output functionAppPrincipalId string = functionApp.identity.principalId
