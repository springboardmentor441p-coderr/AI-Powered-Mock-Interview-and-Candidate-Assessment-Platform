import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { candidateApi } from "@/api/candidate";
import { resumesApi } from "@/api/resumes";
import { interviewsApi, type CreateRealtimeSessionPayload } from "@/api/interviews";
import { assessmentApi } from "@/api/assessment";
import { analyticsApi } from "@/api/analytics";
import type { ApiError } from "@/api/client";
import type { CandidateProfile } from "@/types/api";

export const candidateKeys = {
  profile: ["candidate", "profile"] as const,
  resumes: ["candidate", "resumes"] as const,
  templates: ["interviews", "templates"] as const,
  sessions: ["interviews", "sessions"] as const,
  session: (id: string) => ["interviews", "sessions", id] as const,
  realtimeTranscript: (id: string) => ["interviews", "sessions", id, "transcript-live"] as const,
  fullTranscript: (id: string) => ["interviews", "sessions", id, "transcript-full"] as const,
  threadEvals: (id: string) => ["interviews", "sessions", id, "thread-evals"] as const,
  brief: (id: string) => ["interviews", "sessions", id, "brief"] as const,
  speech: (id: string) => ["assessments", id, "speech"] as const,
  score: (id: string) => ["assessments", id, "score"] as const,
  feedback: (id: string) => ["assessments", id, "feedback"] as const,
  dashboard: ["analytics", "candidate", "dashboard"] as const,
};

// --- Profile ---
export function useCandidateProfile() {
  return useQuery({ queryKey: candidateKeys.profile, queryFn: candidateApi.getProfile });
}

export function useUpdateCandidateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CandidateProfile>) => candidateApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.profile });
      toast.success("Profile updated.");
    },
    onError: (error: ApiError) => toast.error(error.message || "Couldn't update your profile."),
  });
}

// --- Resumes ---
export function useResumes() {
  return useQuery({ queryKey: candidateKeys.resumes, queryFn: resumesApi.list });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, makePrimary }: { file: File; makePrimary?: boolean }) =>
      resumesApi.upload(file, makePrimary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.resumes });
      toast.success("Résumé uploaded — parsing now.");
    },
    onError: (error: ApiError) => toast.error(error.message || "Upload failed."),
  });
}

export function useReprocessResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resumeId: string) => resumesApi.reprocess(resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.resumes });
      toast.success("Reprocessing started.");
    },
    onError: (error: ApiError) => toast.error(error.message || "Couldn't reprocess this résumé."),
  });
}

// --- Templates ---
export function useInterviewTemplates() {
  return useQuery({ queryKey: candidateKeys.templates, queryFn: interviewsApi.templates });
}

// --- Realtime sessions ---
export function useCreateRealtimeSession() {
  return useMutation({
    mutationFn: (payload: CreateRealtimeSessionPayload) => interviewsApi.createRealtime(payload),
    onError: (error: ApiError) => toast.error(error.message || "Couldn't create the session."),
  });
}

export function useStartRealtimeSession() {
  return useMutation({
    mutationFn: (sessionId: string) => interviewsApi.startRealtime(sessionId),
    onError: (error: ApiError) => toast.error(error.message || "Couldn't start the interview."),
  });
}

export function useRealtimeSessionPoll(sessionId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: sessionId ? candidateKeys.session(sessionId) : ["interviews", "sessions", "none"],
    queryFn: () => interviewsApi.realtimeDetail(sessionId as string),
    enabled: Boolean(sessionId) && enabled,
    refetchInterval: 2500,
  });
}

// --- History ---
export function useSessions() {
  return useQuery({ queryKey: candidateKeys.sessions, queryFn: interviewsApi.list });
}

export function useSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? candidateKeys.session(sessionId) : ["interviews", "sessions", "none"],
    queryFn: () => interviewsApi.detail(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useFullTranscript(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? candidateKeys.fullTranscript(sessionId) : ["transcript", "none"],
    queryFn: () => interviewsApi.fullTranscript(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useThreadEvaluations(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? candidateKeys.threadEvals(sessionId) : ["thread-evals", "none"],
    queryFn: () => interviewsApi.threadEvaluations(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useBrief(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? candidateKeys.brief(sessionId) : ["brief", "none"],
    queryFn: () => interviewsApi.brief(sessionId as string),
    enabled: Boolean(sessionId),
    retry: false,
  });
}

export function useSpeechAnalysis(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? candidateKeys.speech(sessionId) : ["speech", "none"],
    queryFn: () => assessmentApi.speechAnalysis(sessionId as string),
    enabled: Boolean(sessionId),
    retry: false,
  });
}

export function useFinalScore(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? candidateKeys.score(sessionId) : ["score", "none"],
    queryFn: () => assessmentApi.finalScore(sessionId as string),
    enabled: Boolean(sessionId),
    retry: false,
  });
}

export function useSessionFeedback(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? candidateKeys.feedback(sessionId) : ["feedback", "none"],
    queryFn: () => assessmentApi.feedback(sessionId as string),
    enabled: Boolean(sessionId),
    retry: false,
  });
}

// --- Analytics ---
export function useCandidateDashboard() {
  return useQuery({ queryKey: candidateKeys.dashboard, queryFn: analyticsApi.candidateDashboard });
}
