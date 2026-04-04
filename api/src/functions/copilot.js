const { app } = require("@azure/functions");
const { jsonResponse } = require("../shared/auth");
const { runCopilot } = require("../shared/copilot");

app.http("copilot", {
  route: "copilot",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      const body = await request.json();
      const question = String(body?.question ?? "").trim();
      const context = body?.context;

      if (!question) {
        return jsonResponse(400, {
          error: "A question is required before the project review copilot can answer."
        });
      }

      if (!context?.review || !Array.isArray(context?.services)) {
        return jsonResponse(400, {
          error: "Project review context is required before the copilot can answer."
        });
      }

      const payload = await runCopilot(question, context);

      return jsonResponse(200, payload, {
        "Cache-Control": "no-store"
      });
    } catch (error) {
      return jsonResponse(500, {
        error:
          error instanceof Error
            ? error.message
            : "Unable to run the Azure Checklists copilot."
      });
    }
  }
});
