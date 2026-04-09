import { expect, test } from "@playwright/test";

const signedInPrincipal = [
  {
    clientPrincipal: {
      identityProvider: "aad",
      userId: "user-1",
      userDetails: "upendra25312@gmail.com",
      userRoles: ["anonymous", "authenticated"]
    }
  }
];

const projectReviewLibraryPayload = {
  user: {
    userId: "user-1",
    email: "upendra25312@gmail.com",
    displayName: "Upendra",
    provider: "aad",
    activeReviewId: "review-001"
  },
  reviews: [
    {
      id: "review-001",
      name: "Contoso platform review",
      audience: "Cloud Architect",
      businessScope: "Global application landing zone with central shared services.",
      targetRegions: ["East US", "UK South"],
      selectedServiceSlugs: ["azure-front-door", "api-management"],
      serviceCount: 2,
      recordCount: 18,
      includedCount: 6,
      notApplicableCount: 4,
      excludedCount: 1,
      pendingCount: 7,
      createdAt: "2026-04-09T10:00:00.000Z",
      updatedAt: "2026-04-09T13:00:00.000Z",
      lastSavedAt: "2026-04-09T13:00:00.000Z",
      isActive: true,
      isArchived: false,
      archivedAt: null,
      isDeleted: false,
      deletedAt: null
    }
  ]
} as const;

const healthPayload = {
  status: "Healthy",
  checkedAt: "2026-04-09T14:00:00.000Z",
  backendMode: "Dedicated Azure Function App",
  functionAppName: "azure-review-checklists-api",
  applicationInsightsConfigured: true,
  copilotConfigured: true,
  copilotModelName: "gpt-4.1-mini",
  copilotDeployment: "project-review-copilot-model",
  copilotEndpoint: "https://example.openai.azure.com",
  storageConfigured: true,
  tableStorageConfigured: true,
  refreshSchedule: "0 0 7 * * 1",
  manualRefreshEnabled: false,
  warmServiceIndexUrl: null,
  warmServiceLimit: 0,
  availability: {
    ok: true,
    ttlHours: 168,
    lastSuccessfulRefreshAt: "2026-04-09T07:00:00.000Z",
    lastRefreshMode: "timer",
    publicRegionCount: 58,
    sourceUrl: "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table",
    expiresAt: "2026-04-16T07:00:00.000Z",
    lastError: null
  },
  pricing: {
    ok: true,
    ttlHours: 168,
    lastSuccessfulRefreshAt: "2026-04-09T08:00:00.000Z",
    lastRefreshMode: "request",
    lastServiceSlug: "azure-kubernetes-service",
    lastWarmCount: 12,
    sourceUrl: "https://prices.azure.com/api/retail/prices",
    expiresAt: "2026-04-16T08:00:00.000Z",
    lastError: null
  }
} as const;

test.describe("board surface styling smoke", () => {
  test("renders the service directory command surface and result cards", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: { clientPrincipal: null } });
    });

    await page.goto("/services");

    await expect(page.getByRole("heading", { name: "Start with the Azure service, not the checklist filename." })).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.getByRole("button", { name: "All services" })).toBeVisible();
    await expect(page.getByRole("button", { name: "GA baseline available" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Azure Front Door", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open service view" }).first()).toBeVisible();
  });

  test("renders the project review library toolbar and saved review cards", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
    });

    await page.route("**/api/project-reviews", async (route) => {
      await route.fulfill({ json: projectReviewLibraryPayload });
    });

    await page.goto("/my-project-reviews");

    await expect(page.getByRole("heading", { name: "Resume the Azure project reviews you already saved." })).toBeVisible();
    await expect(page.locator(".library-command-panel")).toBeVisible();
    await expect(page.locator(".library-state-card")).toHaveCount(2);
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.getByRole("combobox").nth(0)).toBeVisible();
    await expect(page.getByRole("combobox").nth(1)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contoso platform review" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open this review" })).toBeVisible();
    await expect(page.locator(".library-review-stat")).toHaveCount(3);
  });

  test("keeps the saved review library readable on mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
    });

    await page.route("**/api/project-reviews", async (route) => {
      await route.fulfill({ json: projectReviewLibraryPayload });
    });

    await page.goto("/my-project-reviews");

    await expect(page.locator(".library-command-panel")).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.locator(".library-review-card")).toBeVisible();
    await expect(page.getByText("Signed in with Microsoft. The active saved review is review-001.")).toBeVisible();
  });

  test("keeps the data health dashboard readable on mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: { clientPrincipal: null } });
    });

    await page.route("**/api/health", async (route) => {
      await route.fulfill({ json: healthPayload });
    });

    await page.goto("/data-health");

    await expect(page.getByRole("heading", { name: "See when availability and pricing were last refreshed." })).toBeVisible();
    await expect(page.getByText("Backend status", { exact: true })).toBeVisible();
    await expect(page.getByText("Function App", { exact: true })).toBeVisible();
    await expect(page.getByText("Availability cache", { exact: true })).toBeVisible();
    await expect(page.getByText("Pricing cache", { exact: true })).toBeVisible();
  });
});
