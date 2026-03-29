const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const {
  NOTES_CONTAINER_NAME,
  buildNotesBlobName,
  getContainerClient,
  readJsonBlob,
  uploadJsonBlob
} = require("../shared/storage");
const { toReviewDocument } = require("../shared/review-records");

app.http("review-records-get", {
  route: "review-records",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    const { principal, response } = requireAuthenticated(request);

    if (response) {
      return response;
    }

    try {
      const containerClient = await getContainerClient(NOTES_CONTAINER_NAME);
      const blobName = buildNotesBlobName(principal.userId);
      const document =
        (await readJsonBlob(containerClient, blobName)) ??
        toReviewDocument([]);

      return jsonResponse(200, document, {
        "Cache-Control": "no-store"
      });
    } catch (error) {
      return jsonResponse(500, {
        error: error instanceof Error ? error.message : "Unable to load saved review records."
      });
    }
  }
});

app.http("review-records-save", {
  route: "review-records",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    const { principal, response } = requireAuthenticated(request);

    if (response) {
      return response;
    }

    try {
      const body = await request.json();
      const document = toReviewDocument(body?.records);
      const containerClient = await getContainerClient(NOTES_CONTAINER_NAME);
      const blobName = buildNotesBlobName(principal.userId);

      await uploadJsonBlob(containerClient, blobName, document);

      return jsonResponse(200, document, {
        "Cache-Control": "no-store"
      });
    } catch (error) {
      return jsonResponse(500, {
        error: error instanceof Error ? error.message : "Unable to save review records."
      });
    }
  }
});
