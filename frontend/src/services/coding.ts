import apiClient from './auth'

export interface CodingChallenge {
  id: number
  title: string
  description: string
  difficulty: string
  domain: string
  language: string
  starter_code: string
}

export interface SubmitSolutionPayload {
  challenge_id: number
  code: string
  language: string
}

export interface CodingSubmissionResponse {
  id: number
  challenge_id: number
  status: 'SUCCESS' | 'FAILED' | 'COMPILE_ERROR'
  score: number
  feedback: string
  complexity: string
  code_quality: string
  created_at: string
}

export const codingService = {
  getChallenges: (language?: string, domain?: string): Promise<{ data: CodingChallenge[] }> => {
    let url = '/coding/challenges'
    const params = new URLSearchParams()
    if (language) params.append('language', language)
    if (domain) params.append('domain', domain)
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    return apiClient.get(url)
  },

  submitSolution: (payload: SubmitSolutionPayload): Promise<{ data: CodingSubmissionResponse }> =>
    apiClient.post('/coding/submit', payload),
}
