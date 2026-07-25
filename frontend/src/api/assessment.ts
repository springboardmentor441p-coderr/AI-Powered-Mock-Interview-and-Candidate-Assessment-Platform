import { get, post } from "@/api/client";
import type { FinalScore, SessionFeedback, SpeechAnalysis } from "@/types/api";

export const assessmentApi = {
  async speechAnalysis(sessionId: string): Promise<SpeechAnalysis> {
    return get<SpeechAnalysis>(`/assessments/sessions/${sessionId}/analysis/`);
  },
  async finalScore(sessionId: string): Promise<FinalScore> {
    return get<FinalScore>(`/assessments/sessions/${sessionId}/score/`);
  },
  async feedback(sessionId: string): Promise<SessionFeedback> {
    return get<SessionFeedback>(`/assessments/sessions/${sessionId}/feedback/`);
  },
  async retrigger(sessionId: string): Promise<void> {
    await post(`/assessments/sessions/${sessionId}/retrigger/`);
  },
};
