import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Candidate Profile (Single User Role)
  const [candidate, setCandidate] = useState({
    id: 1,
    name: '',
    email: '',
    targetRole: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    isLoggedIn: true
  });

  // Step 4 & 5: Uploaded Resume Data (Pure information extraction, NO ATS score)
  const [resumeData, setResumeData] = useState({
    filename: '',
    name: '',
    targetRole: '',
    skills: [],
    projects: [],
    experience: '',
    education: '',
    certifications: []
  });

  // Step 4 & 6: Job Description Data
  const [jdData, setJdData] = useState({
    title: '',
    company: '',
    rawText: '',
    skills: [],
    requiredSkills: [],
    responsibilities: [],
    experienceLevel: '',
    technicalTopics: [],
    behavioralTopics: []
  });

  // Step 7: Generated AI Questions
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [interviewDuration, setInterviewDuration] = useState('15 Mins (8 Qs)');

  // Step 8: Pre-Interview Setup Checks
  const [setupChecks, setSetupChecks] = useState({
    cameraDetected: true,
    microphoneWorking: true,
    faceCaptured: false,
    faceDataUrl: null,
    environmentStatus: {
      singleFace: true,
      goodLighting: true,
      internetOk: true
    },
    instructionsAccepted: false
  });

  // Step 11 & 12: Final Evaluation Report Details
  const [finalReport, setFinalReport] = useState({
    id: '',
    candidateName: 'Candidate',
    targetRole: 'Software Engineer',
    company: 'Target Company',
    overallScorePct: 0,
    performanceLevel: 'Pending',
    technicalSkills: {
      'System Design': '0/10',
      'Coding Accuracy': '0/10',
      'Security & API': '0/10'
    },
    behavioralSkills: {
      Leadership: '0/10',
      Communication: '0/10',
      Confidence: '0/10'
    },
    resumeValidation: [],
    jdCoverage: [],
    strengths: [],
    areasForImprovement: [],
    questionPerformance: [],
    aiRecommendations: []
  });

  // Step 13: Interview History List with LocalStorage + Server sync
  const [interviewHistory, setInterviewHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_interview_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/interview/sessions');
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map(item => ({
            id: item.id,
            role: item.title || 'Software Engineer',
            date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            scorePct: Math.round(item.score_pct || 82),
            techScore: Math.round((item.score_pct || 82) + 1),
            behavioralScore: Math.round((item.score_pct || 82) - 1),
            status: 'Completed',
            company: 'Target Enterprise',
            techStack: ['Python', 'React', 'SQL', 'Node.js']
          }));

          setInterviewHistory(prev => {
            // Merge server history with existing local items, preserving unique IDs
            const serverIds = new Set(formatted.map(f => String(f.id)));
            const localOnly = prev.filter(p => !serverIds.has(String(p.id)));
            const merged = [...formatted, ...localOnly];
            try {
              localStorage.setItem('smarthire_interview_history', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn("Could not load interview history from server:", err);
      }
    };
    fetchHistory();
  }, []);

  // Assessment History List
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [assessmentResult, setAssessmentResult] = useState(null);

  const addCompletedInterview = (sessionId, roleTitle, companyName, overallScore) => {
    const newEntry = {
      id: sessionId || `hist-${Date.now()}`,
      role: roleTitle || 'Software Engineer',
      date: new Date().toISOString().split('T')[0],
      scorePct: Math.round(overallScore || 82),
      techScore: Math.round((overallScore || 82) + 2),
      behavioralScore: Math.round((overallScore || 82) - 2),
      status: 'Completed',
      company: companyName || 'Target Enterprise',
      techStack: ['Python', 'React', 'SQL', 'Node.js']
    };
    setInterviewHistory((prev) => {
      const updated = [newEntry, ...prev.filter(item => String(item.id) !== String(newEntry.id))];
      try {
        localStorage.setItem('smarthire_interview_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const addCompletedAssessment = (title, scorePct) => {
    const newEntry = {
      id: `assess-${Date.now()}`,
      title: title || 'General Skill Assessment',
      date: new Date().toISOString().split('T')[0],
      scorePct: Math.round(scorePct || 90),
      questionsCount: 5,
      status: 'Completed'
    };
    setAssessmentHistory((prev) => [newEntry, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      candidate, setCandidate,
      user: candidate, // Alias for backward compatibility
      resumeData, setResumeData,
      jdData, setJdData,
      generatedQuestions, setGeneratedQuestions,
      setupChecks, setSetupChecks,
      finalReport, setFinalReport,
      interviewHistory, setInterviewHistory,
      addCompletedInterview,
      assessmentHistory, setAssessmentHistory,
      assessmentResult, setAssessmentResult,
      addCompletedAssessment,
      interviewDuration, setInterviewDuration
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
