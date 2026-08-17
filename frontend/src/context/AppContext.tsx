'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  EvaluationReport, 
  InterviewConfig, 
  ParsedResume,
  JobCampaign,
  CandidateApplication,
  ExperienceLevel
} from '../types';
import { 
  RECRUITER_USER, 
  MOCK_PAST_REPORTS, 
  INTERVIEWER_PERSONAS,
  SAMPLE_JOB_CAMPAIGNS,
  SAMPLE_CANDIDATE_APPLICATIONS
} from '../data/mockData';
import { createCandidateApplicationFromReport } from '../utils/evaluationEngine';
import { parseResumeFile } from '../utils/resumeParser';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Safely sets an item in localStorage without throwing QuotaExceededError.
 * If storage quota is exceeded, performs non-destructive pruning/cleanup.
 */
const safeSetLocalStorage = (key: string, value: unknown): boolean => {
  if (typeof window === 'undefined') return false;

  const serialize = (val: unknown) => (typeof val === 'string' ? val : JSON.stringify(val));

  try {
    localStorage.setItem(key, serialize(value));
    return true;
  } catch (e: unknown) {
    const err = e as { name?: string; code?: number; message?: string };
    console.warn(`localStorage.setItem warning for key "${key}":`, err?.message || err);

    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (!isQuotaError) {
      return false;
    }

    // Attempt 1: Clear old/stale intervio keys for other sessions if possible
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey !== key && storageKey !== 'intervio_jwt' && storageKey !== 'intervio_user') {
          keysToRemove.push(storageKey);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      localStorage.setItem(key, serialize(value));
      return true;
    } catch {
      // Continue to next recovery attempt
    }

    // Attempt 2: If value is an array (e.g. reports array), prune recent items
    if (Array.isArray(value)) {
      const pruneLimits = [15, 10, 5, 2, 1];
      for (const limit of pruneLimits) {
        if (value.length <= limit) continue;
        try {
          const trimmed = value.slice(0, limit);
          localStorage.setItem(key, serialize(trimmed));
          return true;
        } catch {
          // Keep trying smaller limits
        }
      }

      // Attempt 3: Ultra-light reports fallback with stripped responses
      try {
        const ultraLight = value.slice(0, 5).map((item: any) => {
          if (item && typeof item === 'object') {
            return {
              ...item,
              answers: Array.isArray(item.answers)
                ? item.answers.map((ans: any) => ({
                    questionId: ans.questionId,
                    questionText: ans.questionText,
                    topic: ans.topic,
                    score: ans.score,
                    candidateResponse: (ans.candidateResponse || '').slice(0, 100),
                    audioDurationSeconds: ans.audioDurationSeconds
                  }))
                : [],
              proctoringEvents: (item.proctoringEvents || []).slice(0, 3)
            };
          }
          return item;
        });
        localStorage.setItem(key, serialize(ultraLight));
        return true;
      } catch {
        // Suppress final failure gracefully
      }
    } else if (value && typeof value === 'object') {
      // Attempt 4: If single object (e.g. UserProfile), trim embedded resumes
      try {
        const lightObject = {
          ...(value as Record<string, unknown>),
          resumes: []
        };
        localStorage.setItem(key, serialize(lightObject));
        return true;
      } catch {
        // Suppress final failure gracefully
      }
    }

    return false;
  }
};

