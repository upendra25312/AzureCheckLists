const { app } = require("@azure/functions");
const { getClientPrincipal, jsonResponse } = require("../shared/auth");
const {
  NOTES_CONTAINER_NAME,
  buildProjectReviewStateBlobName,
  getContainerClient,
  readJsonBlob
} = require("../shared/storage");
const { normalizeCopilotContext } = require("../shared/project-review-state");
const { runCopilot } = require("../shared/copilot");

async function loadSavedCopilotContext(request) {
  const principal = getClientPrincipal(request);

  if (!principal?.userId) {
    return null;
  }

  const containerClient = await getContainerClient(NOTES_CONTAINER_NAME);
  const blobName = buildProjectReviewStateBlobName(principal.userId);
  const document = await readJsonBlob(containerClient, blobName);

  return normalizeCopilotContext(document?.copilotContext);
}

app.http("copilot", {
  route: "copilot",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    try {
      const body = await request.json();
      const question = String(body?.question ?? "").trim();
      const explicitContext = body?.context;

      if (!question) {
        return jsonResponse(400, {
          error: "A question is required before the project review copilot can answer."
        });
      }

      let context = explicitContext;
      let groundingMode = "project-review-context";

      if (!context?.review || !Array.isArray(context?.services)) {
        context = await loadSavedCopilotContext(request);
        groundingMode = "saved-project-review-context";
      }

      if (!context?.review || !Array.isArray(context?.services)) {
        return jsonResponse(400, {
          error:
            "Project review context is required before the copilot can answer. Sign in and save the active project review to Azure if you want the backend to resolve it automatically."
        });
      }

      const payload = await runCopilot(question, context, {
        groundingMode
      });

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
