import { expect, test } from "@playwright/test";

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

const mockScorecard = {
  overallScore: 78,
  recommendation: "Needs Revision",
  confidence: "Medium",
  criticalBlockers: 0,
  evidenceReadinessState: "Ready with Gaps",
  domainScores: [
    {
      domain: "Requirements Coverage",
      weight: 20,
      score: 16,
      reason: "Baseline requirement mapping scaffold.",
      linkedFindings: []
    },
    {
      domain: "Security",
      weight: 20,
      score: 12,
      reason: "Security rationale scaffold.",
      linkedFindings: ["find-001"]
    }
  ],
  reviewerOverride: null
} as const;

const mockFindings = [
  {
    findingId: "demo-review-find-001",
    reviewId: "demo-review",
    severity: "High",
    domain: "Security",
    findingType: "Best Practice Missing",
    title: "Sample ARB Review: boundary control pattern not yet explicit",
    findingStatement:
      "The current design does not yet document an explicit boundary control pattern for internet-facing access.",
    whyItMatters:
      "Unclear edge and boundary controls increase security and governance risk during design review.",
    evidenceFound: [],
    missingEvidence: ["No explicit WAF, APIM, or access restriction statement found yet."],
    recommendation: "Document a clear ingress and boundary protection pattern before final approval.",
    references: [],
    confidence: "Medium",
    criticalBlocker: false,
    suggestedOwner: "Security Architect",
    suggestedDueDate: null,
    owner: null,
    dueDate: null,
    reviewerNote: null,
    status: "Open"
  }
] as const;

const mockActions = [] as const;

const mockOpenActions = [
  {
    actionId: "demo-review-action-002",
    reviewId: "demo-review",
    sourceFindingId: "demo-review-find-001",
    actionSummary: "Assign a documented ingress owner before final approval.",
    owner: "Platform Lead",
    dueDate: "2026-04-24",
    severity: "High",
    status: "Blocked",
    closureNotes: null,
    reviewerVerificationRequired: true,
    createdAt: "2026-04-10T10:15:00.000Z"
  }
] as const;

