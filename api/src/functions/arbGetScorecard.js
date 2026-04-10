const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { buildMockReview } = require("../shared/arb-mock");

async function handleArbGetScorecard(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  const reviewId = context?.triggerMetadata?.reviewId || "arb-demo-review";
  const review = buildMockReview(reviewId);

  return jsonResponse(200, {
    reviewId,
    scorecard: {
      overallScore: review.overallScore,
      recommendation: review.recommendation,
      confidence: "Medium",
      criticalBlockers: 0,
      domainScores: [
        {
          domain: "Requirements Coverage",
          weight: 20,
          score: 16,
          reason: "Baseline requirement mapping scaffold."
        },
        {
          domain: "Security",
          weight: 20,
          score: 12,
          reason: "Security rationale scaffold."
        }
      ]
    }
  });
}

app.http("arbGetScorecard", {
  route: "arb/reviews/{reviewId}/scorecard",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbGetScorecard
});

module.exports = {
  handleArbGetScorecard
};
