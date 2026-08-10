import apiClient from './auth'

export interface ParsedResume {
  id: number
  filename: string
  file_size: number
  uploaded_at: string
  candidate_name: string | null
  candidate_email: string | null
  candidate_phone: string | null
  summary: string | null
  skills: string[]
  education: Array<{
    degree: string | null
    institution: string | null
    year: string | null
  }>
  experience: Array<{
    title: string | null
    company: string | null
    duration: string | null
    description: string | null
  }>
}

export interface ResumeListItem {
  id: number
  filename: string
  file_size: number
  candidate_name: string | null
  skills_count: number
  uploaded_at: string
}

export const resumeService = {
  /**
   * Upload a PDF/DOCX resume — returns structured parsed data.
   * Reports progress via onProgress(percent) if provided.
   */
  uploadResume: (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<{ data: ParsedResume }> => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      },
    })
  },

  /** Fetch the most recently uploaded resume for the authenticated user. */
  getLatestResume: (): Promise<{ data: ParsedResume | null }> =>
    apiClient.get('/resume/latest').catch(() => ({ data: null })),

  /** List all resumes uploaded by the authenticated user. */
  listResumes: (): Promise<{ data: ResumeListItem[] }> =>
    apiClient.get('/resume/list'),
}
