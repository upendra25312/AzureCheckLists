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
const { runArbAgentReview, getFoundryConfiguration } = require("../shared/arb-foundry-agent");
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

  // Pull top keywords from requirements and evidence text (skip stop-words, short tokens)
  const stopWords = new Set(["the","a","an","and","or","for","to","of","in","on","at","is","are","be","with","from","that","this","by","as","its","it","will","we","our","all","any","not","have","has","can"]);
  const allText = [
    ...requirements.slice(0, 20).map((r) => r.normalizedText ?? ""),
    ...evidence.slice(0, 15).map((e) => e.summary ?? "")
  ].join(" ");

  allText.split(/\W+/).forEach((tok) => {
    const t = tok.trim().toLowerCase();
    if (t.length >= 5 && !stopWords.has(t)) terms.add(tok.trim());
  });

  // Always anchor on Azure ARB frameworks
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

async function handleArbRunAgentReview(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) return auth.response;

  const reviewId = request.params?.reviewId || "demo-review";
  const traceId = crypto.randomUUID();
  const t0 = Date.now();

  function log(msg, extra = {}) {
    context.log(JSON.stringify({ traceId, reviewId, msg, ...extra }));
  }

  try {
    const foundryConfig = getFoundryConfiguration();
    if (!foundryConfig.configured) {
      log("Foundry not configured", { status: 503 });
      return jsonResponse(503, {
        error: "Foundry agent is not configured on this deployment.",
        configured: false
      });
    }

    log("Agent review started");

    // Load all review data
    const [review, files, requirementsList, evidenceList, actionsList] = await Promise.all([
      getArbReview(auth.principal, reviewId),
      getArbFiles(auth.principal, reviewId),
      getArbRequirements(auth.principal, reviewId),
      getArbEvidence(auth.principal, reviewId),
      getArbActions(auth.principal, reviewId)
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

    log("Review data loaded", { files: files.length, extracted: extractedFiles.length, requirements: requirementsList.length, evidence: evidenceList.length });

    // Build a review-specific search query from actual extracted text
    // rather than a static generic phrase, so retrieval is grounded in the
    // customer's own document vocabulary.
    const searchQuery = buildArbSearchQuery(review, requirementsList, evidenceList);

    // Ensure search index exists and query for relevant chunks
    await ensureArbSearchIndex();
    const searchChunks = await searchArbDocuments(reviewId, searchQuery, 12);

    log("Search complete", { query: searchQuery.slice(0, 80), chunks: searchChunks.length });

    // Run the agent review
    const agentResult = await runArbAgentReview({
      review,
      files,
      requirements: requirementsList,
      evidence: evidenceList,
      searchChunks
    });

    log("Agent invoked", { durationMs: Date.now() - t0 });

    if (!agentResult.success) {
      log("Agent returned failure", { reason: agentResult.reason, status: 502 });
      return jsonResponse(502, {
        error: `Agent review did not complete successfully${agentResult.reason ? `: ${agentResult.reason}` : "."}`,
        reason: agentResult.reason
      });
    }

    log("Agent succeeded", {
      findings: agentResult.findings?.length ?? 0,
      score: agentResult.scorecard?.overallScore ?? null,
      recommendation: agentResult.recommendation,
      durationMs: Date.now() - t0
    });

    // Resolve evidence-to-finding traceability:
    // The agent returns evidenceIds[] referencing IDs from the evidence list shown in the
    // prompt. Cross-reference them here so each finding carries structured evidence links
    // (evidenceId, summary, sourceFileName) rather than just a free-text evidenceBasis.
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
        // Fallback: if agent returned no IDs, do a keyword match against evidenceBasis
        if (finding.evidenceFound.length === 0 && finding.evidenceBasis) {
          const basis = finding.evidenceBasis.toLowerCase();
          finding.evidenceFound = evidenceList
            .filter((e) => {
              const summary = (e.summary ?? "").toLowerCase();
              // Match if >3 words from the evidenceBasis appear in this evidence summary
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
        delete finding.evidenceIds; // not stored — resolved into evidenceFound
      }
    }

    // Persist agent findings and scorecard into Table Storage
    const client = await getTableClient(ARB_REVIEW_TABLE_NAME);
    const now = new Date().toISOString();
    const userId = auth.principal.userId;

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

    const syncedOutputs = await syncArbReviewedOutputs({
      principal: auth.principal,
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

    // Update review summary row with agent recommendation and state
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
      findingsCount: agentResult.findings?.length ?? 0,
      recommendation: agentResult.recommendation,
      overallScore: agentResult.scorecard?.overallScore ?? null,
      confidenceLevel: agentResult.scorecard?.confidenceLevel ?? null,
      generatedAt: now,
      artifactsGenerated: syncedOutputs.artifacts.length
    });
  } catch (error) {
    const statusCode = error?.statusCode === 400 || error?.statusCode === 404 ? error.statusCode : 500;
    // Log full error details for diagnostics
    log("Agent review failed", {
      statusCode,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error && error.stack ? error.stack : undefined,
      traceId,
      durationMs: Date.now() - t0
    });
    // Return detailed error to frontend for troubleshooting (only in non-production or admin mode)
    const isProduction = process.env.NODE_ENV === "production";
    return jsonResponse(statusCode, {
      error: statusCode === 500
        ? `Agent review failed due to an internal error.${!isProduction ? `\n${error instanceof Error ? error.message : String(error)}` : ""}`
        : (error instanceof Error ? error.message : "Agent review failed."),
      traceId,
      details: !isProduction ? (error instanceof Error ? error.stack : String(error)) : undefined
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
