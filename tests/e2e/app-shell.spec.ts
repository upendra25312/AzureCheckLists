import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const signedOutPrincipal = {
  clientPrincipal: null
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
  checkedAt: "2026-04-09T20:00:00.000Z",
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
    manualRefreshEnabled: false,
    warmServiceIndexUrl: null,
    warmServiceLimit: 0,
    copilotEndpoint: "https://example.openai.azure.com",
    runtime: [],
    storage: [],
    refresh: [],
    copilot: [],
    evidence: []
  },
  notes: [],
  findings: []
} as const;

async function expectSharedShell(page: Page, activeLabels: string[]) {
  await expect(page.getByRole("link", { name: "Azure Review Board", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Initialize Review", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Project Review", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "My Projects", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse Services", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Data Health Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Advanced Tools", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "How to use", exact: true })).toBeVisible();
  await expect(page.getByLabel(/switch to dark mode|switch to light mode/i)).toBeVisible();

  for (const label of activeLabels) {
    await expect(page.getByRole("link", { name: label, exact: true }).first()).toHaveAttribute("aria-current", "page");
  }
}

test.describe("shared app shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: signedOutPrincipal });
    });
  });

  test("renders the shared Azure Review Board shell on public workflow routes", async ({ page }) => {
    await page.goto("/services");
    await expectSharedShell(page, ["Browse Services"]);
    await expect(page.getByText("Sign in").first()).toBeVisible();

    await page.goto("/review-package");
    await expectSharedShell(page, ["Project Review"]);
    await expect(page.getByText("Sign in").first()).toBeVisible();

    await page.goto("/data-health");
    await expectSharedShell(page, ["Data Health Dashboard"]);
    await expect(page.getByText("Sign in").first()).toBeVisible();
  });

  test("keeps the shared shell on the admin route and exposes the admin link state", async ({
    page
  }) => {
    await page.route("**/.auth/me", async (route) => {
      await route.fulfill({ json: adminPrincipal });
    });

    await page.route("**/api/admin/copilot/health", async (route) => {
      await route.fulfill({ json: adminHealthPayload });
    });

    await page.goto("/admin/copilot");

    await expectSharedShell(page, ["Admin Copilot"]);
    await expect(page.getByText("admin@contoso.com", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inspect the Azure platform behind the website before deeper admin tooling goes live." })).toBeVisible();
  });

  test("keeps the shared shell usable on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/services");

    await expectSharedShell(page, ["Browse Services"]);
    await expect(page.getByText("Sign in").first()).toBeVisible();
  });
});
