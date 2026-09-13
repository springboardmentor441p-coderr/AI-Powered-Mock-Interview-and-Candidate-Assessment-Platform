import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

test("End interview immediately, verify no blank screen, and verify refresh redirect", async ({ page }) => {
  test.setTimeout(120000);
  const screenshotsDir = path.join(process.cwd(), "test-results", "verification-screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  // 1. Candidate logs in
  await page.goto("/login");
  await page.locator('input[type="email"], input[name="email"]').fill("ayushkmishra332@gmail.com");
  await page.locator('input[type="password"], input[name="password"]').fill("ayush123");
  await page.locator('button[type="submit"]').click();

  // 2. Settle on dashboard
  await expect(page).toHaveURL(/\/app/, { timeout: 15000 });

  // 3. Enable E2E mock provider in browser storage
  await page.evaluate(() => {
    localStorage.setItem("e2e_mode", "true");
    sessionStorage.setItem("e2e_mode", "true");
  });

  // 4. Navigate to new interview page
  await page.goto("/app/interviews/new?e2e=true");
  await expect(page.locator('input[name="domain"]')).toBeVisible({ timeout: 10000 });

  // 5. Fill interview setup
  await page.locator('input[name="domain"]').fill("Full Stack Developer");
  await page.locator('input[name="topic_count"]').fill("3");
  await page.locator('button[type="submit"]').click();

  // 6. Settle in /room/<sessionId>
  await expect(page).toHaveURL(/\/room\//, { timeout: 60000 });
  const sessionId = page.url().split("/room/")[1].split("?")[0];
  expect(sessionId).toBeTruthy();

  // 7. Wait for live interview room to become active
  const endBtn = page.locator('[data-testid="end-interview-btn"]');
  await expect(endBtn).toBeVisible({ timeout: 25000 });
  await page.screenshot({ path: path.join(screenshotsDir, "01_room_live.png") });

  // 8. Immediately click "End interview"
  await endBtn.click();

  // 9. Verify NO blank screen: clean transition to results page with Session Tape
  await expect(page).toHaveURL(new RegExp(`/app/interviews/${sessionId}`), { timeout: 30000 });
  await expect(page.getByText("Session Tape")).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotsDir, "02_results_page_no_blank_screen.png") });

  // 10. Test refresh/re-visit to /room/<sessionId>
  // Navigating back to the room must detect ended session and redirect immediately back to results
  await page.goto(`/room/${sessionId}`);
  await expect(page).toHaveURL(new RegExp(`/app/interviews/${sessionId}`), { timeout: 15000 });
  await expect(page.getByText("Session Tape")).toBeVisible({ timeout: 15000 });
  // Verify it never starts preparing session again
  await expect(page.getByText("Preparing your interview topics")).not.toBeVisible();
  await page.screenshot({ path: path.join(screenshotsDir, "03_refresh_redirected_to_results.png") });

  console.log(`[TEST PASSED] Successfully verified end-interview and refresh redirect for session ${sessionId}`);
});

