import { expect, test } from "@playwright/test";

const signedOutPrincipal = {
  clientPrincipal: null
};

const authenticatedPrincipal = {
  clientPrincipal: {
    identityProvider: "aad",
    userId: "user-1",
    userDetails: "test-user@example.com",
    userRoles: ["anonymous", "authenticated"]
  }
};

const adminPrincipal = {
  clientPrincipal: {
    identityProvider: "aad",
    userId: "admin-1",
    userDetails: "admin@contoso.com",
    userRoles: ["anonymous", "authenticated", "admin"]
  }
};

const adminHealthPayload = {
  status: "Healthy",
  checkedAt: "2026-04-05T20:00:00.000Z",
  scope: {
    resourceGroup: "Azure-Review-Checklists-RG",
    staticWebAppName: "azure-review-checklists",
    functionAppName: "azure-review-checklists-api",
    openAiResourceName: "azreviewchecklistsopenaicu01",
    openAiDeployment: "gpt-4.1-mini",
    region: "Central US"
  },
  capabilities: {
    adminRouteProtected: true,
    adminApiReady: true,
    promptExecutionEnabled: true,
    mcpServerConfigured: false,
    copilotConfigured: true,
    applicationInsightsConfigured: true,
    storageConfigured: true
  },
  backend: {
    functionAppName: "azure-review-checklists-api",
    refreshSchedule: "0 0 7 * * 1",
    manualRefreshEnabled: true,
    warmServiceIndexUrl: "https://example.com/service-index.json",
    warmServiceLimit: 25,
    copilotEndpoint: "https://example.openai.azure.com",
    availability: {
      ok: true,
      ttlHours: 24,
      lastSuccessfulRefreshAt: "2026-04-05T18:00:00.000Z",
      lastRefreshMode: "timer",
      sourceUrl: "https://azure.microsoft.com/availability",
      expiresAt: "2026-04-06T18:00:00.000Z",
      publicRegionCount: 60,
      lastError: null
    },
    pricing: {
      ok: true,
      ttlHours: 24,
      lastSuccessfulRefreshAt: "2026-04-05T18:15:00.000Z",
      lastRefreshMode: "timer",
      sourceUrl: "https://prices.azure.com/api/retail/prices",
      expiresAt: "2026-04-06T18:15:00.000Z",
      lastServiceSlug: "azure-front-door",
      lastWarmCount: 25,
      lastError: null
    },
    runtime: [
      {
        label: "Function App site name",
        value: "azure-review-checklists-api",
        status: "configured",
        detail: "Visible runtime identity for the dedicated backend."
      },
      {
        label: "Functions worker runtime",
        value: "node",
        status: "configured",
        detail: "Should normally be set for the deployed Function App runtime."
      }
    ],
    storage: [
      {
        label: "Storage connection",
        value: "Configured",
        status: "configured",
        detail: "Blob and Table-backed project review persistence depends on this connection."
      },
      {
        label: "Project review table",
        value: "projectreviews",
        status: "defaulted",
        detail: "Stores the low-cost review index used by My Project Reviews."
      }
    ],
    refresh: [
      {
        label: "Refresh schedule",
        value: "0 0 7 * * 1",
        status: "configured",
        detail: "Timer schedule for the commercial-data warm path."
      },
      {
        label: "Manual refresh key",
        value: "Configured",
        status: "configured",
        detail: "Controls whether internal operators can manually trigger a commercial refresh."
      }
    ],
    copilot: [
      {
        label: "Azure OpenAI endpoint",
        value: "https://example.openai.azure.com",
        status: "configured",
        detail: "Visible endpoint host used by the public and future admin copilot backends."
      },
      {
        label: "Azure OpenAI API key",
        value: "Configured",
        status: "configured",
        detail: "The secret value is intentionally hidden; this shows only presence."
      }
    ],
    evidence: [
      {
        label: "Refresh state document",
        status: "healthy",
        summary: "Updated 2026-04-05T18:20:00.000Z",
        detail: "This is the backend-owned document that tracks pricing and availability refresh outcomes."
      },
      {
        label: "Application Insights diagnostics",
        status: "healthy",
        summary: "Diagnostics wiring detected",
        detail: "Protected backend traces and refresh failures can be correlated in Application Insights."
      },
      {
        label: "Pricing refresh",
        status: "healthy",
        summary: "Fresh through 2026-04-06T18:15:00.000Z",
        detail: "Last successful refresh was 2026-04-05T18:15:00.000Z via timer."
      }
    ]
  },
  notes: [
    "This admin shell is protected for internal administrators only.",
    "Prompt execution is intentionally disabled until read-only Azure MCP tooling is connected."
  ],
  findings: [
    {
      id: "manual-refresh",
      severity: "info",
      label: "Manual refresh is enabled",
      detail: "Internal operators can trigger manual commercial-data refreshes on the dedicated backend."
    }
  ]
} as const;

