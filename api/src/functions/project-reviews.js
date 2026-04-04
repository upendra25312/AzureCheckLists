const { app } = require("@azure/functions");
const { jsonResponse, requireAuthenticated } = require("../shared/auth");
const {
  activateProjectReview,
  listProjectReviews
} = require("../shared/project-review-store");

app.http("project-reviews-get", {
  route: "project-reviews",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request) => {
    const { principal, response } = requireAuthenticated(request);

    if (response) {
      return response;
    }

    try {
      const payload = await listProjectReviews(principal);

      return jsonResponse(200, payload, {
        "Cache-Control": "no-store"
      });
    } catch (error) {
      return jsonResponse(500, {
        error:
          error instanceof Error
            ? error.message
            : "Unable to list saved project reviews."
      });
    }
  }
});

app.http("project-reviews-activate", {
  route: "project-reviews/activate",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    const { principal, response } = requireAuthenticated(request);

    if (response) {
      return response;
    }

    try {
      const body = await request.json();
      const reviewId = String(body?.reviewId ?? "").trim();

      if (!reviewId) {
        return jsonResponse(400, {
          error: "A reviewId is required before the active project review can be changed."
        });
      }

      const payload = await activateProjectReview(principal, reviewId);

      return jsonResponse(200, payload, {
        "Cache-Control": "no-store"
      });
    } catch (error) {
      return jsonResponse(error?.statusCode === 404 ? 404 : 500, {
        error:
          error instanceof Error
            ? error.message
            : "Unable to activate the selected project review."
      });
    }
  }
});
