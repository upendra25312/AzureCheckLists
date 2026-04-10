const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const { buildMockReview } = require("../shared/arb-mock");

async function handleArbCreateReview(request) {
  const auth = requireAuthenticated(request);
  if (auth.response) {
    return auth.response;
  }

  const body = await request.json().catch(() => ({}));
  const reviewId = body.projectCode ? `arb-${body.projectCode}` : "arb-demo-review";
  const review = buildMockReview(reviewId);

  return jsonResponse(201, {
    review,
    message: "ARB review scaffold created. Replace mock storage with persisted review creation."
  });
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
