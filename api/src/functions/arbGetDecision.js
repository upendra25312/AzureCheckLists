const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { getArbDecision } = require("../shared/arb-review-store");

async function handleArbGetDecision(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";

    return jsonResponse(200, {
      reviewId,
      decision: await getArbDecision(auth.principal, reviewId)
    });
  } catch (error) {
    return jsonResponse(error?.statusCode === 404 ? 404 : 500, {
      error: error instanceof Error ? error.message : "Unable to load the ARB decision."
    });
  }
}

app.http("arbGetDecision", {
  route: "arb/reviews/{reviewId}/decision",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbGetDecision
});

module.exports = {
  handleArbGetDecision
};