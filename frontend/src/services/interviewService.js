import api, { getApiErrorMessage } from './api.js';
import { endpoints } from './endpoints.js';

export async function startInterview({
  interviewType = 'technical',
  jobRole,
  interviewDuration = 30,
  maxQuestions = 10,
  resume,
}) {
  const response = await api.post(endpoints.interview.start, {
    job_role: jobRole,
    interview_type: interviewType,
    interview_duration: Number(interviewDuration),
    max_questions: maxQuestions,
    resume,
  });

  return response.data;
}

export async function submitAnswer({ sessionId, answer }) {
  const response = await api.post(endpoints.interview.answer, {
    session_id: sessionId,
    answer,
  });

  return response.data;
}

export { getApiErrorMessage };
