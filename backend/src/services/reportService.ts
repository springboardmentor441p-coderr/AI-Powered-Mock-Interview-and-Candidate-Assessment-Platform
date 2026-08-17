export interface StoredReport {
  id: string;
  config: {
    id: string;
    title: string;
    track: string;
    subCategory?: string;
    experienceLevel: string;
    difficulty: string;
    durationMinutes: number;
    persona: {
      id: string;
      name: string;
      role: string;
      avatar: string;
      description: string;
      accentColor: string;
      voiceGender: 'male' | 'female';
      tone: string;
    };
    preferredLanguage: string;
    enableProctoring: boolean;
  };
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
  strengths: string[];
  weaknesses: string[];
  recommendedImprovements: string[];
  answers: any[];
  proctoringEvents: any[];
  learningResources?: any[];
  videoRecordingAvailable?: boolean;
  totalDurationSeconds?: number;
}

// Initial mock report for Alex Chen
const mockAlexChenReport: StoredReport = {
  id: 'rpt-8821',
  config: {
    id: 'cfg-8821',
    title: 'Senior Full Stack Technical Screening',
    track: 'Technical',
    subCategory: 'Distributed Architecture & State Engines',
    experienceLevel: '3-5 Years',
    difficulty: 'Hard',
    durationMinutes: 30,
    persona: {
      id: 'alex-tech',
      name: 'Alex Vance',
      role: 'Principal Engineer & Tech Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      description: 'Direct, analytical, and probes deeply into code architecture, data structures, and edge-cases.',
      accentColor: '#059669',
      voiceGender: 'male',
      tone: 'analytical'
    },
    preferredLanguage: 'English',
    enableProctoring: true
  },
  createdAt: '2026-08-06T14:30:00Z',
  candidateName: 'Alex Chen',
  candidateEmail: 'alex.chen@devmail.io',
  userId: 'usr-101',
  overallScore: 89,
  readinessRating: 'Senior Engineer Ready',
  categoryScores: {
    technicalKnowledge: 92,
    communicationSkills: 88,
    behavioralSkills: 85,
    bodyLanguage: 90,
    deliveryAndPacing: 87
  },
  strengths: [
    'Deep architectural knowledge of Fiber double-buffering and concurrent priorities.',
    'Articulate explanation of Event Loop microtask vs macrotask execution order.',
    'Clear, confident vocal posture with minimal filler words (under 2 per minute).'
  ],
  weaknesses: [
    'Could elaborate more on edge failure modes in distributed sliding window rate limiters.',
    'Slight pause while calculating database sharding partition keys.'
  ],
  recommendedImprovements: [
    'Review Lua script atomicity patterns in Redis cluster failover scenarios.',
    'Practice 2-minute concise STAR summaries for system outage anecdotes.'
  ],
  answers: [
    {
      questionId: 'q-tech-1',
      questionText: 'How does modern virtual DOM fiber reconciliation optimize state update batching, and how does concurrent rendering prevent UI main thread blockage?',
      topic: 'UI Framework Internals',
      candidateResponse: 'Fiber represents rendering work as a linked list of nodes. During concurrent rendering, priority levels are assigned to updates. If a high priority event like keyboard entry occurs, reconciliation yields the main thread, handles the input, and then resumes work.',
      audioDurationSeconds: 110,
      score: 94,
      technicalAccuracy: 95,
      communicationFluency: 92,
      problemSolvingDepth: 93,
      bodyLanguageConfidence: 94,
      aiFeedback: 'Outstanding response. Excellent technical depth covering double-buffering, time slicing, and main thread yield mechanisms.',
      strengths: ['Precise technical terminology', 'Logical flow from Fiber representation to user experience benefits'],
      areasToImprove: ['Mention compiler optimization hints briefly if time permits'],
      idealAnswerComparison: '95% match with ideal staff engineer explanation.'
    }
  ],
  proctoringEvents: [
    {
      id: 'proc-1',
      timestamp: '00:08:14',
      type: 'TAB_SWITCH',
      severity: 'warning',
      message: 'Browser window lost focus for 3 seconds.'
    }
  ],
  totalDurationSeconds: 1540
};

// In-Memory Report Store
const reportsDatabase: Map<string, StoredReport> = new Map();
reportsDatabase.set(mockAlexChenReport.id, mockAlexChenReport);

export function getReportsForUser(email: string, role?: string): StoredReport[] {
  const normalizedEmail = email.trim().toLowerCase();
  
  // If user is recruiter or admin, they can view candidate reports; otherwise candidate views ONLY their own
  if (role === 'recruiter' || role === 'admin') {
    return Array.from(reportsDatabase.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return Array.from(reportsDatabase.values())
    .filter(r => r.candidateEmail.trim().toLowerCase() === normalizedEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReportById(id: string, requestingUserEmail: string, role?: string): StoredReport | undefined {
  const report = reportsDatabase.get(id);
  if (!report) return undefined;

  // Authorization check: User must own the report OR be a recruiter/admin
  const isOwner = report.candidateEmail.trim().toLowerCase() === requestingUserEmail.trim().toLowerCase();
  const isElevated = role === 'recruiter' || role === 'admin';

  if (!isOwner && !isElevated) {
    throw new Error('UNAUTHORIZED_ACCESS: You do not have permission to view this interview report.');
  }

  return report;
}

export function saveReport(report: StoredReport): StoredReport {
  reportsDatabase.set(report.id, report);
  return report;
}

export function deleteReport(id: string, requestingUserEmail: string, role?: string): boolean {
  const report = reportsDatabase.get(id);
  if (!report) return false;

  const isOwner = report.candidateEmail.trim().toLowerCase() === requestingUserEmail.trim().toLowerCase();
  const isElevated = role === 'recruiter' || role === 'admin';

  if (!isOwner && !isElevated) {
    throw new Error('UNAUTHORIZED_ACCESS: You do not have permission to delete this session.');
  }

  return reportsDatabase.delete(id);
}
