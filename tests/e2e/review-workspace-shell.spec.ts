import { expect, test } from "@playwright/test";

const emptyPrincipal = {
  clientPrincipal: null
};

const availabilityPayload = {
  generatedAt: "2026-04-09T15:00:00.000Z",
  sourceUrl: "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table",
  services: []
};

const pricingPayload = {
  generatedAt: "2026-04-09T15:00:00.000Z",
  sourceUrl: "https://prices.azure.com/api/retail/prices",
  services: []
};

const scopedAvailabilityPayload = {
  generatedAt: "2026-04-09T15:00:00.000Z",
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
      notes: ["Microsoft lists this service as global for this mocked review flow."],
      publicRegionCount: 0,
      availableRegionCount: 0,
      unavailableRegionCount: 0,
      restrictedRegionCount: 0,
      earlyAccessRegionCount: 0,
      previewRegionCount: 0,
      retiringRegionCount: 0,
      isGlobalService: true,
      generatedAt: "2026-04-09T15:00:00.000Z",
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
  generatedAt: "2026-04-09T15:00:00.000Z",
  sourceUrl: "https://prices.azure.com/api/retail/prices",
  services: [
    {
      serviceSlug: "azure-front-door",
      serviceName: "Azure Front Door",
      mapped: true,
      notes: ["Retail pricing is published for the mocked browser validation scenario."],
      generatedAt: "2026-04-09T15:00:00.000Z",
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
          effectiveStartDate: "2026-04-09T15:00:00.000Z",
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

async function createReviewAndScopeFrontDoor(page: import("@playwright/test").Page) {
  const scopeSection = page.locator("#project-review-scope");

  await page.getByRole("textbox", { name: "Project review name" }).fill("Workspace export test");
  await page.getByRole("button", { name: "Create project review" }).click();
  await scopeSection.getByRole("button", { name: "Browse full catalog" }).first().click();
  await scopeSection.getByRole("searchbox").fill("Azure Front Door");

  const frontDoorCard = scopeSection.locator("article", {
    has: page.getByRole("heading", { name: "Azure Front Door" })
  }).first();

  await frontDoorCard.getByRole("button", { name: "Add to review" }).click();
}

test.describe("review workspace board shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: emptyPrincipal });
    });

    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityPayload });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingPayload });
    });
  });

  test("renders the board-style command surface and staged workflow on desktop", async ({ page }) => {
    await page.goto("/review-package");

    await expect(page.locator(".review-command-panel")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "START A STRUCTURED PROJECT REVIEW" })
    ).toBeVisible();
    await expect(page.locator(".review-command-metric")).toHaveCount(4);
    await expect(page.locator(".review-stage-preview-card")).toHaveCount(3);
    await expect(page.locator(".review-progress-card")).toBeVisible();
    await expect(page.locator("#project-review-setup.board-stage-panel")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Create or activate the project review that should receive notes."
      })
    ).toBeVisible();
  });

  test("keeps the command panel and stage previews usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1100 });
    await page.goto("/review-package");

    await expect(page.locator(".review-command-panel")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open setup stage" })).toBeVisible();
    await expect(page.locator(".review-stage-preview-card").first()).toBeVisible();

    await page.getByRole("link", { name: "Open stage" }).first().click();
    await expect(page).toHaveURL(/#project-review-setup$/);
    await expect(page.locator(".review-progress-card")).toBeVisible();
  });

  test("collapses completed stages into summaries and allows reopening them intentionally", async ({
    page
  }) => {
    await page.goto("/review-package");

    const setupSection = page.locator("#project-review-setup");

    await page.getByRole("textbox", { name: "Project review name" }).fill("Collapsed stage review");
    await page.getByRole("button", { name: "Create project review" }).click();

    await expect(
      setupSection.getByRole("heading", {
        name: "Collapsed stage review is active and ready for service scoping."
      })
    ).toBeVisible();

    await setupSection.getByRole("button", { name: "Reopen stage" }).click();
    await expect(page.getByRole("textbox", { name: "Project review name" })).toHaveValue(
      "Collapsed stage review"
    );
  });

  test("keeps matrix rows compact and moves pricing depth into the service drawer", async ({
    page
  }) => {
    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: scopedAvailabilityPayload });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: scopedPricingPayload });
    });

    await page.goto("/review-package");
    await createReviewAndScopeFrontDoor(page);

    await expect(page.getByRole("button", { name: "Open detail workspace" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Show pricing drilldown" })).toHaveCount(0);

    await page.getByRole("button", { name: "Open detail workspace" }).click();
    await expect(page.getByRole("heading", { name: "Pricing detail" })).toBeVisible();
    await expect(page.locator(".service-drawer-pricing-table")).toBeVisible();
  });

  test("shows audience-first export previews and comparison context before download", async ({
    page
  }) => {
    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: scopedAvailabilityPayload });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: scopedPricingPayload });
    });

    await page.goto("/review-package");
    await createReviewAndScopeFrontDoor(page);

    await expect(
      page.getByRole("heading", {
        name: "Choose the handoff artifact by audience first, then pick the file format."
      })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top risk summary" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Service comparison" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Checklist CSV" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pricing export" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leadership summary" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download tracker CSV" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download leadership brief" })).toBeVisible();
  });
});
