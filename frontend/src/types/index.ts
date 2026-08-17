export type InterviewTrack = 
  | 'Technical' 
  | 'HR' 
  | 'Behavioral' 
  | 'Managerial' 
  | 'System Design' 
  | 'Coding' 
  | 'Aptitude' 
  | 'Custom';

export type ExperienceLevel = 'Fresher' | '1-3 Years' | '3-5 Years' | 'Senior';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'FAANG';

export type InterviewDuration = 10 | 20 | 30 | 45 | 60;

export interface InterviewerPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  accentColor: string;
  voiceGender: 'male' | 'female';
  tone: 'analytical' | 'encouraging' | 'rigorous';
}

export interface InterviewConfig {
  id: string;
  title: string;
  track: InterviewTrack;
  subCategory?: string;
  experienceLevel: ExperienceLevel;
  difficulty: DifficultyLevel;
  durationMinutes: InterviewDuration;
  persona: InterviewerPersona;
  preferredLanguage: string;
  enableProctoring: boolean;
  resumeSkillsUsed?: string[];
  customRoleTitle?: string;
}

export interface Question {
  id: string;
  track: InterviewTrack;
  text: string;
  topic: string;
  difficulty: DifficultyLevel;
  codeSnippet?: string;
  expectedKeyPoints: string[];
  idealAnswer: string;
}

export interface AnswerRecord {
  questionId: string;
  questionText: string;
  topic: string;
  candidateResponse: string;
  audioDurationSeconds: number;
  score: number; // 0 - 100
  technicalAccuracy: number; // 0 - 100
  communicationFluency: number; // 0 - 100
  problemSolvingDepth: number; // 0 - 100
  bodyLanguageConfidence: number; // 0 - 100
  aiFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  idealAnswerComparison: string;
}

export interface ProctoringEvent {
  id: string;
  timestamp: string;
  type: 'TAB_SWITCH' | 'FACE_MISSING' | 'MULTIPLE_FACES' | 'LOOKING_AWAY' | 'SILENCE' | 'COPY_PASTE';
  severity: 'warning' | 'critical';
  message: string;
}

export interface EvaluationReport {
  id: string;
  config: InterviewConfig;
  createdAt: string;
  candidateName: string;
  candidateEmail: string;
  userId?: string;
  overallScore: number;
  readinessRating: string;
  categoryScores: {
    technicalKnowledge: number;
    communicationSkills: number;
    behavioralSkills: number;
    bodyLanguage: number;
    deliveryAndPacing: number;
  };
  answers: AnswerRecord[];
  proctoringEvents: ProctoringEvent[];
  strengths: string[];
  weaknesses: string[];
  recommendedImprovements: string[];
  learningResources: { title: string; url: string; category: string }[];
  videoRecordingAvailable: boolean;
  totalDurationSeconds: number;
}

export interface StructuredExperience {
  role: string;
  company: string;
  duration?: string;
  description: string[];
}

export interface StructuredProject {
  title: string;
  techStack?: string[];
  description: string;
  link?: string;
}

export interface StructuredEducation {
  degree: string;
  institution: string;
  year?: string;
  fieldOfStudy?: string;
}

export type DocumentClassificationType = 'VALID_RESUME' | 'NOT_A_RESUME' | 'UNCLEAR';

export interface CategorizedSkills {
  programmingLanguages: string[];
  frameworks: string[];
  libraries: string[];
  databases: string[];
  tools: string[];
  softSkills: string[];
}

export interface ExtractedFieldWithEvidence<T = string> {
  value: T;
  confidence: number; // 0.0 to 1.0
  evidenceSnippet?: string;
}

export interface StructuredResumeUnderstanding {
  document_type: DocumentClassificationType;
  confidence: number; // 0.0 - 1.0
  rejectionReason?: string;
  candidate: {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    location?: string;
  };
  summary?: string;
  skills: CategorizedSkills;
  education: Array<StructuredEducation & { evidence?: string; confidence?: number }>;
  experience: Array<StructuredExperience & { evidence?: string; confidence?: number }>;
  internships: Array<StructuredExperience & { evidence?: string; confidence?: number }>;
  projects: Array<StructuredProject & { evidence?: string; confidence?: number }>;
  certifications: Array<{ title: string; issuer?: string; date?: string; evidence?: string }>;
  achievements: string[];
  publications: string[];
  languages: string[];
  other: string[];
  evidenceMap?: Record<string, string>;
}

export interface ResumeValidation {
  completenessScore: number;
  extractedFieldCount: number;
  totalFieldsCount: number;
  checksPassed: string[];
  warnings: string[];
  confidenceScores?: Record<string, number>;
}

export interface ParsedResume {
  fileName: string;
  fileSizeFormatted?: string;
  uploadedAt: string;
  isResume?: boolean;
  document_type?: DocumentClassificationType;
  confidence?: number;
  rejectionReason?: string;
  candidateName: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary: string;
  extractedSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  programmingLanguages: string[];
  toolsAndTechnologies: string[];
  categorizedSkills?: CategorizedSkills;
  experienceYears: number;
  detectedRole: string;
  education: string[];
  projects: string[];
  workExperience: string[];
  internshipExperience: string[];
  certifications: string[];
  achievements: string[];
  publications?: string[];
  languagesSpoken?: string[];
  awards?: string[];
  interests?: string[];
  structuredWorkExperience?: StructuredExperience[];
  structuredInternships?: StructuredExperience[];
  structuredProjects?: StructuredProject[];
  structuredEducation?: StructuredEducation[];
  structuredUnderstanding?: StructuredResumeUnderstanding;
  evidenceMap?: Record<string, string>;
  validation: ResumeValidation;
  isPrimary?: boolean;
  rawText?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'candidate' | 'recruiter' | 'admin';
  companyName?: string;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  resumes: ParsedResume[];
  completedInterviewsCount: number;
  averageScore: number;
  readinessLevel: string;
}

// Enterprise Recruiter ATS Types
export interface JobCampaign {
  id: string;
  title: string;
  department: string;
  location: string;
  track: InterviewTrack;
  experienceLevel: ExperienceLevel;
  difficulty: DifficultyLevel;
  passThresholdScore: number;
  assignedPersona: InterviewerPersona;
  candidateCount: number;
  assessmentUrl: string;
  status: 'Active' | 'Paused' | 'Archived';
  createdAt: string;
}

export interface CandidateApplication {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobCampaignTitle: string;
  appliedDate: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  behavioralScore: number;
  proctoringStatus: 'Clean' | 'Minor Warnings' | 'Flagged Malpractice';
  recommendation: 'Strong Hire' | 'Shortlist' | 'Needs Review' | 'Reject';
  reportId: string;
  resumeFileName: string;
}
