import type { IInterviewProvider, InterviewTranscriptLine } from "./interview-provider";

export class UltravoxProvider implements IInterviewProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any = null;

  async init(): Promise<void> {
    const { UltravoxSession } = await import("ultravox-client");
    this.session = new UltravoxSession();
  }

  async joinCall(joinUrl: string): Promise<void> {
    if (!this.session) {
      await this.init();
    }
    return this.session.joinCall(joinUrl);
  }

  leaveCall(): void {
    if (this.session) {
      this.session.leaveCall();
    }
  }

  muteMic(): void {
    if (this.session) {
      this.session.muteMic();
    }
  }

  unmuteMic(): void {
    if (this.session) {
      this.session.unmuteMic();
    }
  }

  addEventListener(event: "status" | "transcripts", listener: () => void): void {
    if (this.session) {
      this.session.addEventListener(event, listener);
    }
  }

  removeEventListener(event: "status" | "transcripts", listener: () => void): void {
    if (this.session) {
      this.session.removeEventListener(event, listener);
    }
  }

  get status(): string {
    return this.session ? this.session.status : "idle";
  }

  get transcripts(): InterviewTranscriptLine[] {
    if (!this.session?.transcripts) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.session.transcripts.map((t: any) => ({
      speaker: t.speaker === "agent" ? "agent" : "candidate",
      text: t.text,
      isFinal: Boolean(t.isFinal),
    }));
  }
}
