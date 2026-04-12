const { app } = require("@azure/functions");
const { getBoundary, parse } = require("parse-multipart-data");
const { jsonResponse, requireAuthenticated, safeErrorResponse } = require("../shared/auth");
const { uploadArbFiles } = require("../shared/arb-review-store");

// 64 MB is generous for live document review. Larger uploads should be staged
// via chunked/resumable upload rather than a single HTTP POST to a Consumption
// plan Function. Reject early rather than letting the worker OOM silently.
const BODY_SIZE_LIMIT_BYTES = 64 * 1024 * 1024;

async function parseMultipartFiles(request, context) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return [];
  }

  const boundary = getBoundary(contentType);

  if (!boundary) {
    return [];
  }

  // Guard: reject requests that are clearly oversized before buffering.
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > BODY_SIZE_LIMIT_BYTES) {
    const limitMb = Math.round(BODY_SIZE_LIMIT_BYTES / (1024 * 1024));
    const sizeMb = Math.round(contentLength / (1024 * 1024));
    if (context) {
      context.log(JSON.stringify({ msg: "Upload rejected: body too large", contentLength, limitMb, sizeMb }));
    }
    const err = new Error(`Upload is too large (${sizeMb} MB). The per-request limit is ${limitMb} MB. Upload files in smaller batches.`);
    err.statusCode = 413;
    throw err;
  }

  // Read the entire body. Safe up to ~64 MB; larger uploads rejected above.
  let bodyBuffer;
  try {
    bodyBuffer = Buffer.from(await request.arrayBuffer());
  } catch (readError) {
    const msg = readError instanceof Error ? readError.message : String(readError);
    if (context) {
      context.log(JSON.stringify({ msg: "Upload body read failed", error: msg }));
    }
    const err = new Error(`Unable to read the uploaded request body: ${msg}. Try uploading fewer or smaller files.`);
    err.statusCode = 400;
    throw err;
  }

  // Secondary check on the actual buffered size.
  if (bodyBuffer.byteLength > BODY_SIZE_LIMIT_BYTES) {
    const limitMb = Math.round(BODY_SIZE_LIMIT_BYTES / (1024 * 1024));
    const sizeMb = Math.round(bodyBuffer.byteLength / (1024 * 1024));
    const err = new Error(`Upload is too large (${sizeMb} MB). The per-request limit is ${limitMb} MB. Upload files in smaller batches.`);
    err.statusCode = 413;
    throw err;
  }

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

  // Emit a synchronous entry trace so App Insights has proof we reached user
  // code even if a subsequent await exhausts worker memory and kills the process.
  context.log(JSON.stringify({
    msg: "arbUploadFiles invoked",
    reviewId: request.params?.reviewId,
    contentLength: request.headers.get("content-length"),
    contentType: (request.headers.get("content-type") ?? "").slice(0, 80)
  }));

  try {
    const reviewId = request.params?.reviewId || "demo-review";
    const files = await parseMultipartFiles(request, context);

    const result = await uploadArbFiles(auth.principal, reviewId, files);

    context.log(JSON.stringify({
      msg: "arbUploadFiles success",
      reviewId,
      filesAdded: result.addedCount,
      totalFiles: result.files.length
    }));

    return jsonResponse(201, {
      reviewId,
      files: result.files,
      addedCount: result.addedCount,
      evidenceReadinessState: result.evidenceReadinessState,
      readiness: result.readiness
    });
  } catch (error) {
    context.log(JSON.stringify({
      msg: "arbUploadFiles error",
      status: error?.statusCode ?? 500,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? (error.stack ?? "").split("\n").slice(0, 6).join(" | ") : undefined
    }));
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