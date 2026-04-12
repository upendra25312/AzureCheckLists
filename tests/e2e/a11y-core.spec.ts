import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const anonymousPayload = { clientPrincipal: null } as const;

const availabilityResponse = {
  generatedAt: "2026-04-12T16:30:00.000Z",
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
      generatedAt: "2026-04-12T16:30:00.000Z",
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
  generatedAt: "2026-04-12T16:30:00.000Z",
  sourceUrl: "https://prices.azure.com/api/retail/prices",
  services: [
    {
      serviceSlug: "azure-front-door",
      serviceName: "Azure Front Door",
      mapped: false,
      notes: ["Mocked pricing mapping pending for browser validation."],
      generatedAt: "2026-04-12T16:30:00.000Z",
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

async function expectNoCriticalA11yViolations(page: Page) {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
}

test.describe("core accessibility validation", () => {
  test("homepage passes axe checks", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: anonymousPayload });
    });

    await page.goto("/");
    await expectNoCriticalA11yViolations(page);
  });

  test("services index passes axe checks", async ({ page }) => {
    await page.goto("/services");
    await expectNoCriticalA11yViolations(page);
  });

  test("service detail passes axe checks", async ({ page }) => {
    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityResponse });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingResponse });
    });

    await page.goto("/services/azure-front-door");
    await expectNoCriticalA11yViolations(page);
  });
});
