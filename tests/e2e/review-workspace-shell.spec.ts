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
});
