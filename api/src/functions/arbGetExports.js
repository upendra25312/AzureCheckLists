const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { listArbExports } = require("../shared/arb-review-store");

async function handleArbGetExports(request) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";
    return jsonResponse(200, {
      reviewId,
      exports: await listArbExports(auth.principal, reviewId)
    });
  } catch (error) {
    return jsonResponse(error?.statusCode === 404 ? 404 : 500, {
      error: error instanceof Error ? error.message : "Unable to load ARB reviewed outputs."
    });
  }
}

app.http("arbGetExports", {
  route: "arb/reviews/{reviewId}/exports",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbGetExports
});

module.exports = {
  handleArbGetExports
};