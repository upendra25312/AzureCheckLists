const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated, safeErrorResponse } = require("../shared/auth");
const { startArbExtraction } = require("../shared/arb-review-store");

async function handleArbStartExtraction(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";
    return jsonResponse(202, {
      reviewId,
      extraction: await startArbExtraction(auth.principal, reviewId)
    });
  } catch (error) {
    return safeErrorResponse(error, "Unable to start ARB extraction.", context);
  }
}

app.http("arbStartExtraction", {
  route: "arb/reviews/{reviewId}/extract",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handleArbStartExtraction
});

module.exports = {
  handleArbStartExtraction
};