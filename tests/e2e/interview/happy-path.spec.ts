import { test, expect } from "../support/fixtures";

test.describe("E2E Interview: Happy Path", () => {
  test("Complete interview session from invitation to completion and DB persistence", async ({
    page,
    resetDb,
    getSessionState,
  }) => {
    // 1. Setup fresh test invitation in DB
    const { token, candidate_email } = resetDb();

    // 2. Candidate authenticates via UI
    await page.goto("/login");
    await page.locator('input[type="email"], input[name="email"]').fill(candidate_email);
    await page.locator('input[type="password"], input[name="password"]').fill("Password123!");
    await page.locator('button[type="submit"]').click();

    // Wait for auth to settle and redirect to dashboard
    await expect(page).toHaveURL(/\/app/);

    // 3. Candidate opens invitation link in E2E mode
    await page.goto(`/invite/${token}?e2e=true`);
    await expect(page.locator('[data-testid="accept-invitation-btn"]')).toBeVisible({ timeout: 15000 });

    // 4. Accept invitation and enter interview room
    await page.locator('[data-testid="accept-invitation-btn"]').click();

    // Should navigate to /room/<sessionId>
    await expect(page).toHaveURL(/\/room\//, { timeout: 20000 });
    const sessionId = page.url().split("/room/")[1].split("?")[0];
    expect(sessionId).toBeTruthy();

    // 5. Verify room connects and goes live
    await expect(page.locator('[data-testid="live-interview-room"]')).toBeVisible();
    await expect(page.locator('[data-testid="interview-on-air-badge"]')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-testid="interviewer-status"]')).toBeVisible();

    // 6. Verify first deterministic question is asked
    const transcriptContainer = page.locator('[data-testid="transcript-container"]');
    await expect(transcriptContainer).toBeVisible();
    await expect(transcriptContainer).toContainText("Tell me about yourself.", { timeout: 15000 });

    // 7. Verify camera HUD is active and video is rendering fake device feed
    const cameraHud = page.locator('[data-testid="face-assessment-hud"]');
    await expect(cameraHud).toBeVisible();
    const video = page.locator('[data-testid="face-hud-video"]');
    await expect(video).toBeVisible();

    // 8. Progress through questions 1 to 4 with candidate answers
    for (let qIdx = 0; qIdx < 4; qIdx++) {
      // Trigger candidate answer via test controller
      await page.evaluate(() => {
        const interviewer = (window as any).__E2E_INTERVIEWER__;
        if (interviewer) {
          interviewer.submitCandidateAnswer();
        }
      });
      // Allow brief turn settlement
      await page.waitForTimeout(600);
    }

    // Verify wrap-up or multiple transcripts rendered
    const lines = page.locator('[data-testid="transcript-line"]');
    await expect(lines.first()).toBeVisible();
    const lineCount = await lines.count();
    expect(lineCount).toBeGreaterThanOrEqual(4);

    // 9. End the interview
    const endBtn = page.locator('[data-testid="end-interview-btn"]');
    await expect(endBtn).toBeVisible();
    await endBtn.click();

    // 10. Verify redirect to results / session detail page
    await expect(page).toHaveURL(new RegExp(`/app/interviews/${sessionId}`), { timeout: 20000 });

    // 11. Assert database state
    const dbState = getSessionState(sessionId);
    expect(dbState.found).toBe(true);
    expect(dbState.status).toBe("completed");
    expect(dbState.completed_at).not.toBeNull();
    expect(dbState.transcripts_count).toBeGreaterThanOrEqual(4);
  });
});
