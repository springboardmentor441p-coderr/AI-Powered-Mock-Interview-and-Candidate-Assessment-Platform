import api from './api.js';
import { endpoints } from './endpoints.js';

export async function parseResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(endpoints.resume.parse, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function startInterview({ interviewType, jobRole, maxQuestions = 10, resume }) {
  const response = await api.post(endpoints.interview.start, {
    job_role: jobRole,
    interview_type: interviewType,
    resume,
    max_questions: maxQuestions,
  });

  return response.data;
}
