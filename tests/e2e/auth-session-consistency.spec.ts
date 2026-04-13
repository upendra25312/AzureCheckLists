import { expect, test } from "@playwright/test";

const githubPrincipalPayload = {
  clientPrincipal: {
    identityProvider: "github",
    userId: "github-user-1",
    userDetails: "octocat",
    userRoles: ["anonymous", "authenticated"]
  }
} as const;

const signedOutPayload = {
  clientPrincipal: null
} as const;

test.describe("shared auth session", () => {
  test("keeps header and homepage in sync after GitHub sign-in", async ({ page }) => {
    let authRequestCount = 0;

    await page.route("**/.auth/me", async (route) => {
      authRequestCount += 1;

      await route.fulfill({
        json: authRequestCount === 1 ? githubPrincipalPayload : signedOutPayload
      });
    });

    await page.goto("/");

    await expect(page.getByText("Drop your SOW or design doc here")).toBeVisible();
    await expect(page.getByText("octocat", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "GitHub", exact: true })).toHaveCount(0);
    expect(authRequestCount).toBe(1);
  });
});
