import { User, InterviewConfig, InterviewQuestion, AssessmentResult, ResumeAnalysis, AnalyticsSummary, QuestionAnswerMetadata } from '../../types';
import { resumeService } from './resumeService';
import { assessmentService } from './assessmentService';

const API_BASE = '/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

export const api = {
  auth: {
    login: (email: string) => fetchJson<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    signup: (data: Partial<User>) => fetchJson<{ user: User; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getProfile: (userId?: string) => fetchJson<User>(`/auth/profile${userId ? `?userId=${userId}` : ''}`),
  },

  interview: {
    setup: (config: InterviewConfig) => fetchJson<{ config: InterviewConfig; questions: InterviewQuestion[] }>('/interview/setup', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
    nextQuestion: (params: {
      type: string;
      difficulty: string;
      domain: string;
      resumeSkills?: string[];
      questionNumber: number;
      totalQuestions: number;
      previousQaPairs?: Array<{ questionText: string; candidateAnswer: string }>;
      topics?: string[];
      includeCodeSnippet?: boolean;
    }) => fetchJson<InterviewQuestion>('/interview/next-question', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    submit: (
      config: InterviewConfig,
      answers: Record<string, string>,
      sessionQuestions?: InterviewQuestion[],
      speechData?: Record<string, QuestionAnswerMetadata>
    ) => fetchJson<AssessmentResult>('/interview/submit', {
      method: 'POST',
      body: JSON.stringify({ config, answers, sessionQuestions, speechData }),
    }),
    getHistory: async () => {
      const dbAssessments = await assessmentService.getAllAssessmentsAsync();
      if (dbAssessments && dbAssessments.length > 0) {
        return dbAssessments;
      }
      return fetchJson<AssessmentResult[]>('/interview/history').catch(() => []);
    },
    getResultById: async (id: string) => {
      const dbAssessments = await assessmentService.getAllAssessmentsAsync();
      const found = dbAssessments.find((a) => a.id === id);
      if (found) return found;
      return fetchJson<AssessmentResult>(`/interview/result/${id}`);
    },
  },

  resume: {
    parse: async (fileName: string, targetJobRole?: string) => {
      const saved = await resumeService.getSavedAnalysisAsync();
      if (saved) return saved;
      return fetchJson<ResumeAnalysis>('/resume/parse', {
        method: 'POST',
        body: JSON.stringify({ fileName, targetJobRole }),
      });
    },
    getAnalysis: async () => {
      const saved = await resumeService.getSavedAnalysisAsync();
      if (saved) return saved;
      return fetchJson<ResumeAnalysis>('/resume/analysis').catch(() => null as any);
    },
  },

  analytics: {
    getSummary: async () => {
      const localAssessments = await assessmentService.getAllAssessmentsAsync();
      if (localAssessments && localAssessments.length > 0) {
        return assessmentService.getAnalyticsSummary();
      }
      return fetchJson<AnalyticsSummary>('/analytics').catch(() => assessmentService.getAnalyticsSummary());
    },
  }
};

