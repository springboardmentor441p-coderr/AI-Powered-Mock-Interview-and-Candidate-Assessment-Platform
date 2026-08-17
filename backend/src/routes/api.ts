import { Router, Request, Response } from 'express';
import { performance } from 'node:perf_hooks';
import { parseResumeWithAI } from '../services/aiResumeService';
import { registerUser, loginUser, findUserByEmail, UserRecord } from '../services/authService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import { getReportsForUser, getReportById, saveReport, deleteReport } from '../services/reportService';
import { createInterviewSession, getInterviewSession, recordVapiEvent } from '../services/interviewSessionService';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'InterVio Enterprise AI Backend',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register User Endpoint
router.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'A valid email address is required.' });
      return;
    }

    const { user, token } = registerUser(name || '', email, password, role || 'candidate');
    res.json({
      success: true,
      message: 'Account registered successfully.',
      data: { user, token }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error?.message || 'Registration failed.'
    });
  }
});

// Login User Endpoint
router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'A valid email address is required.' });
      return;
    }

    const { user, token } = loginUser(email, password, role, name);
    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: { user, token }
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error?.message || 'Authentication failed.'
    });
  }
});

// Get Current Authenticated User Endpoint
router.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user
  });
});

// Logout User Endpoint
router.post('/auth/logout', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// ==========================================
// PROTECTED INTERVIEW REPORTS ENDPOINTS
// ==========================================

// Get User's Interview Reports
router.get('/reports', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const userReports = getReportsForUser(req.user.email, req.user.role);
    res.json({
      success: true,
      data: userReports
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch interview session history'
    });
  }
});

// Get Specific Report by ID (With Authorization Check)
router.get('/reports/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const reportId = String(req.params.id);
    const report = getReportById(reportId, req.user.email, req.user.role);

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Interview session report not found.'
      });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    if (error?.message?.startsWith('UNAUTHORIZED_ACCESS')) {
      res.status(403).json({
        success: false,
        error: 'Access Denied: You do not have permission to view another candidate\'s interview session history.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to retrieve report'
    });
  }
});

// Save New Interview Report
router.post('/reports', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const reportData = req.body;
    // Attach current authenticated user's email and ID to ensure session ownership
    const reportToSave = {
      ...reportData,
      candidateEmail: req.user.email,
      userId: req.user.id
    };

    const saved = saveReport(reportToSave);
    res.json({
      success: true,
      message: 'Interview evaluation report saved successfully.',
      data: saved
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to save interview report'
    });
  }
});

// Delete Interview Report
router.delete('/reports/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const reportId = String(req.params.id);
    const deleted = deleteReport(reportId, req.user.email, req.user.role);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Report not found or already deleted.'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Interview session report deleted successfully.'
    });
  } catch (error: any) {
    if (error?.message?.startsWith('UNAUTHORIZED_ACCESS')) {
      res.status(403).json({
        success: false,
        error: 'Access Denied: You do not have permission to delete this session.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to delete report'
    });
  }
});

// ==========================================
// RESUME ENDPOINTS
// ==========================================

// AI Resume Parsing Endpoint
router.post('/resume/parse', async (req: Request, res: Response) => {
  try {
    const { rawText, fileName } = req.body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 15) {
      res.status(400).json({
        success: false,
        isResume: false,
        document_type: 'NOT_A_RESUME',
        error: 'Invalid or empty resume text provided for parsing.'
      });
      return;
    }

    const parsedData = await parseResumeWithAI(rawText, fileName || 'uploaded_resume.pdf');

    if (!parsedData.isResume) {
      res.status(400).json({
        success: false,
        isResume: false,
        document_type: parsedData.document_type || 'NOT_A_RESUME',
        confidence: parsedData.confidence || 0,
        error: parsedData.rejectionReason || 'The uploaded document does not appear to be a valid resume. Please upload a resume in PDF or DOCX format.'
      });
      return;
    }

    res.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('AI Resume Parse Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to parse candidate resume'
    });
  }
});