test.describe("ARB live review routes", () => {
  test("surfaces a working Microsoft sign-in link when the review API requires auth", async ({
    page
  }) => {
    await page.route("**/api/arb/reviews/demo-review**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Sign in is required before saving or exporting Azure-backed review records."
        })
      });
    });

    await page.goto("/arb/demo-review/upload");

    await expect(
      page.getByText("Sign in is required before saving or exporting Azure-backed review records.")
    ).toBeVisible();

    const continueLink = page.getByRole("link", { name: "Continue with Microsoft" });
    await expect(continueLink).toBeVisible();
    await expect(
      continueLink
    ).toHaveAttribute("href", /\/\.auth\/login\/aad\?post_login_redirect_uri=/);
  });

  test("stages review files locally on the upload step and enforces the readiness gate", async ({
    page
  }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({
        json: {
          review: mockReview
        }
      });
    });

    await page.goto("/arb/demo-review/upload");

    await expect(page.getByRole("heading", { name: "Upload Review Package" })).toBeVisible();
    await page.getByLabel("Upload review package files").setInputFiles([
      {
        name: "contoso-architecture.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("architecture package")
      },
      {
        name: "network-diagram.png",
        mimeType: "image/png",
        buffer: Buffer.from("diagram")
      }
    ]);

    await expect(page.getByText("contoso-architecture.pdf")).toBeVisible();
    await expect(page.getByText("network-diagram.png")).toBeVisible();
    await expect(page.getByText("Files staged for extraction")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark package ready for extraction" })).toBeDisabled();

    await page.getByLabel("Confirm uploaded files can be used for review extraction").check();
    await expect(page.getByRole("button", { name: "Mark package ready for extraction" })).toBeEnabled();
    await page.getByRole("button", { name: "Mark package ready for extraction" }).click();

    await expect(
      page.getByText(
        "Package staged locally for extraction. Blob-backed upload and document processing will connect in the next backend slice."
      )
    ).toBeVisible();
  });

  test("updates a persisted finding from the findings page", async ({ page }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({
        json: {
          review: mockReview
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/findings", async (route) => {
      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          findings: mockFindings
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: {
            reviewId: mockReview.reviewId,
            actions: mockActions
          }
        });
        return;
      }

      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({
        sourceFindingId: "demo-review-find-001"
      });

      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          action: {
            actionId: "demo-review-action-001",
            reviewId: mockReview.reviewId,
            sourceFindingId: "demo-review-find-001",
            actionSummary: "Document a clear ingress and boundary protection pattern before final approval.",
            owner: "Security Lead",
            dueDate: "2026-04-20",
            severity: "High",
            status: "Open",
            closureNotes: null,
            reviewerVerificationRequired: true,
            createdAt: "2026-04-10T10:00:00.000Z"
          }
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/actions/demo-review-action-001", async (route) => {
      expect(route.request().method()).toBe("PATCH");
      expect(route.request().postDataJSON()).toEqual({
        owner: "Security Lead",
        dueDate: "2026-04-22",
        status: "Closed",
        closureNotes: "Ingress controls verified.",
        reviewerVerificationRequired: false
      });

      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          action: {
            actionId: "demo-review-action-001",
            reviewId: mockReview.reviewId,
            sourceFindingId: "demo-review-find-001",
            actionSummary: "Document a clear ingress and boundary protection pattern before final approval.",
            owner: "Security Lead",
            dueDate: "2026-04-22",
            severity: "High",
            status: "Closed",
            closureNotes: "Ingress controls verified.",
            reviewerVerificationRequired: false,
            createdAt: "2026-04-10T10:00:00.000Z"
          }
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/findings/demo-review-find-001", async (route) => {
      expect(route.request().method()).toBe("PATCH");
      expect(route.request().postDataJSON()).toEqual({
        status: "Closed",
        owner: "Security Lead",
        dueDate: "2026-04-20",
        reviewerNote: "Boundary controls documented in the revised design.",
        criticalBlocker: true
      });

      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          finding: {
            ...mockFindings[0],
            status: "Closed",
            owner: "Security Lead",
            dueDate: "2026-04-20",
            reviewerNote: "Boundary controls documented in the revised design.",
            criticalBlocker: true
          }
        }
      });
    });

    await page.goto("/arb/demo-review/findings");

    await expect(page.getByRole("heading", { name: "Review Findings" })).toBeVisible();
    await page.getByLabel(/Status for Sample ARB Review: boundary control pattern not yet explicit/i).selectOption("Closed");
    await page.getByLabel(/Owner for Sample ARB Review: boundary control pattern not yet explicit/i).fill("Security Lead");
    await page.getByLabel(/Due date for Sample ARB Review: boundary control pattern not yet explicit/i).fill("2026-04-20");
    await page.getByLabel(/Reviewer note for Sample ARB Review: boundary control pattern not yet explicit/i).fill("Boundary controls documented in the revised design.");
    await page.getByLabel(/Critical blocker for Sample ARB Review: boundary control pattern not yet explicit/i).check();
    await page.getByRole("button", { name: "Save finding" }).click();
    await page.getByRole("button", { name: "Create action" }).click();
    await page.getByLabel(/Status for Document a clear ingress and boundary protection pattern before final approval./i).selectOption("Closed");
    await page.getByLabel(/Due date for Document a clear ingress and boundary protection pattern before final approval./i).fill("2026-04-22");
    await page.getByLabel(/Closure notes for Document a clear ingress and boundary protection pattern before final approval./i).fill("Ingress controls verified.");
    await page.getByLabel(/Reviewer verification required for Document a clear ingress and boundary protection pattern before final approval./i).uncheck();
    await page.getByRole("button", { name: "Save action" }).click();

    await expect(page.getByLabel(/Status for Sample ARB Review: boundary control pattern not yet explicit/i)).toHaveValue("Closed");
    await expect(page.getByLabel(/Owner for Sample ARB Review: boundary control pattern not yet explicit/i)).toHaveValue("Security Lead");
    await expect(page.getByLabel(/Reviewer note for Sample ARB Review: boundary control pattern not yet explicit/i)).toHaveValue("Boundary controls documented in the revised design.");
    await expect(page.getByLabel(/Critical blocker for Sample ARB Review: boundary control pattern not yet explicit/i)).toBeChecked();
    await expect(page.getByText("Open actions: 0")).toBeVisible();
    await expect(page.getByLabel(/Status for Document a clear ingress and boundary protection pattern before final approval./i)).toHaveValue("Closed");
    await expect(page.getByLabel(/Due date for Document a clear ingress and boundary protection pattern before final approval./i)).toHaveValue("2026-04-22");
    await expect(page.getByLabel(/Closure notes for Document a clear ingress and boundary protection pattern before final approval./i)).toHaveValue("Ingress controls verified.");
    await expect(page.getByLabel(/Reviewer verification required for Document a clear ingress and boundary protection pattern before final approval./i)).not.toBeChecked();
    await expect(page.getByRole("button", { name: "Action created" })).toBeDisabled();
  });

  test("loads the scorecard route from the live stub APIs", async ({ page }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({
        json: {
          review: mockReview
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/scorecard", async (route) => {
      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          scorecard: mockScorecard
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          actions: mockOpenActions
        }
      });
    });

    await page.goto("/arb/demo-review/scorecard");

    await expect(page.getByRole("heading", { name: "Scorecard" })).toBeVisible();
    await expect(page.getByText("Project: Sample ARB Review")).toBeVisible();
    await expect(page.getByText("Review ID: demo-review")).toBeVisible();
    await expect(page.getByText("Workflow State").first()).toBeVisible();
    await expect(page.getByText("Review In Progress").first()).toBeVisible();
    await expect(page.getByText("Know whether this review is ready for sign-off.")).toBeVisible();
    await expect(page.locator(".arb-score-hero-value strong")).toHaveText("78");
    await expect(page.locator(".arb-score-recommendation")).toHaveText("Needs Revision");
    await expect(page.locator(".arb-score-hero-list")).toContainText("Ready with Gaps");
    await expect(page.getByText("Requirements Coverage")).toBeVisible();
    await expect(page.getByText("80% (16/20)")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();
    await expect(page.getByText("60% (12/20)")).toBeVisible();
    await expect(page.getByText("find-001")).toBeVisible();
    const conditionsTable = page.locator(".arb-conditions-table");
    await expect(conditionsTable).toContainText("Assign a documented ingress owner before final approval.");
    await expect(conditionsTable).toContainText("Platform Lead");
    await expect(conditionsTable).toContainText("2026-04-24");
    await expect(conditionsTable).toContainText("Blocked");
  });

  test("records a decision through the live stub API", async ({ page }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({
        json: {
          review: mockReview
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/decision", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: {
            reviewId: mockReview.reviewId,
            decision: null
          }
        });
        return;
      }

      const payload = route.request().postDataJSON() as {
        finalDecision?: string;
        rationale?: string;
      };

      expect(payload).toMatchObject({
        finalDecision: "Approved",
        rationale: "Ready for pilot rollout after evidence review.",
        reviewerName: null,
        reviewerRole: null
      });

      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          decision: {
            aiRecommendation: "Needs Revision",
            reviewerDecision: payload.finalDecision,
            rationale: payload.rationale,
            recordedAt: "2026-04-10T08:30:00.000Z"
          }
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          actions: []
        }
      });
    });

    await page.goto("/arb/demo-review/decision");

    await expect(page.getByText("Open actions: 0")).toBeVisible();
    await expect(page.getByText("Blocked actions: 0")).toBeVisible();
    await expect(page.getByText("Reviewer verification required: 0")).toBeVisible();
    await expect(page.getByText("No open actions remain for this review.")).toBeVisible();
    await page.getByLabel("Final decision").selectOption("Approved");
    await page
      .getByLabel("Decision rationale")
      .fill("Ready for pilot rollout after evidence review.");
    await page.getByRole("button", { name: "Record decision" }).click();

    const recordedCard = page.locator(".arb-decision-recorded");
    await expect(recordedCard).toContainText("Approved");
    await expect(recordedCard).toContainText("Needs Revision");
    await expect(recordedCard).toContainText("Ready for pilot rollout after evidence review.");
    await expect(recordedCard).toContainText("Recorded at");
    await expect(recordedCard).toContainText("4/10/2026");
  });

  test("blocks decision submission while blocked or verification-required actions remain open", async ({ page }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({
        json: {
          review: mockReview
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/decision", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: {
            reviewId: mockReview.reviewId,
            decision: null
          }
        });
        return;
      }

      throw new Error("Decision POST should not be called while blocked actions remain open.");
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          actions: mockOpenActions
        }
      });
    });

    await page.goto("/arb/demo-review/decision");

    await expect(page.getByText("Open actions: 1")).toBeVisible();
    await expect(page.getByText("Blocked actions: 1")).toBeVisible();
    await expect(page.getByText("Reviewer verification required: 1")).toBeVisible();
    await expect(
      page.getByText("Blocked actions remain. Resolve or reclassify blocked remediation items before recording a final decision.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Record decision" })).toBeDisabled();
  });

  test("loads a previously recorded persisted decision on revisit", async ({ page }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({
        json: {
          review: {
            ...mockReview,
            workflowState: "Approved",
            finalDecision: "Approved"
          }
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/decision", async (route) => {
      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          decision: {
            aiRecommendation: "Needs Revision",
            reviewerDecision: "Approved",
            rationale: "Previously recorded reviewer decision.",
            recordedAt: "2026-04-10T09:45:00.000Z"
          }
        }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      await route.fulfill({
        json: {
          reviewId: mockReview.reviewId,
          actions: []
        }
      });
    });

    await page.goto("/arb/demo-review/decision");

    await expect(page.getByText("Open actions: 0")).toBeVisible();
    await expect(page.getByText("No open actions remain for this review.")).toBeVisible();
    await expect(page.getByLabel("Final decision")).toHaveValue("Approved");
    await expect(page.getByLabel("Decision rationale")).toHaveValue(
      "Previously recorded reviewer decision."
    );
    const recordedCard = page.locator(".arb-decision-recorded");
    await expect(recordedCard).toContainText("Approved");
    await expect(recordedCard).toContainText("Needs Revision");
    await expect(recordedCard).toContainText("Previously recorded reviewer decision.");
    await expect(recordedCard).toContainText("Recorded at");
    await expect(recordedCard).toContainText("4/10/2026");
  });
});
