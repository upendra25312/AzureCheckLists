const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
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
    return jsonResponse(error?.statusCode === 400 || error?.statusCode === 404 ? error.statusCode : 500, {
      error: error instanceof Error ? error.message : "Unable to start ARB extraction."
    });
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