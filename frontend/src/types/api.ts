// ---- Envelope -------------------------------------------------------------
// Every successful response: { success: true, message?, data }
// Every error response:      { success: false, error: { code, message, details } }

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | unknown[];
  };
}

// ---- Identity ---------------------------------------------------------------

export type Role = "candidate" | "recruiter" | "admin";

export interface Organization {
  id: string;
  name: string;
  domain: string;
  created_at: string;
}

export interface CandidateProfile {
  headline: string | null;
  target_role: string | null;
  experience_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  phone_number: string | null;
  avatar: string | null;
  is_email_verified: boolean;
  organization: string | null;
  candidate_profile: CandidateProfile | null;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ---- Resume ------------------------------------------------------------------

export type ResumeStatus = "pending" | "processing" | "processed" | "failed" | string;

export interface ExtractedSkill {
  id: string;
  name: string;
  category: string;
  confidence: number;
}

export interface Resume {
  id: string;
  original_filename: string;
  status: ResumeStatus;
  summary: string | null;
  experience_years: number | null;
  skills: string[];
  technologies: string[];
  education: unknown;
  failure_reason: string | null;
  is_primary: boolean;
  extracted_skills: ExtractedSkill[];
  created_at: string;
  updated_at: string;
}

// ---- Interview -----------------------------------------------------------------

export type InterviewType = string;
export type Difficulty = "easy" | "medium" | "hard" | string;
export type SessionStatus = "created" | "in_progress" | "completed" | "abandoned" | string;

export interface InterviewTemplate {
  id: string;
  title: string;
  description: string;
  interview_type: InterviewType;
  domain: string;
  difficulty: Difficulty;
  question_count: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Answer {
  id: string;
  question_text: string;
  order: number;
  answer_text: string;
  answer_audio: string | null;
  answer_video: string | null;
  response_time_seconds: number | null;
  answered_at: string | null;
}

export interface InterviewSessionListItem {
  id: string;
  mode: "scripted" | "realtime" | string;
  interview_type: InterviewType;
  domain: string;
  difficulty: Difficulty;
  status: SessionStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface InterviewSessionDetail extends InterviewSessionListItem {
  video_recording: string | null;
  audio_recording: string | null;
  answers: Answer[];
}

export interface ConversationTurn {
  id: string;
  speaker: "agent" | "candidate" | string;
  turn_type: string;
  text: string;
  order: number;
  started_at_ms: number | null;
  ended_at_ms: number | null;
  was_interrupted: boolean;
  created_at: string;
}

export interface RealtimeSessionDetail {
  id: string;
  mode: string;
  interview_type: InterviewType;
  domain: string;
  difficulty: Difficulty;
  status: SessionStatus;
  call_id: string | null;
  call_join_url: string | null;
  interrupt_count: number;
  seed_topics_ready: boolean;
  seed_topics_count: number;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  turns: ConversationTurn[];
  created_at: string;
}

export interface Transcript {
  id: string;
  speaker: "assistant" | "candidate" | string;
  text: string;
  sequence_number: number;
  timestamp: string | null;
  is_followup: boolean;
  latency_ms: number | null;
  confidence: number | null;
  created_at: string;
}

export interface ThreadEvaluation {
  id: string;
  seed_topic: string;
  seed_topic_text: string;
  depth_under_pressure: number;
  conceptual_accuracy: number;
  specificity: number;
  recovery: number;
  overall_score: number;
  verdict: string;
  red_flags: string[];
  strong_signals: string[];
  suggested_followups: string[];
  requires_human_review: boolean;
  human_review_reason: string | null;
  turn_count: number;
  candidate_turn_count: number;
  model_used: string;
  created_at: string;
}

export type HumanVerdict = "strong_hire" | "hire" | "no_hire" | "strong_no_hire" | string;

export interface InterviewBrief {
  id: string;
  overall_signal: string;
  summary: string;
  performs_under_pressure: boolean | null;
  specificity_consistent: boolean | null;
  self_contradictions_detected: boolean | null;
  contradiction_detail: string | null;
  red_flags: string[];
  strong_signals: string[];
  suggested_followup_questions: string[];
  requires_human_review: boolean;
  human_verdict: HumanVerdict | null;
  human_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  thread_evaluations: ThreadEvaluation[];
  model_used: string;
  created_at: string;
  updated_at: string;
}

// ---- Assessment -------------------------------------------------------------------

export interface SpeechAnalysis {
  id: string;
  status: string;
  transcript: string | null;
  transcription_confidence: number | null;
  grammar_score: number | null;
  filler_word_count: number | null;
  filler_words: Record<string, number> | null;
  speaking_pace_wpm: number | null;
  clarity_score: number | null;
  completeness_score: number | null;
  dominant_emotion: string | null;
  emotion_breakdown: Record<string, number> | null;
  confidence_score: number | null;
  eye_contact_percentage: number | null;
  attention_score: number | null;
  engagement_score: number | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinalScore {
  id: string;
  communication: number;
  confidence: number;
  technical_relevance: number;
  professionalism: number;
  overall: number;
  rating: string;
  breakdown: Record<string, unknown>;
  created_at: string;
}

export interface SessionFeedback {
  id: string;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  practice_recommendations: string[];
  learning_resources: string[];
  created_at: string;
}

// ---- Analytics --------------------------------------------------------------------

export interface PerformanceSummary {
  average_overall: number | null;
  average_communication: number | null;
  average_confidence: number | null;
  average_technical: number | null;
  average_professionalism: number | null;
  best_score: number | null;
  total_sessions: number;
}

export interface ScoreTrendPoint {
  session_id: string;
  overall_score: number;
  rating: string;
  interview_type: string;
  date: string;
}

export interface CandidateDashboard {
  summary: PerformanceSummary;
  trend: ScoreTrendPoint[];
  weak_areas: string[];
}

export interface CandidateRanking {
  candidate_id: string;
  email: string;
  name: string;
  average_score: number;
  sessions_completed: number;
}

export interface PlatformOverview {
  total_candidates: number;
  total_sessions: number;
  completed_sessions: number;
  average_overall_score: number;
  sessions_by_type: { interview_type: string; count: number }[];
}

export interface RecruiterDashboard {
  platform_overview: PlatformOverview;
  top_candidates: CandidateRanking[];
}

// ---- Notifications ------------------------------------------------------------------

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---- Invitations ------------------------------------------------------------------

export type InvitationStatus = "pending" | "accepted" | "expired";

export interface InterviewInvitation {
  id: string;
  candidate_email: string;
  candidate_name: string | null;
  template: InterviewTemplate | null;
  message: string;
  status: InvitationStatus;
  session_id: string | null;
  session_status: string | null;
  has_result: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReceivedInvitation {
  id: string;
  recruiter_name: string;
  template: InterviewTemplate | null;
  message: string;
  status: InvitationStatus;
  session_id: string | null;
  created_at: string;
}

export interface RecruiterHistoryItem {
  candidate_id: string | null;
  invitation_id: string;
  candidate_email: string;
  candidate_name: string | null;
  session_id: string;
  interview_type: string;
  domain: string;
  difficulty: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  has_brief: boolean;
  created_at: string;
}