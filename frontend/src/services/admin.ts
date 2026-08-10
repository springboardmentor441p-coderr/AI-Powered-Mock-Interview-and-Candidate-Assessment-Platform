import apiClient from './auth'

export interface CandidateSummary {
  id: number
  username: string
  email: string
  resume_score: number
  interviews_completed: number
  avg_score: number
  best_score: number
  avg_coding_score: number
  latest_interview: string
  status: string
}

export interface CandidateDetails {
  candidate: {
    id: number
    username: string
    email: string
  }
  resume_score: number
  skills: string[]
  interviews: Array<{
    id: number
    job_role: string
    difficulty: string
    status: string
    score: number
    verdict: string
    created_at: string
  }>
  coding: Array<{
    id: number
    challenge_title: string
    language: string
    status: string
    score: number
    complexity: string
    code_quality: string
    created_at: string
  }>
}

export interface PlatformAnalytics {
  metrics: {
    total_candidates: number
    total_interviews: number
    completed_interviews: number
    pass_rate: number
    avg_score: number
    top_score: number
    avg_coding_score: number
  }
  distributions: {
    score: Record<string, number>
    role: Record<string, number>
  }
}

export const adminService = {
  getCandidates: (): Promise<{ data: CandidateSummary[] }> =>
    apiClient.get('/admin/candidates'),

  getCandidateDetails: (candidateId: number): Promise<{ data: CandidateDetails }> =>
    apiClient.get(`/admin/interviews/${candidateId}`),

  getAnalytics: (): Promise<{ data: PlatformAnalytics }> =>
    apiClient.get('/admin/analytics'),
}
