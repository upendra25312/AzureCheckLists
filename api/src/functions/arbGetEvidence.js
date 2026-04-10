const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { getArbEvidence } = require("../shared/arb-review-store");

async function handleArbGetEvidence(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";
    return jsonResponse(200, {
      reviewId,
      evidence: await getArbEvidence(auth.principal, reviewId)
    });
  } catch (error) {
    return jsonResponse(error?.statusCode === 404 ? 404 : 500, {
      error: error instanceof Error ? error.message : "Unable to load ARB evidence."
    });
  }
}

app.http("arbGetEvidence", {
  route: "arb/reviews/{reviewId}/evidence",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbGetEvidence
});

module.exports = {
  handleArbGetEvidence
};