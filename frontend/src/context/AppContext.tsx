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

interface AppContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  roleMode: 'candidate' | 'recruiter';
  setRoleMode: React.Dispatch<React.SetStateAction<'candidate' | 'recruiter'>>;
  reports: EvaluationReport[];
  addReport: (report: EvaluationReport) => void;
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
  loginAsUser: (name: string, email: string, role?: 'candidate' | 'recruiter' | 'admin') => void;
  loginAsDemoCandidate: () => void;
  loginAsDemoRecruiter: () => void;
  loginAsDemoAdmin: () => void;
  logout: () => void;
  parseAndUploadResume: (file: File) => Promise<ParsedResume>;
  resetInterviewSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [roleMode, setRoleMode] = useState<'candidate' | 'recruiter'>('candidate');
  const [reports, setReports] = useState<EvaluationReport[]>(MOCK_PAST_REPORTS);
  const [jobCampaigns, setJobCampaigns] = useState<JobCampaign[]>(SAMPLE_JOB_CAMPAIGNS);
  const [candidateApplications, setCandidateApplications] = useState<CandidateApplication[]>(() => {
    return MOCK_PAST_REPORTS.map(r => createCandidateApplicationFromReport(r));
  });
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

  // Load persisted logged-in user & reports on client mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('intervio_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserState(parsed);
        if (parsed.role === 'recruiter') {
          setRoleMode('recruiter');
        }
      }

      const savedReports = localStorage.getItem('intervio_reports');
      if (savedReports) {
        const parsedReports: EvaluationReport[] = JSON.parse(savedReports);
        if (Array.isArray(parsedReports) && parsedReports.length > 0) {
          setReports(parsedReports);
          setCandidateApplications(parsedReports.map(r => createCandidateApplicationFromReport(r)));
        }
      }
    } catch (e) {
      console.error('Error loading persisted session or reports:', e);
    }
  }, []);

  const setUser: React.Dispatch<React.SetStateAction<UserProfile | null>> = (action) => {
    setUserState((prev) => {
      const nextUser = typeof action === 'function' ? action(prev) : action;
      try {
        if (nextUser) {
          localStorage.setItem('intervio_user', JSON.stringify(nextUser));
        } else {
          localStorage.removeItem('intervio_user');
        }
      } catch (e) {
        console.error('Error saving user session:', e);
      }
      return nextUser;
    });
  };

  const loginAsUser = (name: string, email: string, role: 'candidate' | 'recruiter' | 'admin' = 'candidate') => {
    const formattedName = name.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    const expLevel: ExperienceLevel = '3-5 Years';

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: formattedName,
      email: email.toLowerCase(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=059669&color=fff`,
      role: role,
      companyName: role === 'recruiter' ? 'Enterprise Technologies' : 'Personal Candidate Profile',
      targetRole: role === 'recruiter' ? 'Talent Acquisition Manager' : 'Software Engineer',
      experienceLevel: expLevel,
      completedInterviewsCount: 0,
      averageScore: 0,
      readinessLevel: 'Active Profile',
      resumes: []
    };

    setUser(newUser);
    setRoleMode(role === 'recruiter' ? 'recruiter' : 'candidate');
    setIsAuthModalOpen(false);
  };

  const loginAsDemoCandidate = () => {
    loginAsUser('Candidate User', 'candidate@intervio.ai', 'candidate');
  };

  const loginAsDemoRecruiter = () => {
    loginAsUser('Talent Recruiter', 'recruiter@enterprise-hiring.com', 'recruiter');
  };

  const loginAsDemoAdmin = () => {
    loginAsUser('Platform Administrator', 'admin@intervio.ai', 'admin');
  };

  const logout = () => {
    setUser(null);
  };

  const addReport = (newReport: EvaluationReport) => {
    setReports((prev) => {
      const updated = [newReport, ...prev];
      try {
        localStorage.setItem('intervio_reports', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving reports:', e);
      }
      return updated;
    });

    const newApplication = createCandidateApplicationFromReport(newReport);
    setCandidateApplications((prev) => [newApplication, ...prev]);

    if (user) {
      const updatedCount = user.completedInterviewsCount + 1;
      const totalScores = reports.reduce((acc, r) => acc + r.overallScore, 0) + newReport.overallScore;
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
    }
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
        roleMode,
        setRoleMode,
        reports,
        addReport,
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
