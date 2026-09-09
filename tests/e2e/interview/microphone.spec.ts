import { test, expect } from "../support/fixtures";

test.describe("E2E Interview: Microphone Handling & Controls", () => {
  test("Microphone permission denial blocks call entry and displays retry error UI", async ({
    page,
    context,
    resetDb,
  }) => {
    // Clear permissions & simulate audio permission denial
    await context.clearPermissions();
    await page.addInitScript(() => {
      const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        if (constraints && typeof constraints === "object" && (constraints as MediaStreamConstraints).audio) {
          const err = new DOMException("Permission denied", "NotAllowedError");
          throw err;
        }
        return origGUM(constraints);
      };
    });

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

    // Should display connection error and retry button
    const retryBtn = page.locator('[data-testid="retry-connection-btn"]');
    await expect(retryBtn).toBeVisible({ timeout: 20000 });
    const errorMsg = page.locator('[data-testid="error-message"]');
    await expect(errorMsg).toBeVisible();
  });

  test("Mute and unmute toggle controls track states and UI labels", async ({
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

    const muteBtn = page.locator('[data-testid="mute-toggle-btn"]');
    await expect(muteBtn).toBeVisible({ timeout: 15000 });
    await expect(muteBtn).toHaveText(/Mute/);

    // Click to Mute
    await muteBtn.click();
    await expect(muteBtn).toHaveText(/Unmute/);
    const isMuted = await page.evaluate(() => (window as any).__E2E_INTERVIEWER__?.isMicMuted());
    expect(isMuted).toBe(true);

    // Click to Unmute
    await muteBtn.click();
    await expect(muteBtn).toHaveText(/Mute/);
    const isUnmuted = await page.evaluate(() => (window as any).__E2E_INTERVIEWER__?.isMicMuted());
    expect(isUnmuted).toBe(false);
  });

  test("Silence handling maintains stable listening state without premature termination", async ({
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

    // Wait for interview to be live and listening
    await expect(page.locator('[data-testid="interview-on-air-badge"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="status-text"]')).toHaveText(/Listening/i, { timeout: 10000 });

    // Wait during silence — verify call does not prematurely drop or error out
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-testid="live-interview-room"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-text"]')).toHaveText(/Listening/i);
  });
});
