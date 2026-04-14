import { expect, test } from "@playwright/test";

/**
 * Regression test for the client-side crash:
 *   "Cannot read properties of undefined (reading 'length')"
 *
 * Root cause: agent-generated findings were missing `missingEvidence`,
 * `references`, and other fields the frontend expected to be arrays.
 * The fix adds those fields in the backend and defensive checks in the frontend.
 */

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

// Findings that mimic what the agent used to return BEFORE the fix:
// missing missingEvidence, references, confidence, criticalBlocker, etc.
const incompleteAgentFindings = [
  {
    findingId: "agent-finding-1",
    reviewId: "demo-review",
    severity: "High",
    domain: "Security",
    findingType: "WAF",
    title: "No boundary control pattern documented",
    findingStatement: "The design lacks explicit boundary controls.",
    whyItMatters: "Increases attack surface risk.",
    evidenceBasis: "No WAF or firewall mentioned in uploaded docs.",
    recommendation: "Add Azure Firewall or Application Gateway WAF.",
    learnMoreUrl: "https://learn.microsoft.com/azure/web-application-firewall/",
    suggestedOwner: "Security Architect",
    evidenceFound: [],
    status: "Open",
    source: "agent"
    // NOTE: missingEvidence, references, confidence, criticalBlocker are ALL missing
  },
  {
    findingId: "agent-finding-2",
    reviewId: "demo-review",
    severity: "Medium",
    domain: "Reliability",
    findingType: "WAF",
    title: "No DR plan documented",
    findingStatement: "Disaster recovery strategy is absent.",
    whyItMatters: "No RTO/RPO commitments visible.",
    evidenceBasis: "No DR or backup references found.",
    recommendation: "Document RTO/RPO targets and failover strategy.",
    learnMoreUrl: "",
    suggestedOwner: "Platform Lead",
    evidenceFound: [],
    status: "Open",
    source: "agent"
    // NOTE: same missing fields
  }
];

// Complete findings with all fields present (post-fix shape)
const completeFindings = [
  {
    findingId: "agent-finding-1",
    reviewId: "demo-review",
    severity: "High",
    domain: "Security",
    findingType: "WAF",
    title: "No boundary control pattern documented",
    findingStatement: "The design lacks explicit boundary controls.",
    whyItMatters: "Increases attack surface risk.",
    evidenceBasis: "No WAF or firewall mentioned in uploaded docs.",
    recommendation: "Add Azure Firewall or Application Gateway WAF.",
    learnMoreUrl: "https://learn.microsoft.com/azure/web-application-firewall/",
    references: [
      {
        title: "Azure Web Application Firewall",
        url: "https://learn.microsoft.com/azure/web-application-firewall/"
      }
    ],
    confidence: "Medium",
    criticalBlocker: false,
    suggestedOwner: "Security Architect",
    suggestedDueDate: null,
    owner: null,
    dueDate: null,
    reviewerNote: null,
    missingEvidence: ["No WAF or APIM configuration found"],
    evidenceFound: [],
    status: "Open",
    source: "agent"
  }
];

test.describe("ARB findings page crash fix", () => {
  test("does NOT crash when findings are missing missingEvidence and references fields", async ({
    page
  }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({ json: { review: mockReview } });
    });

    await page.route("**/api/arb/reviews/demo-review/findings", async (route) => {
      await route.fulfill({
        json: { reviewId: "demo-review", findings: incompleteAgentFindings }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      await route.fulfill({
        json: { reviewId: "demo-review", actions: [] }
      });
    });

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page crashes
    let pageCrashed = false;
    page.on("pageerror", () => {
      pageCrashed = true;
    });

    await page.goto("/arb/demo-review/findings");

    // The page should load without crashing
    await expect(page.getByRole("heading", { name: "Review Findings" })).toBeVisible();

    // Findings should be rendered
    await expect(page.getByText("No boundary control pattern documented")).toBeVisible();

    // No "Cannot read properties of undefined" errors
    expect(pageCrashed).toBe(false);
    const undefinedErrors = consoleErrors.filter((e) =>
      e.includes("Cannot read properties of undefined")
    );
    expect(undefinedErrors).toHaveLength(0);
  });

  test("renders findings correctly when all fields are present", async ({ page }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({ json: { review: mockReview } });
    });

    await page.route("**/api/arb/reviews/demo-review/findings", async (route) => {
      await route.fulfill({
        json: { reviewId: "demo-review", findings: completeFindings }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      await route.fulfill({
        json: { reviewId: "demo-review", actions: [] }
      });
    });

    await page.goto("/arb/demo-review/findings");

    await expect(page.getByRole("heading", { name: "Review Findings" })).toBeVisible();
    await expect(page.getByText("No boundary control pattern documented")).toBeVisible();

    // Missing evidence section should render
    await expect(page.getByText("No WAF or APIM configuration found")).toBeVisible();

    // References/grounding links should render
    await expect(page.getByText("Azure Web Application Firewall")).toBeVisible();
  });

  test("renders findings page with empty findings array without crashing", async ({ page }) => {
    await page.route("**/api/arb/reviews/demo-review", async (route) => {
      await route.fulfill({ json: { review: mockReview } });
    });

    await page.route("**/api/arb/reviews/demo-review/findings", async (route) => {
      await route.fulfill({
        json: { reviewId: "demo-review", findings: [] }
      });
    });

    await page.route("**/api/arb/reviews/demo-review/actions", async (route) => {
      await route.fulfill({
        json: { reviewId: "demo-review", actions: [] }
      });
    });

    await page.goto("/arb/demo-review/findings");

    await expect(page.getByRole("heading", { name: "Review Findings" })).toBeVisible();
    await expect(
      page.getByText("No findings yet")
    ).toBeVisible();
  });
});
