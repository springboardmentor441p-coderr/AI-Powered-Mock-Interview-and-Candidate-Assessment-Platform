import { test, expect, runDbHelper } from "../support/fixtures";

test.describe("E2E Interview: Concurrency, Expiration & Security", () => {
  test("Idempotent invitation acceptance: cannot create duplicate session", async ({
    page,
    resetDb,
    getSessionState,
  }) => {
    const { token, candidate_email } = resetDb();

    // Login
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(candidate_email);
    await page.locator('input[type="password"]').fill("Password123!");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/app/);

    // Accept invitation 1st time
    await page.goto(`/invite/${token}?e2e=true`);
    await expect(page.locator('[data-testid="accept-invitation-btn"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="accept-invitation-btn"]').click();
    await expect(page).toHaveURL(/\/room\//, { timeout: 20000 });
    const sessionId = page.url().split("/room/")[1].split("?")[0];

    // Candidate visits the invitation URL again
    await page.goto(`/invite/${token}?e2e=true`);

    // Must show 'Resume Interview', not a fresh 'Accept & Start'
    const resumeBtn = page.locator('[data-testid="resume-interview-btn"]');
    await expect(resumeBtn).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="accept-invitation-btn"]')).not.toBeVisible();

    // Clicking Resume routes back to the existing session
    await resumeBtn.click();
    await expect(page).toHaveURL(new RegExp(`/room/${sessionId}`));
  });

  test("Expired invitation blocks interview start and displays expired notification", async ({
    page,
  }) => {
    // Create an expired invitation in DB
    const { token } = runDbHelper("create_expired");

    await page.goto(`/invite/${token}?e2e=true`);

    // Verify expired alert is shown and accept button is absent
    const expiredAlert = page.locator('[data-testid="invitation-expired-alert"]');
    await expect(expiredAlert).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="accept-invitation-btn"]')).not.toBeVisible();
  });

  test("Invalid or forged invitation token displays error state safely", async ({ page }) => {
    await page.goto("/invite/forged-invalid-token-uuid-12345?e2e=true");

    const errorTitle = page.locator('[data-testid="invitation-error-title"]');
    await expect(errorTitle).toBeVisible({ timeout: 15000 });
    await expect(errorTitle).toHaveText("Invitation Unavailable");
    await expect(page.locator('[data-testid="accept-invitation-btn"]')).not.toBeVisible();
  });

  test("Unauthenticated user accessing protected room is redirected to login", async ({
    page,
  }) => {
    // Clear storage and navigate directly to a room without credentials
    await page.goto("/room/00000000-0000-0000-0000-000000000000");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
