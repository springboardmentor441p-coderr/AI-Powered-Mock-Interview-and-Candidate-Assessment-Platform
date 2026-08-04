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

  // Invitations
  async sendInvitation(payload: SendInvitationPayload) {
    return post<import("@/types/api").InterviewInvitation>("/interviews/invitations/send/", payload);
  },
  async sentInvitations(): Promise<Paginated<import("@/types/api").InterviewInvitation>> {
    return getList("/interviews/invitations/sent/");
  },
  async receivedInvitations(): Promise<Paginated<import("@/types/api").ReceivedInvitation>> {
    return getList("/interviews/invitations/received/");
  },
  async acceptInvitation(invitationId: string): Promise<import("@/types/api").RealtimeSessionDetail> {
    return post(`/interviews/invitations/${invitationId}/accept/`);
  },
  async recruiterHistory(): Promise<RecruiterHistoryResponse> {
    return get("/interviews/invitations/history/");
  },
};

// ---- Invitations ----------------------------------------------------------------
export interface SendInvitationPayload {
  candidate_email: string;
  template_id?: string;
  message?: string;
}

export interface RecruiterHistoryResponse {
  items: import("@/types/api").RecruiterHistoryItem[];
  count: number;
}