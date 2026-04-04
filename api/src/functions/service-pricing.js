const { app } = require("@azure/functions");
const { jsonResponse } = require("../shared/auth");
const { RETAIL_PRICES_API_URL } = require("../shared/azure-live-data");
const { getServicePricing } = require("../shared/service-pricing");

const MAX_SERVICES_PER_REQUEST = 20;

async function handlePricing(request) {
  try {
    const body = await request.json();
    const services = Array.isArray(body?.services) ? body.services : [];

    if (services.length === 0) {
      return jsonResponse(400, {
        error: "At least one service is required to load pricing."
      });
    }

    const requestedServices = services.slice(0, MAX_SERVICES_PER_REQUEST);
    const pricing = [];

    for (const service of requestedServices) {
      pricing.push(
        await getServicePricing(service, {
          refreshedBy: "request",
          targetRegions: service.targetRegions ?? []
        })
      );
    }

    return jsonResponse(
      200,
      {
        generatedAt: new Date().toISOString(),
        sourceUrl: RETAIL_PRICES_API_URL,
        services: pricing
      },
      {
        "Cache-Control": "public, max-age=1800"
      }
    );
  } catch (error) {
    return jsonResponse(500, {
      error:
        error instanceof Error
          ? error.message
          : "Unable to load Azure Retail Prices API data."
    });
  }
}

app.http("pricing", {
  route: "pricing",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handlePricing
});

app.http("service-pricing", {
  route: "service-pricing",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: handlePricing
});

module.exports = {
  handlePricing
};
