import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

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
      isActive: true,
      isArchived: false,
      archivedAt: null,
      isDeleted: false,
      deletedAt: null
    }
  ]
} as const;

type MutableLibraryUser = {
  userId: string;
  email: string;
  displayName: string;
  provider: string;
  activeReviewId: string | null;
};

type MutableLibraryReview = {
  id: string;
  name: string;
  audience: string;
  businessScope: string;
  targetRegions: readonly string[];
  selectedServiceSlugs: readonly string[];
  serviceCount: number;
  recordCount: number;
  includedCount: number;
  notApplicableCount: number;
  excludedCount: number;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string;
  isActive: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
};

type MutableLibraryState = {
  user: MutableLibraryUser;
  reviews: MutableLibraryReview[];
};

const reviewStateDocument = {
  schemaVersion: 1,
  updatedAt: restoredPackage.updatedAt,
  activePackage: restoredPackage,
  copilotContext: null
} as const;

const availabilityPayload = {
  generatedAt: restoredPackage.updatedAt,
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
      notes: ["Microsoft lists this as a global or non-regional service."],
      publicRegionCount: 0,
      availableRegionCount: 0,
      unavailableRegionCount: 0,
      restrictedRegionCount: 0,
      earlyAccessRegionCount: 0,
      previewRegionCount: 0,
      retiringRegionCount: 0,
      isGlobalService: true,
      generatedAt: restoredPackage.updatedAt,
      availabilitySourceUrl:
        "https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table",
      regionsSourceUrl: "https://learn.microsoft.com/en-us/azure/reliability/regions-list",
      regions: [],
      unavailableRegions: [],
      globalSkuStates: [
        {
          skuName: "Azure Front Door Standard",
          state: "GA"
        }
      ],
      dataSource: {
        mode: "live",
        refreshedAt: restoredPackage.updatedAt,
        cacheTtlHours: 24
      }
    }
  ]
} as const;

