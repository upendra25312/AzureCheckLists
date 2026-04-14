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

/**
 * Build a review-specific search query that blends the project name, customer,
 * target regions, and the most discriminating terms from extracted requirements
 * and evidence — capped at 200 chars so it stays within search query limits.
 */
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

// SWA proxy hard-kills the linked backend at ~230s with a plain-text
// "Backend call failure" that the frontend cannot parse as JSON.
// We self-terminate the ENTIRE pipeline at 180s and return a valid
// JSON fallback response so SWA's proxy never sees plain text.
// The dedicated Function App backend (not SWA-linked) has no proxy timeout,
// but we still cap at 180s to keep the UX responsive.
const PIPELINE_TIMEOUT_MS = 180_000;

async function runReviewPipeline({ principal, reviewId, traceId, log }) {
  const t0 = Date.now();
  const foundryConfig = getFoundryConfiguration();
  if (!foundryConfig.configured) {
    log("Foundry not configured", { status: 503 });
    return jsonResponse(503, {
      error: "Foundry agent is not configured on this deployment.",
      configured: false
    });
  }

  log("Agent review started");

  // Load all review data in parallel
  const [review, files, requirementsList, evidenceList, actionsList] = await Promise.all([
    getArbReview(principal, reviewId),
    getArbFiles(principal, reviewId),
    getArbRequirements(principal, reviewId),
    getArbEvidence(principal, reviewId),
    getArbActions(principal, reviewId)
  ]);

  if (!review) {
    log("Review not found", { status: 404 });
    return jsonResponse(404, { error: "Review not found." });
  }

  if (files.length === 0) {
    return jsonResponse(400, { error: "Upload and extract files before running the agent review." });
  }

  const extractedFiles = files.filter((f) => f.extractionStatus === "Completed");
  if (extractedFiles.length === 0) {
    return jsonResponse(400, { error: "Run extraction before triggering the agent review." });
  }

  log("Review data loaded", {
    files: files.length,
    extracted: extractedFiles.length,
    requirements: requirementsList.length,
    evidence: evidenceList.length
  });

  // Build search query and retrieve document chunks
  const searchQuery = buildArbSearchQuery(review, requirementsList, evidenceList);
  await ensureArbSearchIndex();
  const searchChunks = await searchArbDocuments(reviewId, searchQuery, 12);
  log("Search complete", { query: searchQuery.slice(0, 80), chunks: searchChunks.length });

  // Run AI agent assessment — always returns success (uses fallback on any failure)
  let agentResult = await runArbAgentReview({
    review,
    files,
    requirements: requirementsList,
    evidence: evidenceList,
    searchChunks
  });

  if (!agentResult.success) {
    log("Agent returned failure — using fallback", { reason: agentResult.reason });
    agentResult = {
      ...buildFallbackAgentReview({
        review,
        requirements: requirementsList,
        evidence: evidenceList,
        reason: agentResult.reason ?? "AI assessment unavailable"
      }),
      success: true,
      fallbackUsed: true
    };
  }

  log("Agent succeeded", {
    findings: agentResult.findings?.length ?? 0,
    score: agentResult.scorecard?.overallScore ?? null,
    recommendation: agentResult.recommendation,
    durationMs: Date.now() - t0,
    fallback: agentResult.fallbackUsed ?? false
  });

  // Resolve evidence traceability: map evidenceIds to full evidence objects
  if (agentResult.findings && evidenceList.length > 0) {
    const evidenceById = new Map(evidenceList.map((e) => [e.evidenceId, e]));
    for (const finding of agentResult.findings) {
      const ids = Array.isArray(finding.evidenceIds) ? finding.evidenceIds : [];
      finding.evidenceFound = ids
        .map((id) => evidenceById.get(id))
        .filter(Boolean)
        .map((e) => ({
          evidenceId: e.evidenceId,
          summary: e.summary,
          sourceFileName: e.sourceFileName,
          sourceFileId: e.sourceFileId,
          factType: e.factType
        }));
      if (finding.evidenceFound.length === 0 && finding.evidenceBasis) {
        const basis = finding.evidenceBasis.toLowerCase();
        finding.evidenceFound = evidenceList
          .filter((e) => {
            const summary = (e.summary ?? "").toLowerCase();
            const words = basis.split(/\s+/).filter((w) => w.length > 4);
            return words.filter((w) => summary.includes(w)).length >= 3;
          })
          .slice(0, 5)
          .map((e) => ({
            evidenceId: e.evidenceId,
            summary: e.summary,
            sourceFileName: e.sourceFileName,
            sourceFileId: e.sourceFileId,
            factType: e.factType
          }));
      }
      delete finding.evidenceIds;
    }
  }

  // Persist findings + scorecard to Table Storage
  const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
  const now = new Date().toISOString();
  const userId = principal.userId;

  if (agentResult.findings && agentResult.findings.length > 0) {
    await client.upsertEntity(
      {
        partitionKey: getPartitionKey(reviewId),
        rowKey: getRowKey("FINDINGS", userId),
        findingsJson: JSON.stringify(agentResult.findings)
      },
      "Replace"
    );
  }

  if (agentResult.scorecard) {
    await client.upsertEntity(
      {
        partitionKey: getPartitionKey(reviewId),
        rowKey: getRowKey("SCORECARD", userId),
        overallScore: agentResult.scorecard.overallScore,
        recommendation: agentResult.scorecard.recommendation,
        criticalBlockerCount: agentResult.scorecard.criticalBlockerCount,
        missingEvidenceCount: agentResult.scorecard.missingEvidenceCount,
        confidenceLevel: agentResult.scorecard.confidenceLevel,
        dimensionScoresJson: JSON.stringify(agentResult.scorecard.dimensionScores),
        reviewSummary: agentResult.scorecard.reviewSummary,
        strengthsJson: JSON.stringify(agentResult.scorecard.strengths),
        missingEvidenceJson: JSON.stringify(agentResult.scorecard.missingEvidence),
        criticalBlockersJson: JSON.stringify(agentResult.scorecard.criticalBlockers),
        nextActionsJson: JSON.stringify(agentResult.scorecard.nextActions),
        evidenceReadinessState: review.evidenceReadinessState,
        source: "agent",
        generatedAt: now
      },
      "Replace"
    );
  }

  // Generate export artifacts (markdown, csv, html)
  // buildAiSummary inside syncArbReviewedOutputs has its own 30s timeout via copilot.js
  const syncedOutputs = await syncArbReviewedOutputs({
    principal,
    review: {
      ...review,
      workflowState: "Review In Progress",
      agentRecommendation: agentResult.recommendation ?? null,
      agentReviewedAt: now,
      lastUpdated: now
    },
    files,
    requirements: requirementsList,
    evidence: evidenceList,
    findings: agentResult.findings ?? [],
    scorecard: agentResult.scorecard ?? null,
    actions: actionsList,
    formats: ["markdown", "csv", "html"],
    generatedAt: now,
    existingExports: []
  });

  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey("EXPORTS", userId),
      exportsJson: JSON.stringify(syncedOutputs.exportsList)
    },
    "Replace"
  );

  // Update review summary row
  await client.upsertEntity(
    {
      partitionKey: getPartitionKey(reviewId),
      rowKey: getRowKey("SUMMARY", userId),
      workflowState: "Review In Progress",
      agentRecommendation: agentResult.recommendation ?? null,
      agentReviewedAt: now,
      lastUpdated: now
    },
    "Merge"
  );

  log("Persisted results", { durationMs: Date.now() - t0 });

  return jsonResponse(200, {
    reviewId,
    traceId,
    agentReviewCompleted: true,
    fallbackUsed: agentResult.fallbackUsed ?? false,
    findingsCount: agentResult.findings?.length ?? 0,
    recommendation: agentResult.recommendation,
    overallScore: agentResult.scorecard?.overallScore ?? null,
    confidenceLevel: agentResult.scorecard?.confidenceLevel ?? null,
    generatedAt: now,
    artifactsGenerated: syncedOutputs.artifacts.length
  });
}

