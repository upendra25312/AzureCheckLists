const { app } = require("@azure/functions");
const { jsonResponse } = require("../shared/auth");
const { requireAdmin } = require("../shared/admin-auth");
const {
  COMMERCIAL_REFRESH_SCHEDULE,
  readRefreshState
} = require("../shared/commercial-cache");
const { getCopilotConfiguration } = require("../shared/copilot");

function buildAdminScope(copilotConfiguration) {
  return {
    resourceGroup: process.env.ADMIN_ALLOWED_RESOURCE_GROUP || "Azure-Review-Checklists-RG",
    staticWebAppName: process.env.ADMIN_STATIC_WEB_APP_NAME || "azure-review-checklists",
    functionAppName:
      process.env.ADMIN_FUNCTION_APP_NAME || process.env.WEBSITE_SITE_NAME || "azure-review-checklists-api",
    openAiResourceName: process.env.ADMIN_OPENAI_RESOURCE_NAME || "azreviewchecklistsopenaicu01",
    openAiDeployment:
      process.env.ADMIN_OPENAI_DEPLOYMENT ||
      copilotConfiguration.deployment ||
      process.env.AZURE_OPENAI_DEPLOYMENT ||
      null,
    region: process.env.ADMIN_SCOPE_REGION || "Central US"
  };
}

app.http("admin-copilot-health", {
  route: "admin/copilot/health",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    const { response } = requireAdmin(request);

    if (response) {
      return response;
    }

    const checkedAt = new Date().toISOString();
    const copilotConfiguration = getCopilotConfiguration();
    const scope = buildAdminScope(copilotConfiguration);

    try {
      const refreshState = await readRefreshState();

      return jsonResponse(
        200,
        {
          status: "Healthy",
          checkedAt,
          scope,
          capabilities: {
            adminRouteProtected: true,
            adminApiReady: true,
            promptExecutionEnabled: false,
            mcpServerConfigured: Boolean(process.env.AZURE_MCP_SERVER_URL),
            copilotConfigured: copilotConfiguration.configured,
            applicationInsightsConfigured: Boolean(
              process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
                process.env.APPINSIGHTS_INSTRUMENTATIONKEY
            ),
            storageConfigured: Boolean(
              process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage
            )
          },
          backend: {
            functionAppName: scope.functionAppName,
            refreshSchedule: COMMERCIAL_REFRESH_SCHEDULE
          },
          notes: [
            "This admin shell is protected for internal administrators only.",
            "Prompt execution is intentionally disabled until read-only Azure MCP tooling is connected.",
            refreshState.manualRefreshEnabled
              ? "Manual refresh is enabled on the dedicated backend."
              : "Manual refresh is disabled until a refresh key is configured."
          ]
        },
        {
          "Cache-Control": "no-store"
        }
      );
    } catch (error) {
      return jsonResponse(
        503,
        {
          status: "Degraded",
          checkedAt,
          scope,
          capabilities: {
            adminRouteProtected: true,
            adminApiReady: false,
            promptExecutionEnabled: false,
            mcpServerConfigured: Boolean(process.env.AZURE_MCP_SERVER_URL),
            copilotConfigured: copilotConfiguration.configured,
            applicationInsightsConfigured: Boolean(
              process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
                process.env.APPINSIGHTS_INSTRUMENTATIONKEY
            ),
            storageConfigured: Boolean(
              process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage
            )
          },
          backend: {
            functionAppName: scope.functionAppName,
            refreshSchedule: COMMERCIAL_REFRESH_SCHEDULE
          },
          notes: [
            error instanceof Error
              ? error.message
              : "Unable to verify the dedicated backend from the admin shell."
          ]
        },
        {
          "Cache-Control": "no-store"
        }
      );
    }
  }
});
