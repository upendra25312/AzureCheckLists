import { expect, test } from "@playwright/test";

const principalPayload = {
  clientPrincipal: {
    identityProvider: "aad",
    userId: "arb-user-1",
    userDetails: "architect@contoso.com",
    userRoles: ["anonymous", "authenticated"]
  }
} as const;

test.describe("ARB review library", () => {
  test("lists saved ARB reviews and links into the persisted workflow", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: principalPayload });
    });

    await page.route("**/api/arb/reviews", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: {
            reviews: [
              {
                reviewId: "arb-contoso-hadr",
                projectName: "Contoso HA/DR",
                customerName: "Contoso",
                workflowState: "Review In Progress",
                evidenceReadinessState: "Ready with Gaps",
                overallScore: 78,
                recommendation: "Approved with Conditions",
                assignedReviewer: null,
                createdByUserId: "arb-user-1",
                lastUpdated: "2026-04-10T09:00:00.000Z",
                finalDecision: null
              }
            ]
          }
        });
        return;
      }

      await route.fallback();
    });

    await page.goto("/arb");

    await expect(page.getByRole("heading", { name: "Start an evidence-backed architecture review" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create a new ARB review or resume an upload-first review already in progress." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open workspace" })).toHaveAttribute(
      "href",
      "/arb/arb-contoso-hadr"
    );
    await expect(page.getByText("Workflow: Review In Progress")).toBeVisible();
    await expect(page.getByText("Evidence: Ready with Gaps")).toBeVisible();
  });

  test("creates a new ARB review from the landing page", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: principalPayload });
    });

    await page.route("**/api/arb/reviews", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { reviews: [] } });
        return;
      }

      const payload = route.request().postDataJSON() as {
        projectName?: string;
        customerName?: string;
      };

      expect(payload).toEqual({
        projectName: "Fabrikam data platform",
        customerName: "Fabrikam"
      });

      await route.fulfill({
        json: {
          review: {
            reviewId: "fabrikam-data-platform",
            projectName: payload.projectName,
            customerName: payload.customerName,
            workflowState: "Review In Progress",
            evidenceReadinessState: "Ready with Gaps",
            overallScore: 78,
            recommendation: "Approved with Conditions",
            assignedReviewer: null
          }
        }
      });
    });

    await page.goto("/arb");
    await page.getByLabel("Project name").fill("Fabrikam data platform");
    await page.getByLabel("Customer name").fill("Fabrikam");
    await page.getByRole("button", { name: "Create ARB review" }).click();

    await expect(page).toHaveURL(/\/arb\/fabrikam-data-platform\/upload$/);
  });
});
