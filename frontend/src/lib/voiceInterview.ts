import type { InterviewConfig, ParsedResume, Question } from '../types';

export type VoiceInterviewStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'ended' | 'error';

export interface VoiceTranscriptItem {
  role: 'assistant' | 'user';
  content: string;
  isFinal: boolean;
}

export interface VoiceInterviewStartResponse {
  sessionId: string;
  assistantId: string;
  variableValues: Record<string, string>;
}

export interface VoiceInterviewStartPayload {
  config: InterviewConfig;
  questions: Question[];
  resume: Pick<
    ParsedResume,
    | 'candidateName'
    | 'summary'
    | 'detectedRole'
    | 'extractedSkills'
    | 'technicalSkills'
    | 'projects'
    | 'workExperience'
    | 'internshipExperience'
    | 'education'
    | 'certifications'
    | 'experienceYears'
  > | null;
}

export function createVoiceInterviewPayload(config: InterviewConfig, questions: Question[], resume: ParsedResume | null): VoiceInterviewStartPayload {
  return {
    config,
    questions,
    resume: resume ? {
      candidateName: resume.candidateName,
      summary: resume.summary,
      detectedRole: resume.detectedRole,
      extractedSkills: resume.extractedSkills || resume.technicalSkills || [],
      technicalSkills: resume.technicalSkills || [],
      projects: resume.projects || [],
      workExperience: resume.workExperience || [],
      internshipExperience: resume.internshipExperience || [],
      education: resume.education || [],
      certifications: resume.certifications || [],
      experienceYears: resume.experienceYears || 0
    } : null
  };
}
