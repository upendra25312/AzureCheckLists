const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { getArbRequirements } = require("../shared/arb-review-store");

async function handleArbGetRequirements(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";
    return jsonResponse(200, {
      reviewId,
      requirements: await getArbRequirements(auth.principal, reviewId)
    });
  } catch (error) {
    return jsonResponse(error?.statusCode === 404 ? 404 : 500, {
      error: error instanceof Error ? error.message : "Unable to load ARB requirements."
    });
  }
}

app.http("arbGetRequirements", {
  route: "arb/reviews/{reviewId}/requirements",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbGetRequirements
});

module.exports = {
  handleArbGetRequirements
};