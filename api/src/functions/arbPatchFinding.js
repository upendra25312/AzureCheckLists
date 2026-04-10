const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { updateArbFinding } = require("../shared/arb-review-store");

async function handleArbPatchFinding(request, context) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const reviewId = request.params?.reviewId || "demo-review";
    const findingId = request.params?.findingId;
    const body = await request.json().catch(() => ({}));

    return jsonResponse(200, {
      reviewId,
      finding: await updateArbFinding(auth.principal, reviewId, findingId, body)
    });
  } catch (error) {
    return jsonResponse(error?.statusCode === 404 ? 404 : 500, {
      error: error instanceof Error ? error.message : "Unable to update the ARB finding."
    });
  }
}

app.http("arbPatchFinding", {
  route: "arb/reviews/{reviewId}/findings/{findingId}",
  methods: ["PATCH"],
  authLevel: "anonymous",
  handler: handleArbPatchFinding
});

module.exports = {
  handleArbPatchFinding
};