import { test as base, expect } from "@playwright/test";
import { execSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../..");
const PYTHON_PATH = path.join(ROOT_DIR, "backend", ".venv", "Scripts", "python.exe");
const DB_HELPER_PATH = path.join(__dirname, "db_helper.py");

export const ASSETS_DIR = path.join(ROOT_DIR, "tests", "test-assets");
export const VIDEO_CANDIDATE_PRESENT = path.join(ASSETS_DIR, "video", "candidate-present.y4m");
export const VIDEO_EMPTY_ROOM = path.join(ASSETS_DIR, "video", "empty-room.y4m");
export const VIDEO_MULTIPLE_PEOPLE = path.join(ASSETS_DIR, "video", "multiple-people.y4m");
export const AUDIO_ANSWER_1 = path.join(ASSETS_DIR, "audio", "answer-1.wav");
export const AUDIO_SILENCE = path.join(ASSETS_DIR, "audio", "silence.wav");

export interface SessionDbState {
  found: boolean;
  id?: string;
  status?: string;
  started_at?: string | null;
  completed_at?: string | null;
  turns_count?: number;
  transcripts_count?: number;
  snapshots_count?: number;
  candidate_email?: string;
  seed_topics_ready?: boolean;
}

export function runDbHelper(cmd: string, arg?: string): any {
  const fullCmd = `"${PYTHON_PATH}" "${DB_HELPER_PATH}" ${cmd} ${arg ? `"${arg}"` : ""}`;
  const out = execSync(fullCmd, { cwd: ROOT_DIR, encoding: "utf-8" });
  // Find the last JSON line in the output (ignoring Django debug logs)
  const lines = out.trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i].trim());
    } catch {
      continue;
    }
  }
  throw new Error(`Failed to parse JSON output from db_helper: ${out}`);
}

export const test = base.extend<{
  resetDb: () => { token: string; candidate_email: string; recruiter_email: string };
  getSessionState: (idOrToken: string) => SessionDbState;
}>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      (window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ = true;
      try {
        window.sessionStorage.setItem("e2e_mode", "true");
        window.localStorage.setItem("e2e_mode", "true");
      } catch {
        // Ignore storage failures
      }
    });
    await use(page);
  },
  resetDb: async ({}, use) => {
    await use(() => runDbHelper("reset"));
  },
  getSessionState: async ({}, use) => {
    await use((idOrToken: string) => runDbHelper("get_session", idOrToken));
  },
});

export { expect };