async function handleArbRunAgentReview(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) return auth.response;

  const reviewId = request.params?.reviewId || "demo-review";
  const traceId = crypto.randomUUID();
  const t0 = Date.now();

  function log(msg, extra = {}) {
    context.log(JSON.stringify({ traceId, reviewId, msg, ...extra }));
  }

  // Race the entire pipeline against a hard ceiling.
  // If the pipeline does not complete within PIPELINE_TIMEOUT_MS, we cancel
  // and return a fallback JSON response so SWA's proxy never sees plain text.
  let pipelineTimedOut = false;
  let _pipelineTimeoutHandle;

  const timeoutPromise = new Promise((resolve) => {
    _pipelineTimeoutHandle = setTimeout(() => {
      pipelineTimedOut = true;
      log("Pipeline hard timeout — returning fallback", { elapsed: Date.now() - t0 });
      resolve(jsonResponse(200, {
        reviewId,
        traceId,
        agentReviewCompleted: true,
        fallbackUsed: true,
        findingsCount: 1,
        recommendation: "Needs Revision",
        overallScore: 60,
        confidenceLevel: "Low",
        generatedAt: new Date().toISOString(),
        artifactsGenerated: 0,
        note: "Assessment timed out — provisional result. Re-run to get full AI findings."
      }));
    }, PIPELINE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      runReviewPipeline({ principal: auth.principal, reviewId, traceId, log }),
      timeoutPromise
    ]);

    clearTimeout(_pipelineTimeoutHandle);
    return result;
  } catch (error) {
    clearTimeout(_pipelineTimeoutHandle);
    if (pipelineTimedOut) {
      // Timeout already returned a response — this catch is from the pipeline
      // continuing in the background; swallow it.
      return jsonResponse(200, {
        reviewId, traceId, agentReviewCompleted: true, fallbackUsed: true,
        findingsCount: 0, recommendation: "Needs Revision", overallScore: 60,
        confidenceLevel: "Low", generatedAt: new Date().toISOString(), artifactsGenerated: 0
      });
    }

    const statusCode = error?.statusCode === 400 || error?.statusCode === 404 ? error.statusCode : 500;
    log("Agent review failed", {
      statusCode,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error && error.stack ? error.stack : undefined,
      traceId,
      durationMs: Date.now() - t0
    });

    return jsonResponse(statusCode, {
      error: statusCode === 500
        ? `Agent review failed: ${error instanceof Error ? error.message : String(error)}`
        : (error instanceof Error ? error.message : "Agent review failed."),
      traceId
    });
  }
}

app.http("arbRunAgentReview", {
  route: "arb/reviews/{reviewId}/run-agent-review",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handleArbRunAgentReview
});

module.exports = { handleArbRunAgentReview };
