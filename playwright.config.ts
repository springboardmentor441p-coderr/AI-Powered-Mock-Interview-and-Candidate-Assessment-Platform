import { defineConfig, devices } from "@playwright/test";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEO_CANDIDATE_PRESENT = path.join(
  __dirname,
  "tests",
  "test-assets",
  "video",
  "candidate-present.y4m"
);
const AUDIO_ANSWER_1 = path.join(
  __dirname,
  "tests",
  "test-assets",
  "audio",
  "answer-1.wav"
);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    permissions: ["camera", "microphone"],
    launchOptions: {
      channel: "chrome",
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        `--use-file-for-fake-video-capture=${VIDEO_CANDIDATE_PRESENT}`,
        `--use-file-for-fake-audio-capture=${AUDIO_ANSWER_1}`,
        "--autoplay-policy=no-user-gesture-required",
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5173",
    port: 5173,
    reuseExistingServer: true,
    timeout: 60000,
    cwd: path.join(__dirname, "frontend"),
  },
});
