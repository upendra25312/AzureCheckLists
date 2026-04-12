import { expect, test } from "@playwright/test";

const availabilityResponse = {
  generatedAt: "2026-04-09T16:30:00.000Z",
  sourceUrl: "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table",
  services: [
    {
      serviceSlug: "azure-front-door",
      serviceName: "Azure Front Door",
      mapped: false,
      matchedOfferingName: "Azure Front Door",
      matchedServiceLabel: "Azure Front Door",
      matchedSkuHints: [],
      notes: ["Mocked availability mapping pending for browser validation."],
      publicRegionCount: 0,
      availableRegionCount: 0,
      unavailableRegionCount: 0,
      restrictedRegionCount: 0,
      earlyAccessRegionCount: 0,
      previewRegionCount: 0,
      retiringRegionCount: 0,
      isGlobalService: false,
      generatedAt: "2026-04-09T16:30:00.000Z",
      availabilitySourceUrl:
        "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table",
      regionsSourceUrl: "https://learn.microsoft.com/en-us/azure/reliability/regions-list",
      regions: [],
      unavailableRegions: [],
      globalSkuStates: []
    }
  ]
} as const;

const pricingResponse = {
  generatedAt: "2026-04-09T16:30:00.000Z",
  sourceUrl: "https://prices.azure.com/api/retail/prices",
  services: [
    {
      serviceSlug: "azure-front-door",
      serviceName: "Azure Front Door",
      mapped: false,
      notes: ["Mocked pricing mapping pending for browser validation."],
      generatedAt: "2026-04-09T16:30:00.000Z",
      sourceUrl: "https://prices.azure.com/api/retail/prices",
      calculatorUrl: "https://azure.microsoft.com/en-us/pricing/calculator/",
      priceDisclaimer:
        "Public retail list pricing from Microsoft. Use the Azure Pricing Calculator after sign-in to layer negotiated rates and monthly usage assumptions.",
      currencyCode: "USD",
      rowCount: 0,
      meterCount: 0,
      skuCount: 0,
      regionCount: 0,
      billingLocationCount: 0,
      targetRegionMatchCount: 0,
      targetPricingLocations: [],
      rows: []
    }
  ]
} as const;

test.describe("route theme rollout smoke", () => {
  test("renders the service detail page in the board theme", async ({ page }) => {
    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityResponse });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingResponse });
    });

    await page.goto("/services/azure-front-door");

    await expect(page.locator(".svc-detail-header")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Azure Front Door" })).toBeVisible();
    await expect(page.getByText("Search this service, open a finding, and capture only the notes you need.")).toBeVisible();
    await expect(page.getByText("Availability and regional fit")).toBeVisible();
  });

  test("renders the technology detail page in the board theme", async ({ page }) => {
    await page.goto("/technologies/aprl-checklist-aprl-checklist");

    await expect(page.locator(".review-command-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: "APRL Checklist" })).toBeVisible();
    await expect(page.getByText("How much weight this family should carry.")).toBeVisible();
    await expect(page.getByText("Review one checklist family with local notes, source context, and a cleaner working surface.")).toBeVisible();
  });

  test("keeps explorer and informational routes on the board shell", async ({ page }) => {
    await page.goto("/explorer");

    await expect(page.locator(".review-command-panel").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Move from executive posture to detailed findings without losing clarity." })).toBeVisible();
    await expect(page.getByRole("button", { name: "GA-ready only" })).toBeVisible();

    await page.goto("/how-to-use");
    await expect(page.locator(".review-command-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Use the review board to prepare decisions, not to issue approval." })).toBeVisible();

    await page.goto("/this-route-does-not-exist");
    await expect(page.locator(".review-command-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: "The requested checklist view is not available." })).toBeVisible();
  });

  test("keeps detail and support routes usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1100 });

    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityResponse });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingResponse });
    });

    await page.goto("/services/azure-front-door");
    await expect(page.locator(".svc-detail-header")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Azure Front Door" })).toBeVisible();

    await page.goto("/explorer");
    await expect(page.locator(".review-command-panel").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "GA-ready only" })).toBeVisible();
  });
});
