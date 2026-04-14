const crypto = require("node:crypto");
const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const {
  getArbReview,
  getArbFiles,
  getArbRequirements,
  getArbEvidence,
  getArbActions,
  syncArbReviewedOutputs
} = require("../shared/arb-review-store");
const { searchArbDocuments, ensureArbSearchIndex } = require("../shared/arb-search");
const { runArbAgentReview, getFoundryConfiguration, buildFallbackAgentReview } = require("../shared/arb-foundry-agent");
const { getTableClient, ARB_REVIEW_TABLE_NAME, encodeTableKey } = require("../shared/table-storage");

function buildArbSearchQuery(review, requirements, evidence) {
  const terms = new Set();
  if (review.projectName) review.projectName.split(/\s+/).forEach((t) => terms.add(t));
  if (review.customerName) review.customerName.split(/\s+/).forEach((t) => terms.add(t));
  (review.targetRegions ?? []).forEach((r) => terms.add(r));
  const stopWords = new Set(["the","a","an","and","or","for","to","of","in","on","at","is","are","be","with","from","that","this","by","as","its","it","will","we","our","all","any","not","have","has","can"]);
  const allText = [
    ...requirements.slice(0, 20).map((r) => r.normalizedText ?? ""),
    ...evidence.slice(0, 15).map((e) => e.summary ?? "")
  ].join(" ");
  allText.split(/\W+/).forEach((tok) => {
    const t = tok.trim().toLowerCase();
    if (t.length >= 5 && !stopWords.has(t)) terms.add(tok.trim());
  });
  const base = "Azure architecture security reliability WAF CAF";
  const extra = [...terms].slice(0, 20).join(" ");
  return `${base} ${extra}`.slice(0, 200).trim();
}

function getRowKey(baseKey, userId) {
  return `${baseKey}|${encodeTableKey(userId)}`;
}

function getPartitionKey(reviewId) {
  return encodeTableKey(reviewId);
}

// ─── In-memory job tracker ───
// Stores { status, traceId, error, startedAt, completedAt } per reviewId|userId
const activeJobs = new Map();

function jobKey(reviewId, userId) {
  return `${reviewId}|${userId}`;
}

