const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { createArbReview } = require("../shared/arb-review-store");

async function handleArbCreateReview(request) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const review = await createArbReview(auth.principal, body);

    return jsonResponse(201, {
      review,
      message: "ARB review persisted to Azure Table Storage."
    });
  } catch (error) {
    return jsonResponse(error?.statusCode === 404 || error?.statusCode === 409 ? error.statusCode : 500, {
      error: error instanceof Error ? error.message : "Unable to create the ARB review."
    });
  }
}

app.http("arbCreateReview", {
  route: "arb/reviews",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handleArbCreateReview
});

module.exports = {
  handleArbCreateReview
};
