import { get, getList, post, patch } from "@/api/client";
import type { Paginated } from "@/api/client";
import type {
  ConversationTurn,
  InterviewBrief,
  InterviewSessionDetail,
  InterviewSessionListItem,
  InterviewTemplate,
  RealtimeSessionDetail,
  ThreadEvaluation,
  Transcript,
} from "@/types/api";

export interface CreateSessionPayload {
  interview_type: string;
  domain: string;
  difficulty: "easy" | "medium" | "hard";
  question_count: number;
  template_id?: string;
  use_primary_resume?: boolean;
}

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

  // Scripted flow
  async list(): Promise<Paginated<InterviewSessionListItem>> {
    return getList<InterviewSessionListItem>("/interviews/sessions/");
  },
  async detail(sessionId: string): Promise<InterviewSessionDetail> {
    return get<InterviewSessionDetail>(`/interviews/sessions/${sessionId}/`);
  },
  async create(payload: CreateSessionPayload): Promise<InterviewSessionDetail> {
    return post<InterviewSessionDetail>("/interviews/sessions/create/", payload);
  },
  async start(sessionId: string): Promise<InterviewSessionDetail> {
    return post<InterviewSessionDetail>(`/interviews/sessions/${sessionId}/start/`);
  },
  async answer(
    sessionId: string,
    payload: { question_order: number; answer_text?: string; response_time_seconds?: number },
  ) {
    return post(`/interviews/sessions/${sessionId}/answer/`, payload);
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
  async realtimeTranscript(sessionId: string): Promise<ConversationTurn[]> {
    return get<ConversationTurn[]>(`/interviews/realtime/sessions/${sessionId}/transcript/`);
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