const pricingPayload = {
  generatedAt: restoredPackage.updatedAt,
  sourceUrl: "https://prices.azure.com/api/retail/prices",
  services: [
    {
      serviceSlug: "azure-front-door",
      serviceName: "Azure Front Door",
      mapped: true,
      notes: ["Retail pricing is published under Azure Front Door Service in the retail price feed."],
      generatedAt: restoredPackage.updatedAt,
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
      targetPricingLocations: ["UAE North"],
      startsAtRetailPrice: 35,
      startsAtTargetRetailPrice: 35,
      query: {
        field: "serviceName",
        operator: "contains",
        value: "Azure Front Door",
        source: "matchedOffering"
      },
      dataSource: {
        mode: "live",
        refreshedAt: restoredPackage.updatedAt,
        cacheTtlHours: 24
      },
      rows: [
        {
          meterId: "afd-base-month",
          meterName: "Base",
          productName: "Azure Front Door Standard",
          skuName: "Standard",
          armSkuName: "Standard",
          armRegionName: "uaenorth",
          location: "UAE North",
          locationKind: "Region",
          effectiveStartDate: restoredPackage.updatedAt,
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

test.describe("cloud-backed project review flows", () => {
  test("lists saved reviews for a signed-in user and opens the selected review", async ({ page }) => {
    const telemetryEvents: Array<Record<string, unknown>> = [];

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
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
    await expect(page.getByRole("heading", { name: "Checking your sign-in state and saved project reviews." })).toBeHidden({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: restoredPackage.name })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Signed in with Microsoft. The active saved review is ${restoredPackage.id}.`)).toBeVisible();

    await page.getByRole("button", { name: "Open this review" }).click();
    await expect
      .poll(() => telemetryEvents.length)
      .toBe(1);
    expect(telemetryEvents[0]).toMatchObject({
      name: "review_cloud_action",
      category: "continuity",
      route: "/my-project-reviews",
      reviewId: restoredPackage.id,
      properties: {
        action: "resume"
      }
    });
    await expect(page).toHaveURL(new RegExp(`/review-package\\?cloudReviewId=${restoredPackage.id}$`));
  });

  test("restores a cloud review and saves review details back to Azure", async ({ page }) => {
    let sawSaveRequest = false;
    const telemetryEvents: Array<Record<string, unknown>> = [];

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
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

    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityPayload });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingPayload });
    });

    await page.goto(`/review-package?cloudReviewId=${restoredPackage.id}`);

    await expect(
      page.getByRole("heading", {
        name: `${restoredPackage.name} is active and ready for service scoping.`
      })
    ).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Expand stage" }).first().click();
    await expect(page.getByRole("textbox", { name: "Project review name" })).toHaveValue(
      restoredPackage.name,
      { timeout: 15000 }
    );
    await expect(page.getByRole("textbox", { name: "Business scope" })).toHaveValue(restoredPackage.businessScope);
    await expect(page.getByText(`Loaded "${restoredPackage.name}" from Azure and made it the active project review.`)).toBeVisible();

    await page.getByRole("button", { name: "Save review details" }).click();

    await expect(page.getByText(`Saved the project review details for "${restoredPackage.name}" locally and updated the Azure-backed review summary.`)).toBeVisible();
    await expect
      .poll(() => telemetryEvents.length)
      .toBeGreaterThanOrEqual(2);
    expect(
      telemetryEvents.find((event) => event.name === "review_cloud_action")
    ).toMatchObject({
      route: "/review-package",
      reviewId: restoredPackage.id,
      properties: {
        action: "restore-link"
      }
    });
    expect(
      telemetryEvents.find((event) => event.name === "review_save_details")
    ).toMatchObject({
      route: "/review-package",
      reviewId: restoredPackage.id,
      properties: {
        savedToCloud: true
      }
    });
    expect(sawSaveRequest).toBeTruthy();
  });

  test("reseeds an empty scope with a starter bundle and applies Step 3 follow-up suggestions", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({
        json: {
          clientPrincipal: null
        }
      });
    });

    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityPayload });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingPayload });
    });

    await page.goto("/review-package");

    await expect(
      page.getByRole("heading", {
        name: "Create or activate the project review that should receive notes."
      })
    ).toBeVisible({ timeout: 15000 });
    await page.getByRole("textbox", { name: "Project review name" }).fill("Starter bundle test review");
    await page.getByRole("button", { name: "Create project review" }).click();

    await expect(
      page.getByRole("heading", {
        name: "No services are in this project review yet."
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Add one likely foundation service first, then keep the review scoped from there."
      })
    ).toBeVisible();

    const starterBundleCard = page.locator("article", {
      has: page.getByRole("heading", { name: "Edge web baseline" })
    });

    await starterBundleCard.getByRole("button", { name: "Add bundle to review" }).click();

    await expect(
      page.getByText("Likely next scope after Edge web baseline")
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("4 services selected")).toBeVisible();

    const firstFollowUpAction = page.locator(".review-next-scope-actions button").first();

    await expect(firstFollowUpAction).toBeVisible();
    await firstFollowUpAction.click();

    await expect(page.getByText("5 services selected")).toBeVisible({ timeout: 15000 });
  });

  test("submits the selected copilot mode to the backend and renders the mode-specific answer", async ({ page }) => {
    const capturedModes: string[] = [];

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
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

    await page.route("**/api/project-review-state", async (route) => {
      await route.fulfill({ json: reviewStateDocument });
    });

    await page.route("**/api/review-records", async (route) => {
      await route.fulfill({
        json: {
          schemaVersion: 1,
          updatedAt: restoredPackage.updatedAt,
          recordCount: 0,
          records: []
        }
      });
    });

    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityPayload });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingPayload });
    });

    await page.route("**/api/copilot", async (route) => {
      const payload = route.request().postDataJSON() as {
        mode?: string;
        question?: string;
      };

      capturedModes.push(payload.mode ?? "project-review");

      await route.fulfill({
        json: {
          answer: `Mode ${payload.mode} answered: ${payload.question}`,
          generatedAt: restoredPackage.updatedAt,
          modelName: "gpt-4.1-mini",
          modelDeployment: "test-deployment",
          mode: payload.mode,
          groundingMode: "project-review-context",
          sources: [
            {
              label: "Project review context",
              note: "Mocked review context"
            }
          ]
        }
      });
    });

    await page.goto(`/review-package?cloudReviewId=${restoredPackage.id}`);

    await expect(
      page.getByRole("heading", {
        name: `${restoredPackage.name} is active and ready for service scoping.`
      })
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByRole("heading", {
        name: "Use CoPilot for a scoped summary, pricing explanation, or leadership-ready answer."
      })
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Service review", exact: true }).click();
    await page.getByRole("button", { name: "Which selected services look riskiest from a regional fit perspective, and why?" }).click();

    await expect(
      page.getByText(
        "Mode service-review answered: Which selected services look riskiest from a regional fit perspective, and why?"
      )
    ).toBeVisible();

    await page.getByRole("button", { name: "Leadership summary", exact: true }).click();
    await page.getByRole("button", { name: "Draft a leadership summary for this project review." }).click();

    await expect(
      page.getByText(
        "Mode leadership-summary answered: Draft a leadership summary for this project review."
      )
    ).toBeVisible();
    expect(capturedModes).toEqual(["service-review", "leadership-summary"]);
  });

  test("searches, archives, restores, and deletes saved project reviews", async ({ page }) => {
    const currentLibrary: MutableLibraryState = {
      user: {
        ...libraryPayload.user,
        activeReviewId: restoredPackage.id
      },
      reviews: [
        {
          ...libraryPayload.reviews[0],
          isActive: true,
          isArchived: false,
          archivedAt: null,
          isDeleted: false,
          deletedAt: null
        },
        {
          ...libraryPayload.reviews[0],
          id: "pkg-archived-1",
          name: "Contoso archive review",
          isActive: false,
          isArchived: true,
          archivedAt: "2026-04-05T17:10:00.000Z",
          lastSavedAt: "2026-04-05T17:00:00.000Z",
          isDeleted: false,
          deletedAt: null
        }
      ]
    };

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
    });

    await page.route("**/api/project-reviews", async (route) => {
      await route.fulfill({ json: currentLibrary });
    });

    await page.route("**/api/project-reviews/archive", async (route) => {
      const payload = route.request().postDataJSON() as { reviewId?: string; archived?: boolean };
      const review = currentLibrary.reviews.find((entry) => entry.id === payload.reviewId);

      expect(review).toBeTruthy();

      if (review) {
        review.isArchived = payload.archived !== false;
        review.archivedAt = review.isArchived ? "2026-04-05T17:30:00.000Z" : null;
        review.isActive = false;
      }

      if (payload.archived !== false && currentLibrary.user.activeReviewId === payload.reviewId) {
        currentLibrary.user.activeReviewId = null;
      }

      await route.fulfill({
        json: {
          user: currentLibrary.user
        }
      });
    });

    await page.route("**/api/project-reviews/delete", async (route) => {
      const payload = route.request().postDataJSON() as { reviewId?: string; deleted?: boolean };
      const review = currentLibrary.reviews.find((entry) => entry.id === payload.reviewId);

      expect(review).toBeTruthy();

      if (review) {
        review.isDeleted = payload.deleted !== false;
        review.deletedAt = review.isDeleted ? "2026-04-05T17:40:00.000Z" : null;
        review.isActive = false;
      }

      if (payload.deleted !== false && currentLibrary.user.activeReviewId === payload.reviewId) {
        currentLibrary.user.activeReviewId = null;
      }

      await route.fulfill({
        json: {
          user: currentLibrary.user
        }
      });
    });

    await page.route("**/api/project-reviews/purge", async (route) => {
      const payload = route.request().postDataJSON() as { reviewId?: string };
      currentLibrary.reviews = currentLibrary.reviews.filter((entry) => entry.id !== payload.reviewId);

      await route.fulfill({
        json: {
          user: currentLibrary.user
        }
      });
    });

    await page.goto("/my-project-reviews");

    await expect(page.getByRole("heading", { name: "Checking your sign-in state and saved project reviews." })).toBeHidden({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: restoredPackage.name })).toBeVisible({ timeout: 15000 });
    await page.getByPlaceholder("Search reviews by name, audience, scope, or target region").fill("Upendra");
    await expect(page.getByRole("heading", { name: restoredPackage.name })).toBeVisible();

    await page.getByRole("button", { name: "Archive active review" }).click();
    await page.getByRole("button", { name: "Confirm archive" }).click();

    await page.getByLabel("Filter").selectOption("archived");
    await expect(page.getByRole("heading", { name: restoredPackage.name })).toBeVisible();
    await expect(page.getByText("Archived reviews stay in Azure until you restore or delete them.")).toBeVisible();

    await page.getByRole("button", { name: "Restore to library" }).click();
    await page.getByLabel("Filter").selectOption("all");

    await page.getByPlaceholder("Search reviews by name, audience, scope, or target region").fill("Contoso");
    await expect(page.getByRole("heading", { name: "Contoso archive review" })).toBeVisible();

    await page.getByRole("button", { name: "Move to deleted" }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();

    await page.getByLabel("Filter").selectOption("deleted");
    await expect(page.getByRole("heading", { name: "Contoso archive review" })).toBeVisible();
    await expect(page.getByText("Deleted reviews stay recoverable until you permanently delete them.")).toBeVisible();

    await page.getByRole("button", { name: "Restore to library" }).click();
    await page.getByLabel("Filter").selectOption("all");
    await expect(page.getByRole("heading", { name: "Contoso archive review" })).toBeVisible();

    await page.getByRole("button", { name: "Move to deleted" }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();
    await page.getByLabel("Filter").selectOption("deleted");
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await page.getByRole("button", { name: "Confirm permanent delete" }).click();

    await expect(page.getByText("No saved reviews match the current search or filter.")).toBeVisible();
  });

  test("does not restore a purged active review from Azure state later", async ({ page }) => {
    const currentLibrary: MutableLibraryState = {
      user: {
        ...libraryPayload.user,
        activeReviewId: restoredPackage.id
      },
      reviews: [
        {
          ...libraryPayload.reviews[0],
          isActive: true,
          isArchived: false,
          archivedAt: null,
          isDeleted: true,
          deletedAt: "2026-04-05T17:40:00.000Z"
        }
      ]
    };
    let purgeCompleted = false;

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedInPrincipal });
    });

    await page.route("**/api/project-reviews", async (route) => {
      await route.fulfill({ json: currentLibrary });
    });

    await page.route("**/api/project-reviews/purge", async (route) => {
      const payload = route.request().postDataJSON() as { reviewId?: string };

      expect(payload.reviewId).toBe(restoredPackage.id);
      currentLibrary.user.activeReviewId = null;
      currentLibrary.reviews = [];
      purgeCompleted = true;

      await route.fulfill({
        json: {
          user: currentLibrary.user
        }
      });
    });

    await page.route("**/api/project-review-state", async (route) => {
      await route.fulfill({
        json: purgeCompleted
          ? {
              schemaVersion: 1,
              updatedAt: "2026-04-05T18:00:00.000Z",
              activePackage: null,
              copilotContext: null
            }
          : reviewStateDocument
      });
    });

    await page.route("**/api/review-records", async (route) => {
      await route.fulfill({
        json: {
          schemaVersion: 1,
          updatedAt: "2026-04-05T18:00:00.000Z",
          recordCount: 0,
          records: []
        }
      });
    });

    await page.route("**/api/availability", async (route) => {
      await route.fulfill({ json: availabilityPayload });
    });

    await page.route("**/api/pricing", async (route) => {
      await route.fulfill({ json: pricingPayload });
    });

    await page.goto("/my-project-reviews");

    await page.getByLabel("Filter").selectOption("deleted");
    await expect(page.getByRole("heading", { name: restoredPackage.name })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await page.getByRole("button", { name: "Confirm permanent delete" }).click();
    await expect(
      page.getByRole("heading", { name: "Save your first project review from the main workspace." })
    ).toBeVisible();

    await page.goto("/review-package");

    await page.getByRole("textbox", { name: "Project review name" }).fill("Temporary local review");
    await page.getByRole("button", { name: "Create project review" }).click();
    await page.getByRole("button", { name: "Load project review" }).click();

    await expect(
      page.getByText(
        "No saved Azure review records or active project review context were found for this signed-in user."
      )
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("heading", {
        name: "Temporary local review is active and ready for service scoping."
      })
    ).toBeVisible();
  });
});