interface AppContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  token: string | null;
  isAuthLoading: boolean;
  roleMode: 'candidate' | 'recruiter';
  setRoleMode: React.Dispatch<React.SetStateAction<'candidate' | 'recruiter'>>;
  reports: EvaluationReport[];
  addReport: (report: EvaluationReport) => void;
  deleteReport: (reportId: string) => Promise<boolean>;
  jobCampaigns: JobCampaign[];
  addJobCampaign: (campaign: JobCampaign) => void;
  candidateApplications: CandidateApplication[];
  selectedForComparison: CandidateApplication[];
  toggleSelectForComparison: (app: CandidateApplication) => void;
  clearComparison: () => void;
  activeConfig: InterviewConfig | null;
  setActiveConfig: React.Dispatch<React.SetStateAction<InterviewConfig | null>>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authMode: 'login' | 'signup' | 'forgot';
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'signup' | 'forgot'>>;
  activeResume: ParsedResume | null;
  setActiveResume: React.Dispatch<React.SetStateAction<ParsedResume | null>>;
  proctoringEnabled: boolean;
  setProctoringEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  loginAsUser: (name: string, email: string, role?: 'candidate' | 'recruiter' | 'admin', password?: string) => Promise<void>;
  loginAsDemoCandidate: () => Promise<void>;
  loginAsDemoRecruiter: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  logout: () => void;
  parseAndUploadResume: (file: File) => Promise<ParsedResume>;
  resetInterviewSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [roleMode, setRoleMode] = useState<'candidate' | 'recruiter'>('candidate');
  
  // Reports scoped to authenticated user (initially empty)
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [jobCampaigns, setJobCampaigns] = useState<JobCampaign[]>(SAMPLE_JOB_CAMPAIGNS);
  const [candidateApplications, setCandidateApplications] = useState<CandidateApplication[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<CandidateApplication[]>([]);

  const [activeConfig, setActiveConfig] = useState<InterviewConfig | null>({
    id: 'cfg-default',
    title: 'Technical AI Interview Screening',
    track: 'Technical',
    experienceLevel: '3-5 Years',
    difficulty: 'Hard',
    durationMinutes: 30,
    persona: INTERVIEWER_PERSONAS[0],
    preferredLanguage: 'English',
    enableProctoring: true
  });
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [activeResume, setActiveResume] = useState<ParsedResume | null>(null);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);

  // Helper to load user-scoped reports from API or localStorage fallback
  const fetchUserReports = async (userEmail: string, jwtToken?: string) => {
    try {
      const activeJwt = jwtToken || localStorage.getItem('intervio_jwt');
      if (activeJwt) {
        const res = await fetch(`${API_BASE_URL}/reports`, {
          headers: {
            'Authorization': `Bearer ${activeJwt}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setReports(json.data);
            setCandidateApplications(json.data.map((r: EvaluationReport) => createCandidateApplicationFromReport(r)));
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Backend API unavailable, falling back to scoped local storage:', e);
    }

    // Local storage fallback scoped by user email
    try {
      const savedReports = localStorage.getItem(`intervio_reports_${userEmail.toLowerCase()}`);
      if (savedReports) {
        const parsed: EvaluationReport[] = JSON.parse(savedReports);
        if (Array.isArray(parsed)) {
          const userSpecific = parsed.filter(r => r.candidateEmail?.toLowerCase() === userEmail.toLowerCase());
          setReports(userSpecific);
          setCandidateApplications(userSpecific.map(r => createCandidateApplicationFromReport(r)));
          return;
        }
      }

      // Seed Alex Chen demo user with initial mock report
      if (userEmail.toLowerCase() === 'alex.chen@devmail.io') {
        setReports(MOCK_PAST_REPORTS);
        setCandidateApplications(MOCK_PAST_REPORTS.map(r => createCandidateApplicationFromReport(r)));
        safeSetLocalStorage(`intervio_reports_${userEmail.toLowerCase()}`, MOCK_PAST_REPORTS);
      } else {
        setReports([]);
        setCandidateApplications([]);
      }
    } catch (e) {
      console.error('Error fetching user reports:', e);
    }
  };

  // Load persisted logged-in user & verify token on client mount.
  useEffect(() => {
    const initializeAuth = async () => {
      setIsAuthLoading(true);
      try {
        const savedToken = localStorage.getItem('intervio_jwt');
        const savedUserStr = localStorage.getItem('intervio_user');

        if (!savedToken || !savedUserStr) {
          setUserState(null);
          setToken(null);
          setReports([]);
          setCandidateApplications([]);
          setIsAuthLoading(false);
          return;
        }

        let verifiedUser: UserProfile | null = null;

        try {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });

          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              verifiedUser = json.data;
            }
          }
        } catch (e) {
          console.warn('Backend API connection failed during auth verification, restoring cached session:', e);
        }

        if (!verifiedUser && savedUserStr) {
          try {
            verifiedUser = JSON.parse(savedUserStr);
          } catch (e) {
            console.error('Failed parsing saved user payload:', e);
          }
        }

        if (verifiedUser) {
          setUserState(verifiedUser);
          setToken(savedToken);
          if (verifiedUser.role === 'recruiter') setRoleMode('recruiter');
          await fetchUserReports(verifiedUser.email, savedToken);
        } else {
          localStorage.removeItem('intervio_user');
          localStorage.removeItem('intervio_jwt');
          setUserState(null);
          setToken(null);
          setReports([]);
          setCandidateApplications([]);
        }
      } catch (e) {
        console.error('Error initializing session:', e);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const setUser: React.Dispatch<React.SetStateAction<UserProfile | null>> = (action) => {
    setUserState((prev) => {
      const nextUser = typeof action === 'function' ? action(prev) : action;
      if (nextUser) {
        safeSetLocalStorage('intervio_user', nextUser);
      } else {
        try {
          localStorage.removeItem('intervio_user');
          localStorage.removeItem('intervio_jwt');
        } catch (e) {
          console.warn('Error clearing user session:', e);
        }
      }
      return nextUser;
    });
  };

  const loginAsUser = async (
    name: string, 
    email: string, 
    role: 'candidate' | 'recruiter' | 'admin' = 'candidate',
    password?: string
  ) => {
    const formattedEmail = email.trim().toLowerCase();
    const formattedName = name.trim() || formattedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    const effectivePassword = password || (
      formattedEmail === 'alex.chen@devmail.io' ? 'password123' :
      formattedEmail === 'recruiter@enterprise-hiring.com' ? 'recruiter123' :
      formattedEmail === 'admin@intervio.ai' ? 'admin123' : 'password123'
    );

    let authenticatedUser: UserProfile | null = null;
    let jwtToken: string | null = null;

    // 1. Try backend server login
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedEmail, name: formattedName, role, password: effectivePassword })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user && json.data?.token) {
          authenticatedUser = json.data.user;
          jwtToken = json.data.token;
        }
      } else {
        // Try auto-registration if login failed due to non-existent account
        const regRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formattedEmail, name: formattedName, role, password: effectivePassword })
        });

        if (regRes.ok) {
          const regJson = await regRes.json();
          if (regJson.success && regJson.data?.user && regJson.data?.token) {
            authenticatedUser = regJson.data.user;
            jwtToken = regJson.data.token;
          }
        }
      }
    } catch (networkErr) {
      console.warn('Backend server network request failed, falling back to local offline session:', networkErr);
    }

    // 2. Fallback to client-side session if backend is unavailable or offline
    if (!authenticatedUser || !jwtToken) {
      authenticatedUser = {
        id: `usr_${Date.now()}`,
        name: formattedName,
        email: formattedEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=${role === 'recruiter' ? '059669' : '0f172a'}&color=fff`,
        role: role,
        companyName: role === 'recruiter' ? 'Enterprise Technologies' : 'Personal Candidate Profile',
        targetRole: role === 'recruiter' ? 'Talent Acquisition Manager' : 'Software Engineer',
        experienceLevel: '3-5 Years',
        resumes: [],
        completedInterviewsCount: formattedEmail === 'alex.chen@devmail.io' ? 1 : 0,
        averageScore: formattedEmail === 'alex.chen@devmail.io' ? 89 : 0,
        readinessLevel: formattedEmail === 'alex.chen@devmail.io' ? 'Senior Engineer Ready' : 'Active Profile'
      };
      jwtToken = `mock_jwt_${Date.now()}_${typeof window !== 'undefined' ? btoa(formattedEmail) : 'token'}`;
    }

    setToken(jwtToken);
    safeSetLocalStorage('intervio_jwt', jwtToken);
    setUser(authenticatedUser);
    setRoleMode(role === 'recruiter' ? 'recruiter' : 'candidate');
    setIsAuthModalOpen(false);

    if (authenticatedUser) {
      await fetchUserReports(authenticatedUser.email, jwtToken);
    }
  };

  const loginAsDemoCandidate = async () => {
    await loginAsUser('Alex Chen', 'alex.chen@devmail.io', 'candidate', 'password123');
  };

  const loginAsDemoRecruiter = async () => {
    await loginAsUser('Sarah Jenkins', 'recruiter@enterprise-hiring.com', 'recruiter', 'recruiter123');
  };

  const loginAsDemoAdmin = async () => {
    await loginAsUser('Platform Administrator', 'admin@intervio.ai', 'admin', 'admin123');
  };

  const logout = () => {
    try {
      const activeJwt = token || localStorage.getItem('intervio_jwt');
      if (activeJwt) {
        fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${activeJwt}` }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Error during logout API call:', e);
    }

    setUser(null);
    setToken(null);
    setReports([]);
    setCandidateApplications([]);
    localStorage.removeItem('intervio_user');
    localStorage.removeItem('intervio_jwt');
  };

  const addReport = async (newReport: EvaluationReport) => {
    if (!user) return;

    const scopedReport: EvaluationReport = {
      ...newReport,
      candidateEmail: user.email,
      candidateName: user.name,
      userId: user.id
    };

    // Save report to backend API
    try {
      const activeJwt = token || localStorage.getItem('intervio_jwt');
      if (activeJwt) {
        await fetch(`${API_BASE_URL}/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeJwt}`
          },
          body: JSON.stringify(scopedReport)
        });
      }
    } catch (e) {
      console.warn('Error saving report to backend API:', e);
    }

    // Update local state scoped to user
    setReports((prev) => {
      const updated = [scopedReport, ...prev];
      safeSetLocalStorage(`intervio_reports_${user.email.toLowerCase()}`, updated);
      return updated;
    });

    const newApplication = createCandidateApplicationFromReport(scopedReport);
    setCandidateApplications((prev) => [newApplication, ...prev]);

    // Update user stats
    const updatedCount = (user.completedInterviewsCount || 0) + 1;
    const totalScores = reports.reduce((acc, r) => acc + r.overallScore, 0) + scopedReport.overallScore;
    const newAvg = Math.round(totalScores / updatedCount);
    
    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        completedInterviewsCount: updatedCount,
        averageScore: newAvg,
        readinessLevel: newAvg >= 85 ? 'Senior Level Certified' : newAvg >= 70 ? 'Competent Candidate' : 'Assessment Pending'
      };
    });
  };

  const deleteReport = async (reportId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const activeJwt = token || localStorage.getItem('intervio_jwt');
      if (activeJwt) {
        await fetch(`${API_BASE_URL}/reports/${reportId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${activeJwt}`
          }
        });
      }
    } catch (e) {
      console.warn('Error deleting report via API:', e);
    }

    setReports((prev) => {
      const updated = prev.filter(r => r.id !== reportId);
      safeSetLocalStorage(`intervio_reports_${user.email.toLowerCase()}`, updated);
      return updated;
    });

    setCandidateApplications((prev) => prev.filter(app => app.id !== reportId));
    return true;
  };

  const addJobCampaign = (newCampaign: JobCampaign) => {
    setJobCampaigns((prev) => [newCampaign, ...prev]);
  };

  const toggleSelectForComparison = (app: CandidateApplication) => {
    setSelectedForComparison((prev) => {
      const exists = prev.find((item) => item.id === app.id);
      if (exists) {
        return prev.filter((item) => item.id !== app.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, app];
    });
  };

  const clearComparison = () => {
    setSelectedForComparison([]);
  };

  const parseAndUploadResume = async (file: File): Promise<ParsedResume> => {
    const parsed = await parseResumeFile(file);

    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        resumes: [parsed, ...(prevUser.resumes || [])]
      };
    });

    setActiveResume(parsed);
    return parsed;
  };

  const resetInterviewSession = () => {
    setActiveResume(null);
    try {
      sessionStorage.removeItem('intervio_active_session');
    } catch (e) {
      console.error('Error clearing session:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        token,
        isAuthLoading,
        roleMode,
        setRoleMode,
        reports,
        addReport,
        deleteReport,
        jobCampaigns,
        addJobCampaign,
        candidateApplications,
        selectedForComparison,
        toggleSelectForComparison,
        clearComparison,
        activeConfig,
        setActiveConfig,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        activeResume,
        setActiveResume,
        proctoringEnabled,
        setProctoringEnabled,
        loginAsUser,
        loginAsDemoCandidate,
        loginAsDemoRecruiter,
        loginAsDemoAdmin,
        logout,
        parseAndUploadResume,
        resetInterviewSession
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
