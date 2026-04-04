const { app } = require("@azure/functions");
const { jsonResponse } = require("../shared/auth");
const { requireAdmin } = require("../shared/admin-auth");
const { getCopilotConfiguration } = require("../shared/copilot");

app.http("admin-copilot", {
  route: "admin/copilot",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    const { response } = requireAdmin(request);

    if (response) {
      return response;
    }

    const copilotConfiguration = getCopilotConfiguration();
    const body = await request.json().catch(() => ({}));
    const question =
      typeof body?.question === "string" && body.question.trim()
        ? body.question.trim()
        : "Admin copilot prompt execution requested.";

    return jsonResponse(
      501,
      {
        answer:
          "The protected admin shell is live, but prompt execution is not enabled yet. The next pass will connect read-only Azure MCP tools for internal diagnostics.",
        generatedAt: new Date().toISOString(),
        modelName: copilotConfiguration.modelName,
        modelDeployment: copilotConfiguration.deployment ?? null,
        sources: [
          {
            label: "Admin copilot shell",
            note: "Prompt execution is intentionally disabled in this first protected release."
          }
        ],
        toolCalls: [
          {
            tool: "admin-shell",
            status: "skipped",
            detail: question
          }
        ],
        promptExecutionEnabled: false,
        error: "Admin copilot prompt execution is not enabled yet."
      },
      {
        "Cache-Control": "no-store"
      }
    );
  }
});
