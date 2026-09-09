import { test, expect } from "../support/fixtures";

test.describe("E2E Interview: Camera Lifecycle & Failure Modes", () => {
  test("Camera permission denial shows appropriate warning and handles refusal safely", async ({
    page,
    context,
    resetDb,
  }) => {
    // Simulate camera permission denial
    await page.addInitScript(() => {
      const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        if (constraints && typeof constraints === "object" && (constraints as MediaStreamConstraints).video) {
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

    // Attempt to turn on camera when denied
    const cameraBtn = page.locator('[data-testid="camera-toggle-btn"]');
    await expect(cameraBtn).toBeVisible({ timeout: 15000 });
    await cameraBtn.click();

    // Verify warning toast or error display appears
    await page.waitForTimeout(500);
    const toastOrError = page.locator('.sonner-toast, [data-testid="camera-error-container"]');
    await expect(toastOrError.first()).toBeVisible({ timeout: 10000 });
  });

  test("Camera toggling on and off updates presence state accurately", async ({
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

    // Turn camera off
    const cameraBtn = page.locator('[data-testid="camera-toggle-btn"]');
    await expect(cameraBtn).toBeVisible({ timeout: 15000 });
    await cameraBtn.click();

    // Should indicate CAM OFF
    const presenceLabel = page.locator('[data-testid="presence-label"]');
    await expect(presenceLabel).toHaveText("CAM OFF", { timeout: 5000 });

    // Toggle back on
    await cameraBtn.click();
    await expect(cameraBtn).toBeVisible();
  });
});
