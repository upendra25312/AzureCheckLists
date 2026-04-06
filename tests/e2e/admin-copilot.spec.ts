import { expect, test } from "@playwright/test";

const signedOutPrincipal = {
  clientPrincipal: null
};

const authenticatedPrincipal = {
  clientPrincipal: {
    identityProvider: "aad",
    userId: "user-1",
    userDetails: "upendra25312@gmail.com",
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
    promptExecutionEnabled: false,
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

  test("renders the admin config inventory for admin users", async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: adminPrincipal });
    });

    await page.route("**/api/admin/copilot/health", async (route) => {
      await route.fulfill({ json: adminHealthPayload });
    });

    await page.goto("/admin/copilot");

    await expect(page.getByRole("heading", { name: "Inspect the Azure platform behind the website before deeper admin tooling goes live." })).toBeVisible();
    await expect(page.getByRole("main").getByText("admin@contoso.com", { exact: true })).toBeVisible();
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
  });
});