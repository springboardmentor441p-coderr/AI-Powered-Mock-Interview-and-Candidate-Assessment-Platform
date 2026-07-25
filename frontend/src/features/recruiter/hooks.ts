import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { analyticsApi } from "@/api/analytics";
import { interviewsApi } from "@/api/interviews";
import type { ApiError } from "@/api/client";
import type { InterviewTemplate } from "@/types/api";

export const recruiterKeys = {
  dashboard: ["analytics", "recruiter", "dashboard"] as const,
  rankings: ["analytics", "recruiter", "rankings"] as const,
  templates: ["interviews", "templates"] as const,
  brief: (sessionId: string) => ["interviews", "sessions", sessionId, "brief"] as const,
};

export function useRecruiterDashboard() {
  return useQuery({ queryKey: recruiterKeys.dashboard, queryFn: analyticsApi.recruiterDashboard });
}

export function useRecruiterRankings() {
  return useQuery({ queryKey: recruiterKeys.rankings, queryFn: analyticsApi.recruiterRankings });
}

export function useTemplates() {
  return useQuery({ queryKey: recruiterKeys.templates, queryFn: interviewsApi.templates });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<InterviewTemplate, "id" | "created_at" | "is_active"> & { is_active?: boolean }) =>
      interviewsApi.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recruiterKeys.templates });
      toast.success("Template created.");
    },
    onError: (error: ApiError) => toast.error(error.message || "Couldn't create the template."),
  });
}

export function useSessionBriefLookup(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? recruiterKeys.brief(sessionId) : ["brief", "none"],
    queryFn: () => interviewsApi.brief(sessionId as string),
    enabled: Boolean(sessionId),
    retry: false,
  });
}

export function useSetHumanVerdict(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { human_verdict: string; human_notes?: string }) =>
      interviewsApi.setHumanVerdict(sessionId as string, payload),
    onSuccess: () => {
      if (sessionId) queryClient.invalidateQueries({ queryKey: recruiterKeys.brief(sessionId) });
      toast.success("Verdict saved.");
    },
    onError: (error: ApiError) => toast.error(error.message || "Couldn't save the verdict."),
  });
}
