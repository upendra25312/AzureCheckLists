const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { buildMockFindings } = require("../shared/arb-mock");

async function handleArbGetFindings(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  const reviewId = context?.triggerMetadata?.reviewId || "arb-demo-review";
  return jsonResponse(200, {
    reviewId,
    findings: buildMockFindings(reviewId)
  });
}

app.http("arbGetFindings", {
  route: "arb/reviews/{reviewId}/findings",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbGetFindings
});

module.exports = {
  handleArbGetFindings
};
