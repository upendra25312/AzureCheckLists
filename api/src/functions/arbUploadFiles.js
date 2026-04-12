const { app } = require("@azure/functions");
const { getBoundary, parse } = require("parse-multipart-data");
const { jsonResponse, requireAuthenticated, safeErrorResponse } = require("../shared/auth");
const { uploadArbFiles } = require("../shared/arb-review-store");

async function parseMultipartFiles(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return [];
  }

  const boundary = getBoundary(contentType);

  if (!boundary) {
    return [];
  }

  const bodyBuffer = Buffer.from(await request.arrayBuffer());
  const parts = parse(bodyBuffer, boundary);
  const fields = new Map();

  for (const part of parts) {
    if (!part.filename) {
      fields.set(part.name, part.data.toString("utf8"));
    }
  }

  return parts
    .filter((part) => part.name === "files" && part.filename)
    .map((part) => ({
      fileName: part.filename,
      contentType: part.type,
      logicalCategory: fields.get(`logicalCategory:${part.filename}`),
      sourceRole: fields.get(`sourceRole:${part.filename}`),
      contentBuffer: part.data
    }));
}

async function handleArbUploadFiles(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";
    const files = await parseMultipartFiles(request);

    const result = await uploadArbFiles(auth.principal, reviewId, files);

    return jsonResponse(201, {
      reviewId,
      files: result.files,
      addedCount: result.addedCount,
      evidenceReadinessState: result.evidenceReadinessState,
      readiness: result.readiness
    });
  } catch (error) {
    return safeErrorResponse(error, "Unable to upload ARB files.", context);
  }
}

app.http("arbUploadFiles", {
  route: "arb/reviews/{reviewId}/uploads",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handleArbUploadFiles
});

module.exports = {
  handleArbUploadFiles
};