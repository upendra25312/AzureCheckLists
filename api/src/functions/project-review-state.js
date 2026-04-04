const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const {
  NOTES_CONTAINER_NAME,
  buildProjectReviewStateBlobName,
  getContainerClient,
  readJsonBlob,
  uploadJsonBlob
} = require("../shared/storage");
const { toProjectReviewStateDocument } = require("../shared/project-review-state");

function createEmptyStateDocument() {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    activePackage: null,
    copilotContext: null
  };
}

app.http("project-review-state-get", {
  route: "project-review-state",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    const { principal, response } = requireAuthenticated(request);

    if (response) {
      return response;
    }

    try {
      const containerClient = await getContainerClient(NOTES_CONTAINER_NAME);
      const blobName = buildProjectReviewStateBlobName(principal.userId);
      const document =
        (await readJsonBlob(containerClient, blobName)) ?? createEmptyStateDocument();

      return jsonResponse(200, document, {
        "Cache-Control": "no-store"
      });
    } catch (error) {
      return jsonResponse(500, {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the saved project review state."
      });
    }
  }
});

app.http("project-review-state-save", {
  route: "project-review-state",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    const { principal, response } = requireAuthenticated(request);

    if (response) {
      return response;
    }

    try {
      const body = await request.json();
      const document = toProjectReviewStateDocument(body);
      const containerClient = await getContainerClient(NOTES_CONTAINER_NAME);
      const blobName = buildProjectReviewStateBlobName(principal.userId);

      await uploadJsonBlob(containerClient, blobName, document);

      return jsonResponse(200, document, {
        "Cache-Control": "no-store"
      });
    } catch (error) {
      return jsonResponse(500, {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save the project review state."
      });
    }
  }
});
