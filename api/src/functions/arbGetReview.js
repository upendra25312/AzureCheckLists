const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { buildMockReview } = require("../shared/arb-mock");

async function handleArbGetReview(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  const reviewId = context?.triggerMetadata?.reviewId || "arb-demo-review";
  return jsonResponse(200, {
    review: buildMockReview(reviewId)
  });
}

app.http("arbGetReview", {
  route: "arb/reviews/{reviewId}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbGetReview
});

module.exports = {
  handleArbGetReview
};
