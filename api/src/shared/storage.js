const { BlobServiceClient } = require("@azure/storage-blob");

const NOTES_CONTAINER_NAME =
  process.env.AZURE_STORAGE_REVIEW_CONTAINER_NAME || "review-notes";
const ARTIFACTS_CONTAINER_NAME =
  process.env.AZURE_STORAGE_REVIEW_ARTIFACT_CONTAINER_NAME || "review-artifacts";
const COMMERCIAL_CACHE_CONTAINER_NAME =
  process.env.AZURE_STORAGE_COMMERCIAL_CACHE_CONTAINER_NAME || "commercial-data-cache";

function getBlobServiceClient() {
  const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage;

  if (!connectionString) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING or AzureWebJobsStorage is required for Azure-backed review storage."
    );
  }

  return BlobServiceClient.fromConnectionString(connectionString);
}

function sanitizePathSegment(value) {
  return String(value ?? "unknown")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function getContainerClient(name) {
  const client = getBlobServiceClient().getContainerClient(name);

  await client.createIfNotExists();
  return client;
}

async function readJsonBlob(containerClient, blobName) {
  const blobClient = containerClient.getBlobClient(blobName);

  if (!(await blobClient.exists())) {
    return null;
  }

  const download = await blobClient.download();
  const chunks = [];

  for await (const chunk of download.readableStreamBody) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function uploadJsonBlob(containerClient, blobName, payload) {
  const blobClient = containerClient.getBlockBlobClient(blobName);
  const body = JSON.stringify(payload, null, 2);

  await blobClient.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: {
      blobContentType: "application/json; charset=utf-8"
    }
  });

  return blobClient;
}

async function uploadTextBlob(containerClient, blobName, body, contentType) {
  const blobClient = containerClient.getBlockBlobClient(blobName);

  await blobClient.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: {
      blobContentType: contentType
    }
  });

  return blobClient;
}

function buildNotesBlobName(userId) {
  return `${sanitizePathSegment(userId)}/review-records.json`;
}

function buildProjectReviewStateBlobName(userId) {
  return `${sanitizePathSegment(userId)}/project-review-state.json`;
}

function buildProjectReviewBlobName(userId, reviewId) {
  return `${sanitizePathSegment(userId)}/project-reviews/${sanitizePathSegment(reviewId)}.json`;
}

function buildArtifactBlobName(userId, filename) {
  return `${sanitizePathSegment(userId)}/${filename}`;
}

module.exports = {
  ARTIFACTS_CONTAINER_NAME,
  COMMERCIAL_CACHE_CONTAINER_NAME,
  NOTES_CONTAINER_NAME,
  buildArtifactBlobName,
  buildNotesBlobName,
  buildProjectReviewBlobName,
  buildProjectReviewStateBlobName,
  getContainerClient,
  readJsonBlob,
  sanitizePathSegment,
  uploadJsonBlob,
  uploadTextBlob
};
