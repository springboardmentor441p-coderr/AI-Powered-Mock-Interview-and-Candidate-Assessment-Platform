export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  targetRole: string;
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  skills: string[];
  avatarUrl?: string;
  createdAt: string;
}

export type InterviewType = 'Technical' | 'HR' | 'Behavioral' | 'Aptitude';

export interface InterviewConfig {
  type: InterviewType;
  targetRole: string;
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  questionCount: number;
  timeLimitMinutes: number;
  topics: string[];
  includeCodeSnippet: boolean;
  resumeSkills?: string[];
}

export interface InterviewQuestion {
  id: string;
  questionNumber: number;
  category: InterviewType;
  questionText: string;
  hint?: string;
  sampleCodeSnippet?: string;
  timeAllowedSeconds: number;
  isAiGenerated?: boolean;
}

export interface SpeechMetrics {
  durationSeconds: number;
  wordCount: number;
  wordsPerMinute: number;
  fillerWordCount: number;
  fillerWordPercentage: number;
  detectedFillerWords: string[];
  fluencyScore: number; // 0-100
  fluencyLabel: string;
  grammarStatus: 'Good' | 'Minor Issues Detected' | 'Multiple Issues Detected';
  grammarDetails?: string;
  pronunciationStatus: 'Unavailable' | 'Good' | 'Needs Improvement';
  speechAnalysisStatus: 'Analyzed' | 'Not Configured' | 'Failed' | 'Empty';
}

export interface QuestionAnswerMetadata {
  questionId: string;
  questionText: string;
  answerText: string;
  transcript?: string;
  recordingDurationSeconds?: number;
  speechMetrics?: SpeechMetrics;
}

export interface ActiveInterviewSession {
  interviewId: string;
  config: InterviewConfig;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  speechData?: Record<string, QuestionAnswerMetadata>;
  currentIndex: number;
  startTime: number; // Date.now() timestamp
  timeLimitSeconds: number;
  timeLeftSeconds?: number;
}

export interface CompletedInterviewSession {
  id: string;
  interviewId: string;
  type: InterviewType;
  domain: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  speechData?: Record<string, QuestionAnswerMetadata>;
  config?: InterviewConfig;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  completionStatus: 'Completed' | 'Time Expired' | 'Terminated Early';
  answeredCount: number;
  unansweredCount: number;
  totalQuestions: number;
}

export interface QuestionFeedback {
  questionId: string;
  questionText: string;
  category?: string;
  candidateAnswer: string;
  score: number; // 0-100
  evaluation: string;
  improvementSuggestion: string;
  strengths?: string[];
  improvements?: string[];
  modelAnswer?: string;
  speechMetrics?: SpeechMetrics;
}

export interface CategoryDetail {
  score: number; // 0-100
  weight: number; // e.g. 0.30
  explanation: string;
  factors: string[]; // what affected the score
  isAnswerBasedEstimate?: boolean;
}

export interface AssessmentResult {
  id: string;
  interviewId?: string;
  title: string;
  type: InterviewType;
  domain?: string;
  date: string;
  durationMinutes: number;
  overallScore: number; // 0-100
  isAiEvaluated?: boolean;
  evaluationSource?: 'Gemini AI' | 'Local Rule Engine';
  categoryScores: {
    communication: CategoryDetail;
    confidence: CategoryDetail;
    technicalRelevance: CategoryDetail;
    professionalism: CategoryDetail;
  };
  metrics: {
    technicalDepth: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    speed: number;
  };
  summaryFeedback: string;
  keyStrengths: string[];
  weaknesses: string[];
  areasToImprove: string[];
  improvementSuggestions: string[];
  practiceRecommendations: string[];
  questionFeedbacks: QuestionFeedback[];
}

export type ResumeStatus = 'Uploaded' | 'Processing' | 'Successfully analyzed' | 'Failed';

export interface ResumeAnalysis {
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  status: ResumeStatus;
  statusMessage?: string;
  parsedName: string;
  parsedEmail: string;
  parsedPhone?: string;
  parsedSkills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  detectedRole: string;
  matchScore: number; // 0-100 against target role
  formattingScore: number;
  keyHighlights: string[];
  missingKeywords: string[];
  improvementSuggestions: string[];
  rawText?: string;
}

export interface AnalyticsSummary {
  totalInterviews: number;
  averageScore: number;
  totalPracticeTimeMinutes: number;
  readinessLevel: 'Developing' | 'Job Ready' | 'Highly Competitive';
  radarMetrics: {
    metric: string;
    score: number;
  }[];
  recentPerformance: {
    date: string;
    score: number;
    category: string;
  }[];
  categoryBreakdown: {
    type: InterviewType;
    count: number;
    avgScore: number;
  }[];
}
