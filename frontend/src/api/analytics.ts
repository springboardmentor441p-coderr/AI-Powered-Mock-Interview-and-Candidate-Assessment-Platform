import { get } from "@/api/client";
import type {
  CandidateDashboard,
  CandidateRanking,
  PerformanceSummary,
  RecruiterDashboard,
  ScoreTrendPoint,
} from "@/types/api";

export const analyticsApi = {
  async candidateDashboard(): Promise<CandidateDashboard> {
    return get<CandidateDashboard>("/analytics/candidate/dashboard/");
  },
  async candidateSummary(): Promise<PerformanceSummary> {
    return get<PerformanceSummary>("/analytics/candidate/summary/");
  },
  async candidateTrend(): Promise<ScoreTrendPoint[]> {
    return get<ScoreTrendPoint[]>("/analytics/candidate/trend/");
  },
  async candidateWeakAreas(): Promise<{ weak_areas: string[] }> {
    return get<{ weak_areas: string[] }>("/analytics/candidate/weak-areas/");
  },
  async candidateReport(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/analytics/candidate/report/");
  },
  async recruiterDashboard(): Promise<RecruiterDashboard> {
    return get<RecruiterDashboard>("/analytics/recruiter/dashboard/");
  },
  async recruiterRankings(): Promise<CandidateRanking[]> {
    return get<CandidateRanking[]>("/analytics/recruiter/rankings/");
  },
  async platformOverview() {
    return get("/analytics/recruiter/overview/");
  },
};
