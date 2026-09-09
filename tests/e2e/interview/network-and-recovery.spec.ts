import { test, expect } from "../support/fixtures";

test.describe("E2E Interview: Network Resilience & Recovery", () => {
  test("Browser refresh during active interview recovers existing session without creating a duplicate", async ({
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

    // Accept invitation
    await page.goto(`/invite/${token}?e2e=true`);
    await expect(page.locator('[data-testid="accept-invitation-btn"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="accept-invitation-btn"]').click();
    await expect(page).toHaveURL(/\/room\//, { timeout: 20000 });

    const sessionId = page.url().split("/room/")[1].split("?")[0];
    await expect(page.locator('[data-testid="interview-on-air-badge"]')).toBeVisible({ timeout: 15000 });

    // Submit an answer
    await page.evaluate(() => {
      (window as any).__E2E_INTERVIEWER__?.submitCandidateAnswer("Testing refresh recovery answer.");
    });
    await page.waitForTimeout(500);

    // Check DB state before refresh
    const stateBefore = getSessionState(sessionId);
    expect(stateBefore.found).toBe(true);

    // Refresh the browser page
    await page.reload();

    // Should reconnect to the same room
    await expect(page).toHaveURL(new RegExp(`/room/${sessionId}`));
    await expect(page.locator('[data-testid="live-interview-room"]')).toBeVisible({ timeout: 15000 });

    // Verify in DB that no second session was created
    const stateAfter = getSessionState(sessionId);
    expect(stateAfter.found).toBe(true);
    expect(stateAfter.id).toBe(sessionId);
  });

  test("Simulated disconnect triggers retry UI and allows re-establishment", async ({
    page,
    resetDb,
  }) => {
    const { token, candidate_email } = resetDb();

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(candidate_email);
    await page.locator('input[type="password"]').fill("Password123!");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/app/);

    await page.goto(`/invite/${token}?e2e=true`);
    await expect(page.locator('[data-testid="accept-invitation-btn"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="accept-invitation-btn"]').click();
    await expect(page).toHaveURL(/\/room\//, { timeout: 20000 });
    await expect(page.locator('[data-testid="interview-on-air-badge"]')).toBeVisible({ timeout: 15000 });

    // Trigger simulated disconnect from test controller
    await page.evaluate(() => {
      (window as any).__E2E_INTERVIEWER__?.simulateDisconnect();
    });

    // Verify error UI is displayed
    const retryBtn = page.locator('[data-testid="retry-connection-btn"]');
    await expect(retryBtn).toBeVisible({ timeout: 10000 });
    const errorMsg = page.locator('[data-testid="error-message"]');
    await expect(errorMsg).toBeVisible();

    // Click retry connection
    await retryBtn.click();
    await expect(page.locator('[data-testid="interview-on-air-badge"]')).toBeVisible({ timeout: 20000 });
  });
});
