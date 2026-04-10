const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { createArbAction } = require("../shared/arb-review-store");

async function handleArbCreateAction(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";
    const body = await request.json().catch(() => ({}));

    return jsonResponse(200, {
      reviewId,
      action: await createArbAction(auth.principal, reviewId, body)
    });
  } catch (error) {
    return jsonResponse(
      error?.statusCode === 400 || error?.statusCode === 404 || error?.statusCode === 409
        ? error.statusCode
        : 500,
      {
        error: error instanceof Error ? error.message : "Unable to create the ARB action."
      }
    );
  }
}

app.http("arbCreateAction", {
  route: "arb/reviews/{reviewId}/actions",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handleArbCreateAction
});

module.exports = {
  handleArbCreateAction
};