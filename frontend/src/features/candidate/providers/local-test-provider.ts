import type { IInterviewProvider, InterviewTranscriptLine } from "./interview-provider";

export const DETERMINISTIC_QUESTIONS = [
  "Tell me about yourself.",
  "Explain polymorphism in object-oriented programming.",
  "What is the difference between BFS and DFS?",
  "Describe a challenging technical project you have worked on.",
];

export const DEFAULT_CANDIDATE_ANSWERS = [
  "I am a full-stack engineer with 4 years of experience building web and distributed systems.",
  "Polymorphism allows objects of different types to be treated through a common interface, either at compile-time or runtime.",
  "BFS explores breadth-first level by level using a queue, while DFS explores depth-first using a stack or recursion.",
  "I led the development of a real-time event processing engine that scaled to handle over 10,000 requests per second.",
];

export interface E2EInterviewerControls {
  askNextQuestion: () => void;
  submitCandidateAnswer: (answerText?: string) => void;
  simulateError: (msg?: string) => void;
  simulateDisconnect: () => void;
  getAudioLevel: () => number;
  isMicMuted: () => boolean;
  getCurrentQuestionIndex: () => number;
  getQuestions: () => string[];
  isCallActive: () => boolean;
}

declare global {
  interface Window {
    __E2E_INTERVIEWER__?: E2EInterviewerControls;
  }
}

export class LocalTestProvider implements IInterviewProvider {
  private _status = "idle";
  private _transcripts: InterviewTranscriptLine[] = [];
  private statusListeners: Array<() => void> = [];
  private transcriptListeners: Array<() => void> = [];

  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private muted = false;
  private currentQuestionIdx = 0;
  private active = false;

  constructor() {
    this.setupWindowControls();
  }

  private setupWindowControls() {
    // Only expose in non-production
    if (typeof window !== "undefined" && !import.meta.env.PROD) {
      window.__E2E_INTERVIEWER__ = {
        askNextQuestion: () => this.askNextQuestion(),
        submitCandidateAnswer: (text?: string) => this.submitCandidateAnswer(text),
        simulateError: (msg?: string) => this.simulateError(msg),
        simulateDisconnect: () => this.simulateDisconnect(),
        getAudioLevel: () => this.getAudioLevel(),
        isMicMuted: () => this.muted,
        getCurrentQuestionIndex: () => this.currentQuestionIdx,
        getQuestions: () => [...DETERMINISTIC_QUESTIONS],
        isCallActive: () => this.active,
      };
    }
  }

  async joinCall(_joinUrl: string): Promise<void> {
    this._status = "connecting";
    this.notifyStatus();

    // 1. Acquire microphone stream (exercises real browser/Chromium media permission & device lifecycle)
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      this._status = "disconnected";
      this.notifyStatus();
      throw err;
    }

    // 2. Setup Web Audio analyser to measure real fake-microphone energy
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
      }
    } catch {
      // AudioContext unavailable or blocked — non-fatal
    }

    this.active = true;
    this.currentQuestionIdx = 0;

    // 3. Begin interview with first question
    this.emitAgentQuestion(DETERMINISTIC_QUESTIONS[0]);
  }

  leaveCall(): void {
    this.active = false;
    this._status = "disconnected";
    this.notifyStatus();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }

  muteMic(): void {
    this.muted = true;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
    }
  }

  unmuteMic(): void {
    this.muted = false;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
    }
  }

  get status(): string {
    return this._status;
  }

  get transcripts(): InterviewTranscriptLine[] {
    return [...this._transcripts];
  }

  addEventListener(event: "status" | "transcripts", listener: () => void): void {
    if (event === "status") {
      this.statusListeners.push(listener);
    } else if (event === "transcripts") {
      this.transcriptListeners.push(listener);
    }
  }

  removeEventListener(event: "status" | "transcripts", listener: () => void): void {
    if (event === "status") {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    } else if (event === "transcripts") {
      this.transcriptListeners = this.transcriptListeners.filter((l) => l !== listener);
    }
  }

  private notifyStatus(): void {
    for (const listener of this.statusListeners) {
      try {
        listener();
      } catch (e) {
        console.error("[LocalTestProvider] status listener error:", e);
      }
    }
  }

  private notifyTranscripts(): void {
    for (const listener of this.transcriptListeners) {
      try {
        listener();
      } catch (e) {
        console.error("[LocalTestProvider] transcripts listener error:", e);
      }
    }
  }

  private emitAgentQuestion(questionText: string): void {
    this._status = "speaking";
    this.notifyStatus();

    this._transcripts.push({
      speaker: "agent",
      text: questionText,
      isFinal: true,
    });
    this.notifyTranscripts();

    // After brief speaking phase, transition to listening for candidate
    setTimeout(() => {
      if (this.active) {
        this._status = "listening";
        this.notifyStatus();
      }
    }, 100);
  }

  public submitCandidateAnswer(customAnswer?: string): void {
    if (!this.active) return;

    const answer =
      customAnswer ||
      DEFAULT_CANDIDATE_ANSWERS[this.currentQuestionIdx] ||
      "This is my answer to the question.";

    this._status = "thinking";
    this.notifyStatus();

    this._transcripts.push({
      speaker: "candidate",
      text: answer,
      isFinal: true,
    });
    this.notifyTranscripts();

    // Move to next question after candidate responds
    this.currentQuestionIdx += 1;
    if (this.currentQuestionIdx < DETERMINISTIC_QUESTIONS.length) {
      setTimeout(() => {
        if (this.active) {
          this.emitAgentQuestion(DETERMINISTIC_QUESTIONS[this.currentQuestionIdx]);
        }
      }, 150);
    } else {
      setTimeout(() => {
        if (this.active) {
          this._transcripts.push({
            speaker: "agent",
            text: "Thank you for completing the interview! You may now submit your session.",
            isFinal: true,
          });
          this.notifyTranscripts();
          this._status = "idle";
          this.notifyStatus();
        }
      }, 150);
    }
  }

  public askNextQuestion(): void {
    if (!this.active) return;
    this.currentQuestionIdx += 1;
    if (this.currentQuestionIdx < DETERMINISTIC_QUESTIONS.length) {
      this.emitAgentQuestion(DETERMINISTIC_QUESTIONS[this.currentQuestionIdx]);
    }
  }

  public simulateError(msg?: string): void {
    this._status = "disconnected";
    this.notifyStatus();
    if (msg) {
      console.warn("[LocalTestProvider] Simulated error:", msg);
    }
  }

  public simulateDisconnect(): void {
    this._status = "disconnected";
    this.notifyStatus();
  }

  public getAudioLevel(): number {
    if (!this.analyser || this.muted) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  }
}
