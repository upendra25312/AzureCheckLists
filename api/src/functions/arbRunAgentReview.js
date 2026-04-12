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

function getRowKey(baseKey, userId) {
  return `${baseKey}|${encodeTableKey(userId)}`;
}

function getPartitionKey(reviewId) {
  return reviewId;
}

async function handleArbRunAgentReview(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) return auth.response;

  const reviewId = request.params?.reviewId || "demo-review";

  try {
    const foundryConfig = getFoundryConfiguration();
    if (!foundryConfig.configured) {
      return jsonResponse(503, {
        error: "Foundry agent is not configured on this deployment.",
        configured: false
      });
    }

    // Load all review data
    const [review, files, requirementsList, evidenceList, actionsList] = await Promise.all([
      getArbReview(auth.principal, reviewId),
      getArbFiles(auth.principal, reviewId),
      getArbRequirements(auth.principal, reviewId),
      getArbEvidence(auth.principal, reviewId),
      getArbActions(auth.principal, reviewId)
    ]);

    if (!review) {
      return jsonResponse(404, { error: "Review not found." });
    }

    if (files.length === 0) {
      return jsonResponse(400, { error: "Upload and extract files before running the agent review." });
    }

    const extractedFiles = files.filter((f) => f.extractionStatus === "Completed");
    if (extractedFiles.length === 0) {
      return jsonResponse(400, { error: "Run extraction before triggering the agent review." });
    }

    // Ensure search index exists and query for relevant chunks
    await ensureArbSearchIndex();
    const searchChunks = await searchArbDocuments(
      reviewId,
      `${review.projectName || ""} Azure architecture security reliability`,
      12
    );

    context.log(`[ARB Agent] review=${reviewId} files=${files.length} chunks=${searchChunks.length}`);

    // Run the agent review
    const agentResult = await runArbAgentReview({
      review,
      files,
      requirements: requirementsList,
      evidence: evidenceList,
      searchChunks
    });

    if (!agentResult.success) {
      return jsonResponse(502, {
        error: "Agent review did not complete successfully.",
        reason: agentResult.reason,
        rawResponse: agentResult.rawResponse ?? undefined
      });
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

    return jsonResponse(200, {
      reviewId,
      agentReviewCompleted: true,
      findingsCount: agentResult.findings?.length ?? 0,
      recommendation: agentResult.recommendation,
      overallScore: agentResult.scorecard?.overallScore ?? null,
      confidenceLevel: agentResult.scorecard?.confidenceLevel ?? null,
      generatedAt: now,
      artifactsGenerated: syncedOutputs.artifacts.length
    });
  } catch (error) {
    return jsonResponse(
      error?.statusCode === 400 || error?.statusCode === 404 ? error.statusCode : 500,
      { error: error instanceof Error ? error.message : "Agent review failed." }
    );
  }
}

app.http("arbRunAgentReview", {
  route: "arb/reviews/{reviewId}/run-agent-review",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handleArbRunAgentReview
});

module.exports = { handleArbRunAgentReview };
