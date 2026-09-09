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
    __E2E_MODE__?: boolean;
    __E2E_INTERVIEWER__?: E2EInterviewerControls;
  }
}
