import { expect, test } from "@playwright/test";

const principalPayload = {
  clientPrincipal: {
    identityProvider: "aad",
    userId: "arb-user-1",
    userDetails: "architect@contoso.com",
    userRoles: ["anonymous", "authenticated"]
  }
} as const;

const anonymousPayload = { clientPrincipal: null } as const;

const mockReview = {
  reviewId: "demo-review",
  projectName: "Sample ARB Review",
  customerName: "Contoso",
  workflowState: "Review In Progress",
  evidenceReadinessState: "Ready with Gaps",
  overallScore: 78,
  recommendation: "Needs Revision",
  assignedReviewer: null
} as const;

const mockDecision = {
  reviewId: "demo-review",
  decision: null
} as const;

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

test.describe("core validation requirements", () => {
  test("homepage keeps anonymous nav to Board Review and Service Explorer and shows required CTAs", async ({
    page
  }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: anonymousPayload });
    });

    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Upload architecture docs. Get board-ready Azure findings in minutes."
      })
    ).toBeVisible();

    const navLinks = page.getByRole("navigation", { name: "Primary sections" }).getByRole("link");
    await expect(navLinks).toHaveCount(2);
    await expect(navLinks.nth(0)).toHaveText("Board Review");
    await expect(navLinks.nth(1)).toHaveText("Service Explorer");

    await expect(page.getByRole("link", { name: "Start Board Review" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore Azure Services" }).first()).toBeVisible();
  });

  test("service explorer uses Open service view for anonymous users", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: anonymousPayload });
    });

    await page.goto("/services");

    await expect(page.getByRole("heading", { name: "Start with the Azure service, not the checklist filename." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open service view" }).first()).toBeVisible();
  });

  test("arb decision step exposes exactly Approved, Needs Revision, and Rejected", async ({
    page
  }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: principalPayload });
    });

    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({ json: { review: mockReview } });
    });

    await page.route("**/api/arb/reviews/demo-review/decision", async (route) => {
      await route.fulfill({ json: mockDecision });
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      await route.fulfill({ json: { reviewId: "demo-review", actions: [] } });
    });

    await page.goto("/arb/demo-review/decision");

    await expect(page.getByLabel("Final decision")).toBeVisible();
    await expect(page.locator('select[aria-label="Final decision"] option')).toHaveText([
      "Approved",
      "Needs Revision",
      "Rejected"
    ]);
  });

  test("service detail uses approved Azure region sources and pricing source links", async ({ page }) => {
    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityResponse });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingResponse });
    });

    await page.goto("/services/azure-front-door");

    await expect(page.getByRole("heading", { name: "Azure Front Door" })).toBeVisible();
    await expect(page.getByText("Availability and regional fit")).toBeVisible();
  });
});
