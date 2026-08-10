import apiClient from './auth'

export interface StartInterviewPayload {
  job_role: string
  difficulty: string
  interview_type: string
}

export interface StartInterviewResponse {
  session_id: number
  current_round: number
  question_id: number
  question_text: string
}

export interface SubmitAnswerPayload {
  session_id: number
  question_id: number
  answer_text: string
}

export interface EvaluationMetricDetail {
  score: number
  technical_accuracy: number
  concept_understanding: number
  communication: number
  problem_solving: number
  confidence: number
  completeness: number
  practical_knowledge: number
  strengths: string
  weaknesses: string
}

export interface SubmitAnswerResponse {
  session_id: number
  question_id: number
  evaluation: EvaluationMetricDetail
  next_action: 'NEXT_QUESTION' | 'PROCEED_TO_ROUND_2' | 'GENERATE_REPORT'
  next_question: string | null
  next_question_id: number | null
}

export interface ReportResponse {
  id: number
  session_id: number
  overall_score: number
  round1_score: number
  round2_score: number
  strengths: string[]
  weaknesses: string[]
  learning_path: Array<{
    title: string
    description: string
    resources: string[]
  }>
  hiring_recommendation: string
  summary_notes: string
  created_at: string
  candidate_name: string | null
  candidate_email: string | null
  job_role: string | null
  difficulty: string | null
}

export interface InterviewHistoryItem {
  id: number
  job_role: string
  difficulty: string
  interview_type: string
  status: string
  current_round: number
  cumulative_score: number
  created_at: string
  finished_at: string | null
}

export const interviewService = {
  startInterview: (payload: StartInterviewPayload): Promise<{ data: StartInterviewResponse }> =>
    apiClient.post('/interview/start', payload),

  submitAnswer: (payload: SubmitAnswerPayload): Promise<{ data: SubmitAnswerResponse }> =>
    apiClient.post('/interview/submit-answer', payload),

  controlInterview: (session_id: number, action: 'pause' | 'resume' | 'stop' | 'end'): Promise<any> =>
    apiClient.post('/interview/control', { session_id, action }),

  getReport: (session_id: number): Promise<{ data: ReportResponse }> =>
    apiClient.get(`/interview/report/${session_id}`),

  getHistory: (): Promise<{ data: InterviewHistoryItem[] }> =>
    apiClient.get('/interview/history'),

  getCandidateProfile: (): Promise<any> =>
    apiClient.get('/candidate/profile'),
}
