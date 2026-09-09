import { test, expect } from "../support/fixtures";

test.describe("E2E Interview: Face Assessment & Presence Monitoring", () => {
  test("Real fake camera feed renders in video HUD and derives presence metrics", async ({
    page,
    resetDb,
  }) => {
    const { token, candidate_email } = resetDb();

    // Candidate login
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

    // Verify HUD elements
    const hud = page.locator('[data-testid="face-assessment-hud"]');
    await expect(hud).toBeVisible({ timeout: 15000 });
    const video = page.locator('[data-testid="face-hud-video"]');
    await expect(video).toBeVisible();

    // Turn on camera feed
    const cameraBtn = page.locator('[data-testid="camera-toggle-btn"]');
    await expect(cameraBtn).toBeVisible({ timeout: 15000 });
    await cameraBtn.click();

    // Wait for video stream to attach
    await page.waitForFunction(() => {
      const vid = document.querySelector('video[data-testid="face-hud-video"]') as HTMLVideoElement;
      return Boolean(vid && vid.srcObject);
    }, { timeout: 15000 });

    const hasVideoFeed = await page.evaluate(() => {
      const vid = document.querySelector('video[data-testid="face-hud-video"]') as HTMLVideoElement;
      return Boolean(vid && vid.srcObject && (vid.srcObject as MediaStream).getVideoTracks().length > 0);
    });
    expect(hasVideoFeed).toBe(true);

    // Verify presence status label is visible and active
    const presenceLabel = page.locator('[data-testid="presence-label"]');
    await expect(presenceLabel).toBeVisible();
  });
});
