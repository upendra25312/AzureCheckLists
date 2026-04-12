metadata description = 'Static Web App Configuration and API Backend Integration'

param location string = resourceGroup().location
param staticWebAppName string = 'arb-swa'
param functionAppResourceId string

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    provider: 'GitHub'
    enterpriseGradeCdnStatus: 'Enabled'
    stagingEnvironmentPolicy: 'Enabled'
  }
}

// Link Function App as Backend API
resource backendLinked 'Microsoft.Web/staticSites/linkedBackends@2023-01-01' = {
  parent: staticWebApp
  name: 'api'
  properties: {
    backendResourceId: functionAppResourceId
    region: location
  }
}

output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
