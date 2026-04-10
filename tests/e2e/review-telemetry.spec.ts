import { expect, test } from "@playwright/test";

const anonymousPrincipal = {
  clientPrincipal: null
};

const scopedAvailabilityPayload = {
  generatedAt: "2026-04-10T09:00:00.000Z",
  sourceUrl: "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table",
  services: [
    {
      serviceSlug: "azure-front-door",
      serviceName: "Azure Front Door",
      mapped: true,
      matchType: "exact",
      matchedOfferingName: "Azure Front Door",
      matchedServiceLabel: "Azure Front Door",
      matchedSkuHints: [],
      notes: ["Mocked global-service response for telemetry browser coverage."],
      publicRegionCount: 0,
      availableRegionCount: 0,
      unavailableRegionCount: 0,
      restrictedRegionCount: 0,
      earlyAccessRegionCount: 0,
      previewRegionCount: 0,
      retiringRegionCount: 0,
      isGlobalService: true,
      generatedAt: "2026-04-10T09:00:00.000Z",
      availabilitySourceUrl:
        "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table",
      regionsSourceUrl: "https://learn.microsoft.com/en-us/azure/reliability/regions-list",
      regions: [],
      unavailableRegions: [],
      globalSkuStates: [{ skuName: "Azure Front Door Standard", state: "GA" }]
    }
  ]
} as const;

const scopedPricingPayload = {
  generatedAt: "2026-04-10T09:00:00.000Z",
  sourceUrl: "https://prices.azure.com/api/retail/prices",
  services: [
    {
      serviceSlug: "azure-front-door",
      serviceName: "Azure Front Door",
      mapped: true,
      notes: ["Mocked pricing response for telemetry browser coverage."],
      generatedAt: "2026-04-10T09:00:00.000Z",
      sourceUrl: "https://prices.azure.com/api/retail/prices",
      calculatorUrl: "https://azure.microsoft.com/en-us/pricing/calculator/",
      priceDisclaimer:
        "Public retail list pricing from Microsoft. Use the Azure Pricing Calculator after sign-in to layer negotiated rates and monthly usage assumptions.",
      currencyCode: "USD",
      rowCount: 1,
      meterCount: 1,
      skuCount: 1,
      regionCount: 1,
      billingLocationCount: 1,
      targetRegionMatchCount: 1,
      targetPricingLocations: ["East US"],
      startsAtRetailPrice: 35,
      startsAtTargetRetailPrice: 35,
      query: {
        field: "serviceName",
        operator: "contains",
        value: "Azure Front Door",
        source: "matchedOffering"
      },
      rows: [
        {
          meterId: "afd-base-month",
          meterName: "Base",
          productName: "Azure Front Door Standard",
          skuName: "Standard",
          armSkuName: "Standard",
          armRegionName: "eastus",
          location: "East US",
          locationKind: "Region",
          effectiveStartDate: "2026-04-10T09:00:00.000Z",
          unitOfMeasure: "1/Month",
          retailPrice: 35,
          unitPrice: 35,
          tierMinimumUnits: 0,
          currencyCode: "USD",
          type: "Consumption",
          isPrimaryMeterRegion: true
        }
      ]
    }
  ]
} as const;

test("captures homepage start, review creation, scope change, and export telemetry", async ({
  page
}) => {
  const telemetryEvents: Array<Record<string, unknown>> = [];

  await page.route("**/.auth/me", async (route) => {
    await route.fulfill({ json: anonymousPrincipal });
  });

  await page.route("**/api/telemetry", async (route) => {
    telemetryEvents.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status: 202,
      json: {
        recorded: true,
        storageConfigured: true
      }
    });
  });

  await page.route("**/api/availability", async (route) => {
    await route.fulfill({ json: scopedAvailabilityPayload });
  });

  await page.route("**/api/pricing", async (route) => {
    await route.fulfill({ json: scopedPricingPayload });
  });

  await page.goto("/");
  await page.getByRole("textbox", { name: "Project Name (e.g., Greenfield AKS Cluster)" }).fill(
    "Telemetry homepage review"
  );
  await page.getByRole("textbox", { name: "Primary Problem Statement / Business Case" }).fill(
    "Validate the redesigned funnel telemetry."
  );
  await page.getByRole("button", { name: "Initialize Project Review" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Telemetry homepage review is active and ready for service scoping."
    })
  ).toBeVisible({ timeout: 15000 });

  const starterBundleCard = page.locator("article", {
    has: page.getByRole("heading", { name: "Edge web baseline" })
  });
  await starterBundleCard.getByRole("button", { name: "Add bundle to review" }).click();

  await expect(page.getByRole("button", { name: "Download leadership brief" })).toBeVisible({
    timeout: 15000
  });
  await page.getByRole("button", { name: "Download leadership brief" }).click();

  await expect.poll(() => telemetryEvents.length).toBeGreaterThanOrEqual(4);

  const eventNames = telemetryEvents.map((event) => event.name);
  expect(eventNames).toContain("homepage_initialize_review");
  expect(eventNames).toContain("review_create");
  expect(eventNames).toContain("review_scope_change");
  expect(eventNames).toContain("review_export_download");

  expect(
    telemetryEvents.find((event) => event.name === "review_create")?.properties
  ).toMatchObject({
    source: "homepage-initializer"
  });

  expect(
    telemetryEvents.find((event) => event.name === "review_scope_change")?.properties
  ).toMatchObject({
    action: "starter-bundle"
  });

  expect(
    telemetryEvents.find((event) => event.name === "review_export_download")?.properties
  ).toMatchObject({
    artifactType: "leadership-markdown"
  });
});