const adminPromptPayload = {
  answer:
    "The Azure Review Board platform is healthy overall. The linked Function App is configured, storage is available, and the Foundry-backed admin prompt path is responding for read-only diagnostics.",
  generatedAt: "2026-04-05T20:10:00.000Z",
  modelName: "gpt-4.1-mini",
  modelDeployment: "azure-review-admin",
  promptExecutionEnabled: true,
  sources: [
    {
      label: "Admin health",
      note: "Protected backend health payload"
    },
    {
      label: "Function App",
      url: "https://portal.azure.com/#@contoso.com/resource/subscriptions/mock/resourceGroups/Azure-Review-Checklists-RG/providers/Microsoft.Web/sites/azure-review-checklists-api"
    }
  ],
  toolCalls: [
    {
      tool: "azure.resourceGraph.query",
      status: "success",
      detail: "Enumerated the platform resources in the scoped resource group."
    },
    {
      tool: "azure.functionApp.config",
      status: "success",
      detail: "Validated the Function App app settings required by the admin shell."
    }
  ]
} as const;

const telemetrySummaryPayload = {
  checkedAt: "2026-04-05T20:12:00.000Z",
  storageConfigured: true,
  windowDays: 14,
  totalEvents: 18,
  metrics: [
    { key: "reviewStarts", label: "Homepage starts", count: 5 },
    { key: "reviewCreates", label: "Review shells created", count: 4 },
    { key: "servicesAdded", label: "Services added to scope", count: 9 },
    { key: "exports", label: "Export downloads", count: 3 },
    { key: "cloudLoads", label: "Cloud continuity loads", count: 2 },
    { key: "cloudSaves", label: "Cloud saves and CSVs", count: 2 },
    { key: "adminPrompts", label: "Admin prompts", count: 1 }
  ],
  exportBreakdown: [
    {
      key: "leadership-markdown",
      label: "leadership-markdown",
      count: 2
    }
  ],
  cloudActionBreakdown: [
    {
      key: "resume",
      label: "resume",
      count: 1
    },
    {
      key: "save",
      label: "save",
      count: 1
    }
  ],
  recentEvents: [
    {
      occurredAt: "2026-04-05T20:10:00.000Z",
      name: "admin_prompt_submit",
      category: "admin",
      actor: "admin",
      route: "/admin/copilot",
      reviewId: null,
      properties: {
        origin: "suggested",
        questionLength: "48",
        succeeded: "true"
      }
    }
  ],
  dailyRollup: [
    {
      date: "2026-04-04",
      totalEvents: 8,
      reviewStarts: 2,
      reviewCreates: 2,
      servicesAdded: 4,
      exports: 1,
      cloudLoads: 1,
      cloudSaves: 1,
      adminPrompts: 0
    },
    {
      date: "2026-04-05",
      totalEvents: 10,
      reviewStarts: 3,
      reviewCreates: 2,
      servicesAdded: 5,
      exports: 2,
      cloudLoads: 1,
      cloudSaves: 1,
      adminPrompts: 1
    }
  ]
} as const;