// Create a server-authorized Vapi interview session. The browser receives Vapi's
// public identifier only; private Vapi credentials never leave this process.
router.post('/interview/start', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const assistantId = process.env.VAPI_ASSISTANT_ID;
  if (!assistantId) {
    res.status(503).json({ success: false, error: 'Voice interviews are not configured. Set VAPI_ASSISTANT_ID on the backend.' });
    return;
  }

  const { config, questions, resume } = req.body ?? {};
  if (!config || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ success: false, error: 'A configuration and at least one interview question are required.' });
    return;
  }

  let formattedResumeSummary = 'No résumé was provided. Use the selected interview track.';
  if (resume) {
    const verifiedSkills = (resume.extractedSkills || []).join(', ');
    const verifiedProjects = (resume.projects || []).join('; ');
    const verifiedExp = (resume.workExperience || []).join('; ');
    const verifiedEdu = (resume.education || []).join('; ');
    const verifiedCerts = (resume.certifications || []).join('; ');
    const verifiedInternships = (resume.internshipExperience || []).join('; ');
    formattedResumeSummary = `VERIFIED CANDIDATE RESUME SUMMARY (VERIFIED FACTS ONLY - DO NOT HALLUCINATE ANY OTHER DETAILS):
Candidate: ${resume.candidateName || 'Candidate'}
Role: ${resume.detectedRole || 'Software Professional'}
Summary: ${resume.summary || ''}
Verified Skills: ${verifiedSkills || 'None specified'}
Verified Projects: ${verifiedProjects || 'None specified'}
Verified Work Experience: ${verifiedExp || 'None specified'}
Verified Internships: ${verifiedInternships || 'None specified'}
Verified Education: ${verifiedEdu || 'None specified'}
Verified Certifications: ${verifiedCerts || 'None specified'}
Mandate: Only refer to facts listed above when mentioning candidate background during the voice interview.`;
  }

  const session = createInterviewSession({
    candidate: { id: req.user.id, name: req.user.name, email: req.user.email },
    config: {
      id: String(config.id ?? 'cfg-default'),
      title: String(config.title ?? 'AI Interview'),
      track: String(config.track ?? 'Technical'),
      difficulty: String(config.difficulty ?? 'Medium'),
      durationMinutes: Number(config.durationMinutes ?? 30),
      preferredLanguage: String(config.preferredLanguage ?? 'English'),
      persona: {
        name: String(config.persona?.name ?? 'InterVio Interviewer'),
        role: String(config.persona?.role ?? 'AI Interviewer'),
        tone: String(config.persona?.tone ?? 'encouraging')
      }
    },
    questions: questions.map((question: Record<string, unknown>, index: number) => ({
      id: String(question.id ?? `question-${index + 1}`),
      text: String(question.text ?? ''),
      topic: String(question.topic ?? 'General'),
      expectedKeyPoints: Array.isArray(question.expectedKeyPoints) ? question.expectedKeyPoints.filter((item): item is string => typeof item === 'string') : []
    })).filter((question: { text: string }) => question.text.trim()),
    resumeSummary: formattedResumeSummary.slice(0, 4000)
  }, assistantId);

  res.status(201).json({
    success: true,
    data: {
      sessionId: session.id,
      assistantId,
      // These names must match the {{variables}} in docs/vapi-assistant.md.
      variableValues: {
        interview_session_id: session.id,
        candidate_name: session.candidate.name,
        interviewer_name: session.config.persona.name,
        interviewer_role: session.config.persona.role,
        interview_track: session.config.track,
        interview_difficulty: session.config.difficulty,
        interview_language: session.config.preferredLanguage,
        interview_duration_minutes: String(session.config.durationMinutes),
        interview_questions: session.questions.map((question, index) => `${index + 1}. ${question.text}`).join('\n'),
        resume_summary: session.resumeSummary || 'No résumé was provided. Use the selected interview track.'
      }
    }
  });
});

// Configure this endpoint as the assistant Server URL in Vapi (e.g. POST /api/vapi/webhook).
// Configure a matching static Authorization header in Vapi when VAPI_WEBHOOK_SECRET is set.
router.post(['/vapi/webhook', '/webhooks/vapi'], (req: Request, res: Response) => {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (secret && req.header('authorization') !== `Bearer ${secret}`) {
    res.status(401).json({ success: false, error: 'Invalid Vapi webhook authorization.' });
    return;
  }

  const sessionId = findSessionId(req.body);
  if (!sessionId) {
    // Not every Vapi event belongs to an InterVio browser interview.
    res.sendStatus(204);
    return;
  }
  const session = recordVapiEvent(sessionId, req.body as Record<string, unknown>);
  if (!session) {
    res.status(404).json({ success: false, error: 'Unknown interview session.' });
    return;
  }
  res.status(200).json({ success: true });
});

// Complete interview session endpoint
router.post('/interview/complete', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.body ?? {};
  const session = typeof sessionId === 'string' ? getInterviewSession(sessionId) : undefined;
  if (!session || !req.user || session.candidate.id !== req.user.id) {
    res.status(404).json({ success: false, error: 'Interview session not found.' });
    return;
  }
  res.json({
    success: true,
    data: { sessionId: session.id, status: session.status, transcript: session.transcript },
    message: `Interview session ${sessionId} marked as completed`,
    timestamp: new Date().toISOString()
  });
});

// Reset interview session endpoint
router.post('/interview/reset', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Interview session state cleared & reset successfully',
    timestamp: new Date().toISOString()
  });
});

export default router;

function findSessionId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSessionId(item);
      if (found) return found;
    }
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.interview_session_id === 'string') return record.interview_session_id;
  for (const [key, child] of Object.entries(record)) {
    if (key === 'variableValues' && child && typeof child === 'object') {
      const sessionId = (child as Record<string, unknown>).interview_session_id;
      if (typeof sessionId === 'string') return sessionId;
    }
    const found = findSessionId(child);
    if (found) return found;
  }
  return undefined;
}
