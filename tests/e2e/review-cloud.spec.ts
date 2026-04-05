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

const restoredPackage = {
  id: "pkg-1775313682696-t2knsf",
  name: "Upendra first test",
  audience: "Cloud Architect",
  businessScope: "Azure landing zone with UAE North as primary region and UAE Central as DR Region",
  targetRegions: ["UAE Central", "UAE North"],
  selectedServiceSlugs: ["azure-front-door"],
  serviceAssumptions: {
    "azure-front-door": {
      plannedRegion: "UAE North",
      preferredSku: "Standard",
      sizingNote: "Start with the default edge profile."
    }
  },
  createdAt: "2026-04-05T15:00:00.000Z",
  updatedAt: "2026-04-05T16:50:50.000Z"
} as const;

const libraryPayload = {
  user: {
    userId: "user-1",
    email: "upendra25312@gmail.com",
    displayName: "Upendra",
    provider: "aad",
    activeReviewId: restoredPackage.id
  },
  reviews: [
    {
      id: restoredPackage.id,
      name: restoredPackage.name,
      audience: restoredPackage.audience,
      businessScope: restoredPackage.businessScope,
      targetRegions: restoredPackage.targetRegions,
      selectedServiceSlugs: restoredPackage.selectedServiceSlugs,
      serviceCount: 1,
      recordCount: 0,
      includedCount: 0,
      notApplicableCount: 0,
      excludedCount: 0,
      pendingCount: 1017,
      createdAt: restoredPackage.createdAt,
      updatedAt: restoredPackage.updatedAt,
      lastSavedAt: restoredPackage.updatedAt,
      isActive: true
    }
  ]
} as const;

const reviewStateDocument = {
  schemaVersion: 1,
  updatedAt: restoredPackage.updatedAt,
  activePackage: restoredPackage,
  copilotContext: null
} as const;

test.describe("cloud-backed project review flows", () => {
  test("lists saved reviews for a signed-in user and opens the selected review", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
    });

    await page.route("**/api/project-reviews", async (route) => {
      await route.fulfill({ json: libraryPayload });
    });

    await page.route("**/api/project-reviews/activate", async (route) => {
      const payload = route.request().postDataJSON() as { reviewId?: string };

      expect(payload.reviewId).toBe(restoredPackage.id);
      await route.fulfill({
        json: {
          user: libraryPayload.user
        }
      });
    });

    await page.goto("/my-project-reviews");

    await expect(page.getByRole("heading", { name: "Resume the Azure project reviews you already saved." })).toBeVisible();
    await expect(page.getByRole("heading", { name: restoredPackage.name })).toBeVisible();
    await expect(page.getByText(`Signed in with Microsoft. The active saved review is ${restoredPackage.id}.`)).toBeVisible();

    await page.getByRole("button", { name: "Open this review" }).click();
    await expect(page).toHaveURL(new RegExp(`/review-package\\?cloudReviewId=${restoredPackage.id}$`));
  });

  test("restores a cloud review and saves review details back to Azure", async ({ page }) => {
    let sawSaveRequest = false;

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
    });

    await page.route("**/api/project-reviews/activate", async (route) => {
      await route.fulfill({
        json: {
          user: libraryPayload.user
        }
      });
    });

    await page.route("**/api/project-review-state", async (route) => {
      if (route.request().method() === "POST") {
        const payload = route.request().postDataJSON() as {
          activePackage?: { id?: string; name?: string };
        };

        expect(payload.activePackage?.id).toBe(restoredPackage.id);
        expect(payload.activePackage?.name).toBe(restoredPackage.name);
        sawSaveRequest = true;
      }

      await route.fulfill({ json: reviewStateDocument });
    });

    await page.route("**/api/review-records", async (route) => {
      await route.fulfill({
        json: {
          schemaVersion: 1,
          updatedAt: restoredPackage.updatedAt,
          records: []
        }
      });
    });

    await page.goto(`/review-package?cloudReviewId=${restoredPackage.id}`);

    await expect(page.getByText(`Loaded "${restoredPackage.name}" from Azure and made it the active project review.`)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Project review name" })).toHaveValue(restoredPackage.name);
    await expect(page.getByRole("textbox", { name: "Business scope" })).toHaveValue(restoredPackage.businessScope);

    await page.getByRole("button", { name: "Save review details" }).click();

    await expect(page.getByText(`Saved the project review details for "${restoredPackage.name}" locally and updated the Azure-backed review summary.`)).toBeVisible();
    expect(sawSaveRequest).toBeTruthy();
  });
});