test.describe("admin copilot access and diagnostics", () => {
  test("prompts signed-out users to sign in as admin", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedOutPrincipal });
    });

    await page.goto("/admin/copilot");

    await expect(page.getByRole("heading", { name: "Sign in as an internal administrator." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in as admin" })).toBeVisible();
  });

  test("shows an access denied state for authenticated non-admin users", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: authenticatedPrincipal });
    });

    await page.goto("/admin/copilot");

    await expect(page.getByRole("heading", { name: "You are signed in, but you do not have admin access." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to project review" })).toBeVisible();
  });

  test("renders admin diagnostics and runs a protected prompt for admin users", async ({ page }) => {
    const telemetryEvents: Array<Record<string, unknown>> = [];

    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: adminPrincipal });
    });

    await page.route("**/api/admin/copilot/health", async (route) => {
      await route.fulfill({ json: adminHealthPayload });
    });

    await page.route("**/api/admin/telemetry/summary?days=14", async (route) => {
      await route.fulfill({ json: telemetrySummaryPayload });
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

    await page.route("**/api/admin/copilot", async (route) => {
      await expect(route.request().method()).toBe("POST");

      const payload = route.request().postDataJSON() as {
        question?: string;
        scope?: {
          resourceGroup?: string;
          staticWebAppName?: string;
          functionAppName?: string;
          openAiResourceName?: string;
          openAiDeployment?: string | null;
          region?: string;
        };
      };

      expect(payload.question).toBe("List the Azure resources supporting this website.");
      expect(payload.scope).toEqual({
        resourceGroup: "Azure-Review-Checklists-RG",
        staticWebAppName: "azure-review-checklists",
        functionAppName: "azure-review-checklists-api",
        openAiResourceName: "azreviewchecklistsopenaicu01",
        openAiDeployment: "gpt-4.1-mini",
        region: "Central US"
      });

      await route.fulfill({ json: adminPromptPayload });
    });

    await page.goto("/admin/copilot");

    await expect(page.getByRole("heading", { name: "Inspect the Azure platform behind the website before deeper admin tooling goes live." })).toBeVisible();
    await expect(page.getByRole("main").getByText("admin@contoso.com", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ask the protected admin copilot about backend health, config drift, and Azure platform readiness." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Run admin prompt" })).toBeVisible();
    await expect(page.getByRole("button", { name: "List the Azure resources supporting this website." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "See whether the backend looks fresh, observable, and ready right now." })).toBeVisible();
    await expect(page.getByText("Refresh state document")).toBeVisible();
    await expect(page.getByText("Application Insights diagnostics")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pricing refresh" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inspect the runtime, storage, refresh, and copilot configuration that the backend can actually see." })).toBeVisible();
    await expect(page.getByText("Function App site name")).toBeVisible();
    await expect(page.getByText("Functions worker runtime")).toBeVisible();
    await expect(page.getByText("Project review table")).toBeVisible();
    await expect(page.getByText("Manual refresh key")).toBeVisible();
    await expect(page.getByText("Azure OpenAI API key")).toBeVisible();
    await expect(page.getByText("Manual refresh is enabled")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inspect the shipped homepage-to-review funnel without opening raw storage rows." })).toBeVisible();
    await expect(page.getByText("Homepage starts", { exact: true })).toBeVisible();
    await expect(page.getByText("Export mix")).toBeVisible();
    await expect(page.getByText("2026-04-05", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "List the Azure resources supporting this website." }).click();

    const answerCard = page.locator("article").filter({ hasText: "Latest admin answer" }).first();

    await expect(answerCard).toContainText("Latest admin answer");
    await expect(answerCard).toContainText("List the Azure resources supporting this website.");
    await expect(answerCard).toContainText("The Azure Review Board platform is healthy overall.");
    await expect(answerCard).toContainText("Source count");
    await expect(answerCard).toContainText("Tool calls");
    await expect(answerCard).toContainText("Admin health");
    await expect(answerCard).toContainText("Protected backend health payload");
    await expect(answerCard.getByRole("link", { name: "https://portal.azure.com/#@contoso.com/resource/subscriptions/mock/resourceGroups/Azure-Review-Checklists-RG/providers/Microsoft.Web/sites/azure-review-checklists-api" })).toBeVisible();
    await expect(answerCard.getByRole("heading", { name: "azure.resourceGraph.query" })).toBeVisible();
    await expect(answerCard.getByRole("heading", { name: "azure.functionApp.config" })).toBeVisible();
    await expect(answerCard).toContainText("Enumerated the platform resources in the scoped resource group.");
    await expect
      .poll(() => telemetryEvents.length)
      .toBe(1);
    expect(telemetryEvents[0]).toMatchObject({
      name: "admin_prompt_submit",
      category: "admin",
      route: "/admin/copilot",
      properties: {
        origin: "suggested",
        succeeded: true
      }
    });
  });
});
