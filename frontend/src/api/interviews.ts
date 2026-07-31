import { get, getList, post, patch } from "@/api/client";
import type { Paginated } from "@/api/client";
import type {
  InterviewBrief,
  InterviewSessionDetail,
  InterviewSessionListItem,
  InterviewTemplate,
  RealtimeSessionDetail,
  ThreadEvaluation,
  Transcript,
} from "@/types/api";

export interface CreateRealtimeSessionPayload {
  interview_type: string;
  domain: string;
  difficulty: "easy" | "medium" | "hard";
  topic_count: number;
  template_id?: string;
  use_primary_resume?: boolean;
}

export const interviewsApi = {
  async templates(): Promise<Paginated<InterviewTemplate>> {
    return getList<InterviewTemplate>("/interviews/templates/");
  },
  async createTemplate(payload: Omit<InterviewTemplate, "id" | "created_at" | "is_active"> & { is_active?: boolean }) {
    return post<InterviewTemplate>("/interviews/templates/", payload);
  },

  // Session list & detail (shared between history page and live room)
  async list(): Promise<Paginated<InterviewSessionListItem>> {
    return getList<InterviewSessionListItem>("/interviews/sessions/");
  },
  async detail(sessionId: string): Promise<InterviewSessionDetail> {
    return get<InterviewSessionDetail>(`/interviews/sessions/${sessionId}/`);
  },
  async complete(sessionId: string): Promise<InterviewSessionDetail> {
    return post<InterviewSessionDetail>(`/interviews/sessions/${sessionId}/complete/`);
  },

  // Realtime (voice) flow
  async createRealtime(payload: CreateRealtimeSessionPayload): Promise<RealtimeSessionDetail> {
    return post<RealtimeSessionDetail>("/interviews/realtime/sessions/create/", payload);
  },
  async realtimeDetail(sessionId: string): Promise<InterviewSessionDetail> {
    return get<InterviewSessionDetail>(`/interviews/sessions/${sessionId}/`);
  },
  async startRealtime(sessionId: string): Promise<RealtimeSessionDetail> {
    return post<RealtimeSessionDetail>(`/interviews/realtime/sessions/${sessionId}/start/`);
  },
  // Transcript & evaluation review
  async fullTranscript(sessionId: string): Promise<Transcript[]> {
    return get<Transcript[]>(`/interviews/realtime/sessions/${sessionId}/transcript/full/`);
  },
  async threadEvaluations(sessionId: string): Promise<ThreadEvaluation[]> {
    return get<ThreadEvaluation[]>(`/interviews/realtime/sessions/${sessionId}/thread-evaluations/`);
  },
  async brief(sessionId: string): Promise<InterviewBrief> {
    return get<InterviewBrief>(`/interviews/realtime/sessions/${sessionId}/brief/`);
  },
  async setHumanVerdict(sessionId: string, payload: { human_verdict: string; human_notes?: string }) {
    return patch<InterviewBrief>(`/interviews/realtime/sessions/${sessionId}/brief/`, payload);
  },
};
