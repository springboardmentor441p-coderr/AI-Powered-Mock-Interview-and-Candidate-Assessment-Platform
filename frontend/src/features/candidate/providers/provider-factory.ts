import type { IInterviewProvider } from "./interview-provider";
import { UltravoxProvider } from "./ultravox-provider";
import { LocalTestProvider } from "./local-test-provider";

export async function createInterviewProvider(): Promise<IInterviewProvider> {
  const envProvider = import.meta.env.VITE_INTERVIEW_PROVIDER;
  const isE2E =
    typeof window !== "undefined" &&
    (Boolean((window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__) ||
      new URLSearchParams(window.location.search).get("e2e") === "true" ||
      window.sessionStorage?.getItem("e2e_mode") === "true" ||
      window.localStorage?.getItem("e2e_mode") === "true" ||
      envProvider === "local-test");

  // ── Critical Security Guard ────────────────────────────────────────────── //
  if (import.meta.env.PROD) {
    if (envProvider === "local-test" || isE2E) {
      throw new Error(
        "Security Error: LocalTestProvider is strictly forbidden in production mode.",
      );
    }
    const provider = new UltravoxProvider();
    await provider.init();
    return provider;
  }

  // Non-production environment: choose between LocalTest and Ultravox
  if (isE2E || envProvider === "local-test") {
    return new LocalTestProvider();
  }

  const provider = new UltravoxProvider();
  await provider.init();
  return provider;
}
