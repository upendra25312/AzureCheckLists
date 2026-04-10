const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { listArbReviews } = require("../shared/arb-review-store");

async function handleArbListReviews(request) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    return jsonResponse(200, await listArbReviews(auth.principal), {
      "Cache-Control": "no-store"
    });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unable to list ARB reviews."
    });
  }
}

app.http("arbListReviews", {
  route: "arb/reviews",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: handleArbListReviews
});

module.exports = {
  handleArbListReviews
};