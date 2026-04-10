const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");

async function handleArbRecordDecision(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  const reviewId = context?.triggerMetadata?.reviewId || "arb-demo-review";
  const body = await request.json().catch(() => ({}));

  return jsonResponse(200, {
    reviewId,
    decision: {
      aiRecommendation: "Approved with Conditions",
      reviewerDecision: body.finalDecision || "Approved with Conditions",
      rationale: body.rationale || "Decision scaffold recorded. Replace with persisted reviewer decision log.",
      recordedAt: new Date().toISOString()
    }
  });
}

app.http("arbRecordDecision", {
  route: "arb/reviews/{reviewId}/decision",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handleArbRecordDecision
});

module.exports = {
  handleArbRecordDecision
};
