import { ActiveInterviewSession, CompletedInterviewSession, InterviewConfig, InterviewQuestion } from '../../types';

const ACTIVE_SESSION_KEY = 'smarthire_active_interview_session';
const COMPLETED_SESSION_KEY = 'smarthire_completed_interview_session';

export const interviewService = {
  /**
   * Initialize or update an active interview session
   */
  startNewSession(config: InterviewConfig, questions: InterviewQuestion[]): ActiveInterviewSession {
    const interviewId = 'int_' + Date.now();
    const timeLimitSeconds = (config.timeLimitMinutes || 15) * 60;
    const session: ActiveInterviewSession = {
      interviewId,
      config,
      questions,
      answers: {},
      currentIndex: 0,
      startTime: Date.now(),
      timeLimitSeconds,
      timeLeftSeconds: timeLimitSeconds,
    };

    this.saveActiveSession(session);
    return session;
  },

  /**
   * Save active session state to localStorage and sessionStorage
   */
  saveActiveSession(session: ActiveInterviewSession): void {
    try {
      const data = JSON.stringify(session);
      localStorage.setItem(ACTIVE_SESSION_KEY, data);
      sessionStorage.setItem(ACTIVE_SESSION_KEY, data);
    } catch (err) {
      console.warn('Failed to persist active interview session:', err);
    }
  },

  /**
   * Retrieve current active session from localStorage or sessionStorage
   */
  getActiveSession(): ActiveInterviewSession | null {
    try {
      const raw = localStorage.getItem(ACTIVE_SESSION_KEY) || sessionStorage.getItem(ACTIVE_SESSION_KEY);
      if (raw) {
        return JSON.parse(raw) as ActiveInterviewSession;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Clear active session
   */
  clearActiveSession(): void {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
  },

  /**
   * Complete interview session and store in localStorage
   */
  finishInterview(
    session: ActiveInterviewSession,
    status: 'Completed' | 'Time Expired' | 'Terminated Early' = 'Completed'
  ): CompletedInterviewSession {
    const endTime = Date.now();
    const durationSeconds = Math.max(1, Math.round((endTime - session.startTime) / 1000));

    const totalQuestions = session.questions.length;
    let answeredCount = 0;
    session.questions.forEach((q) => {
      if (session.answers[q.id] && session.answers[q.id].trim().length > 0) {
        answeredCount++;
      }
    });

    const unansweredCount = totalQuestions - answeredCount;

    const completedSession: CompletedInterviewSession = {
      id: 'comp_' + Date.now(),
      interviewId: session.interviewId,
      type: session.config.type,
      domain: session.config.targetRole || session.config.type,
      difficulty: session.config.experienceLevel || 'Senior',
      questions: session.questions,
      answers: session.answers,
      speechData: session.speechData,
      config: session.config,
      startTime: new Date(session.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationSeconds,
      completionStatus: status,
      answeredCount,
      unansweredCount,
      totalQuestions,
    };

    try {
      localStorage.setItem(COMPLETED_SESSION_KEY, JSON.stringify(completedSession));
      sessionStorage.setItem(COMPLETED_SESSION_KEY, JSON.stringify(completedSession));
    } catch (err) {
      console.warn('Failed to save completed interview session:', err);
    }

    this.clearActiveSession();
    return completedSession;
  },

  /**
   * Get latest completed interview session
   */
  getCompletedSession(): CompletedInterviewSession | null {
    try {
      const raw = localStorage.getItem(COMPLETED_SESSION_KEY) || sessionStorage.getItem(COMPLETED_SESSION_KEY);
      if (raw) {
        return JSON.parse(raw) as CompletedInterviewSession;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Format seconds to MM:SS
   */
  formatDuration(totalSeconds: number): string {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remainingM = m % 60;
      return `${h}h ${remainingM}m ${s}s`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },
};