async function runReviewPipeline({ principal, reviewId, traceId, log }) {
  const t0 = Date.now();
  const foundryConfig = getFoundryConfiguration();
  if (!foundryConfig.configured) {
    throw Object.assign(new Error("Foundry agent is not configured on this deployment."), { statusCode: 503 });
  }

  log("Agent review started");

  const [review, files, requirementsList, evidenceList, actionsList] = await Promise.all([
    getArbReview(principal, reviewId),
    getArbFiles(principal, reviewId),
    getArbRequirements(principal, reviewId),
    getArbEvidence(principal, reviewId),
    getArbActions(principal, reviewId)
  ]);

  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }
  if (files.length === 0) {
    throw Object.assign(new Error("Upload and extract files before running the agent review."), { statusCode: 400 });
  }
  const extractedFiles = files.filter((f) => f.extractionStatus === "Completed");
  if (extractedFiles.length === 0) {
    throw Object.assign(new Error("Run extraction before triggering the agent review."), { statusCode: 400 });
  }

  log("Review data loaded", {
    files: files.length, extracted: extractedFiles.length,
    requirements: requirementsList.length, evidence: evidenceList.length
  });

  const searchQuery = buildArbSearchQuery(review, requirementsList, evidenceList);
  await ensureArbSearchIndex();
  const searchChunks = await searchArbDocuments(reviewId, searchQuery, 12);
  log("Search complete", { query: searchQuery.slice(0, 80), chunks: searchChunks.length });

  // Run automated agent assessment — no timeout pressure since this runs in the background
  let agentResult = await runArbAgentReview({
    review, files, requirements: requirementsList, evidence: evidenceList, searchChunks
  });

  if (!agentResult.success) {
    log("Agent returned failure — using fallback", { reason: agentResult.reason });
    agentResult = {
      ...buildFallbackAgentReview({
        review, requirements: requirementsList, evidence: evidenceList,
        reason: agentResult.reason ?? "Automated assessment unavailable"
      }),
      success: true, fallbackUsed: true
    };
  }

  log("Agent succeeded", {
    findings: agentResult.findings?.length ?? 0,
    score: agentResult.scorecard?.overallScore ?? null,
    recommendation: agentResult.recommendation,
    durationMs: Date.now() - t0,
    fallback: agentResult.fallbackUsed ?? false
  });

  // Resolve evidence traceability
  if (agentResult.findings && evidenceList.length > 0) {
    const evidenceById = new Map(evidenceList.map((e) => [e.evidenceId, e]));
    for (const finding of agentResult.findings) {
      const ids = Array.isArray(finding.evidenceIds) ? finding.evidenceIds : [];
      finding.evidenceFound = ids
        .map((id) => evidenceById.get(id)).filter(Boolean)
        .map((e) => ({ evidenceId: e.evidenceId, summary: e.summary, sourceFileName: e.sourceFileName, sourceFileId: e.sourceFileId, factType: e.factType }));
      if (finding.evidenceFound.length === 0 && finding.evidenceBasis) {
        const basis = finding.evidenceBasis.toLowerCase();
        finding.evidenceFound = evidenceList
          .filter((e) => { const s = (e.summary ?? "").toLowerCase(); const w = basis.split(/\s+/).filter((w) => w.length > 4); return w.filter((w) => s.includes(w)).length >= 3; })
          .slice(0, 5)
          .map((e) => ({ evidenceId: e.evidenceId, summary: e.summary, sourceFileName: e.sourceFileName, sourceFileId: e.sourceFileId, factType: e.factType }));
      }
      delete finding.evidenceIds;
    }
  }

  // Persist findings + scorecard + exports
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const now = new Date().toISOString();
  const userId = principal.userId;

  if (agentResult.findings && agentResult.findings.length > 0) {
    await client.upsertEntity({ partitionKey: getPartitionKey(reviewId), rowKey: getRowKey("FINDINGS", userId), findingsJson: JSON.stringify(agentResult.findings) }, "Replace");
  }

  if (agentResult.scorecard) {
    await client.upsertEntity({
      partitionKey: getPartitionKey(reviewId), rowKey: getRowKey("SCORECARD", userId),
      overallScore: agentResult.scorecard.overallScore, recommendation: agentResult.scorecard.recommendation,
      criticalBlockerCount: agentResult.scorecard.criticalBlockerCount, missingEvidenceCount: agentResult.scorecard.missingEvidenceCount,
      confidenceLevel: agentResult.scorecard.confidenceLevel, dimensionScoresJson: JSON.stringify(agentResult.scorecard.dimensionScores),
      reviewSummary: agentResult.scorecard.reviewSummary, strengthsJson: JSON.stringify(agentResult.scorecard.strengths),
      missingEvidenceJson: JSON.stringify(agentResult.scorecard.missingEvidence), criticalBlockersJson: JSON.stringify(agentResult.scorecard.criticalBlockers),
      nextActionsJson: JSON.stringify(agentResult.scorecard.nextActions), evidenceReadinessState: review.evidenceReadinessState,
      source: "agent", generatedAt: now
    }, "Replace");
  }

  const syncedOutputs = await syncArbReviewedOutputs({
    principal,
    review: { ...review, workflowState: "Review In Progress", agentRecommendation: agentResult.recommendation ?? null, agentReviewedAt: now, lastUpdated: now },
    files, requirements: requirementsList, evidence: evidenceList,
    findings: agentResult.findings ?? [], scorecard: agentResult.scorecard ?? null,
    actions: actionsList, formats: ["markdown", "csv", "html"], generatedAt: now, existingExports: []
  });

  await client.upsertEntity({ partitionKey: getPartitionKey(reviewId), rowKey: getRowKey("EXPORTS", userId), exportsJson: JSON.stringify(syncedOutputs.exportsList) }, "Replace");
  await client.upsertEntity({ partitionKey: getPartitionKey(reviewId), rowKey: getRowKey("SUMMARY", userId), workflowState: "Review In Progress", agentRecommendation: agentResult.recommendation ?? null, agentReviewedAt: now, lastUpdated: now }, "Merge");

  log("Persisted results", { durationMs: Date.now() - t0 });

  return {
    agentReviewCompleted: true,
    fallbackUsed: agentResult.fallbackUsed ?? false,
    findingsCount: agentResult.findings?.length ?? 0,
    recommendation: agentResult.recommendation,
    overallScore: agentResult.scorecard?.overallScore ?? null,
    confidenceLevel: agentResult.scorecard?.confidenceLevel ?? null,
    generatedAt: now,
    artifactsGenerated: syncedOutputs.artifacts.length
  };
}

