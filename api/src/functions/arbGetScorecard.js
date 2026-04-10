const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { getArbScorecard } = require("../shared/arb-review-store");

async function handleArbGetScorecard(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";

    return jsonResponse(200, {
      reviewId,
      scorecard: await getArbScorecard(auth.principal, reviewId)
    });
  } catch (error) {
    return jsonResponse(error?.statusCode === 404 ? 404 : 500, {
      error: error instanceof Error ? error.message : "Unable to load the ARB scorecard."
    });
  }
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
