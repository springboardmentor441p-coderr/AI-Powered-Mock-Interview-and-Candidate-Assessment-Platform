export interface InterviewTranscriptLine {
  speaker: "agent" | "candidate";
  text: string;
  isFinal: boolean;
}

export type InterviewCallStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected";

export interface IInterviewProvider {
  joinCall(joinUrl: string): Promise<void>;
  leaveCall(): void;
  muteMic(): void;
  unmuteMic(): void;

  addEventListener(event: "status", listener: () => void): void;
  removeEventListener(event: "status", listener: () => void): void;

  addEventListener(event: "transcripts", listener: () => void): void;
  removeEventListener(event: "transcripts", listener: () => void): void;

  readonly status: string;
  readonly transcripts: InterviewTranscriptLine[];
}