// ─── POST handler: starts the job and returns immediately ───
async function handleArbRunAgentReview(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) return auth.response;

  const reviewId = request.params?.reviewId || "demo-review";
  const traceId = crypto.randomUUID();
  const key = jobKey(reviewId, auth.principal.userId);

  function log(msg, extra = {}) {
    context.log(JSON.stringify({ traceId, reviewId, msg, ...extra }));
  }

  // If a job is already running for this review, return its status
  const existing = activeJobs.get(key);
  if (existing && existing.status === "running") {
    return jsonResponse(200, {
      reviewId, traceId: existing.traceId, status: "running",
      startedAt: existing.startedAt,
      message: "Assessment is already in progress. Poll the status endpoint."
    });
  }

  // Mark job as running
  const job = { status: "running", traceId, startedAt: new Date().toISOString(), completedAt: null, result: null, error: null };
  activeJobs.set(key, job);

  // Fire and forget — the pipeline runs in the background with no timeout
  runReviewPipeline({ principal: auth.principal, reviewId, traceId, log })
    .then((result) => {
      const j = activeJobs.get(key);
      if (j && j.traceId === traceId) {
        j.status = "completed";
        j.completedAt = new Date().toISOString();
        j.result = result;
      }
      log("Background pipeline completed", { durationMs: Date.now() - new Date(job.startedAt).getTime() });
    })
    .catch((error) => {
      const j = activeJobs.get(key);
      if (j && j.traceId === traceId) {
        j.status = "failed";
        j.completedAt = new Date().toISOString();
        j.error = error instanceof Error ? error.message : String(error);
      }
      log("Background pipeline failed", { error: error instanceof Error ? error.message : String(error) });
    });

  // Return immediately — frontend will poll for status
  return jsonResponse(202, {
    reviewId,
    traceId,
    status: "running",
    startedAt: job.startedAt,
    message: "Assessment started. Poll /api/arb/reviews/{reviewId}/agent-status for progress."
  });
}

// ─── GET handler: returns current job status ───
async function handleArbAgentStatus(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) return auth.response;

  const reviewId = request.params?.reviewId || "demo-review";
  const key = jobKey(reviewId, auth.principal.userId);
  const job = activeJobs.get(key);

  if (!job) {
    return jsonResponse(200, { reviewId, status: "idle", message: "No assessment has been started for this review." });
  }

  if (job.status === "running") {
    const elapsed = Date.now() - new Date(job.startedAt).getTime();
    return jsonResponse(200, {
      reviewId, traceId: job.traceId, status: "running",
      startedAt: job.startedAt, elapsedMs: elapsed,
      message: "Assessment is in progress."
    });
  }

  if (job.status === "completed") {
    // Clean up after delivering the result
    activeJobs.delete(key);
    return jsonResponse(200, {
      reviewId, traceId: job.traceId, status: "completed",
      startedAt: job.startedAt, completedAt: job.completedAt,
      ...job.result
    });
  }

  if (job.status === "failed") {
    activeJobs.delete(key);
    return jsonResponse(200, {
      reviewId, traceId: job.traceId, status: "failed",
      startedAt: job.startedAt, completedAt: job.completedAt,
      error: job.error
    });
  }

  return jsonResponse(200, { reviewId, status: job.status });
}

app.http("arbRunAgentReview", {
  route: "arb/reviews/{reviewId}/run-agent-review",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handleArbRunAgentReview
});

app.http("arbAgentStatus", {
  route: "arb/reviews/{reviewId}/agent-status",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbAgentStatus
});

module.exports = { handleArbRunAgentReview, handleArbAgentStatus };
