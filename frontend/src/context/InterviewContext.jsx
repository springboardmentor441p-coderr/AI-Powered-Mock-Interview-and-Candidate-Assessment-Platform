import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const InterviewContext = createContext(null);

const STORAGE_KEYS = {
  SESSION: 'smarthire_active_session',
  HISTORY: 'smarthire_interview_history',
  SESSION_ID: 'smarthire_session_id',
  PARSED_RESUME: 'smarthire_parsed_resume',
  JOB_ROLE: 'smarthire_job_role',
  INTERVIEW_TYPE: 'smarthire_interview_type',
  INTERVIEW_DURATION: 'smarthire_interview_duration',
  CURRENT_QUESTION: 'smarthire_current_question',
  FINAL_REPORT: 'smarthire_final_report',
};

function readJson(key, fallback = null) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function readActiveSession() {
  return readJson(STORAGE_KEYS.SESSION, null);
}

export function InterviewProvider({ children }) {
  const savedSession = readActiveSession();

  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem(STORAGE_KEYS.SESSION_ID) || savedSession?.sessionId || ''
  );
  const [parsedResume, setParsedResume] = useState(
    () => readJson(STORAGE_KEYS.PARSED_RESUME, null)
  );
  const [jobRole, setJobRole] = useState(
    () => localStorage.getItem(STORAGE_KEYS.JOB_ROLE) || 'Backend Java Developer'
  );
  const [interviewType, setInterviewType] = useState(
    () => localStorage.getItem(STORAGE_KEYS.INTERVIEW_TYPE) || 'technical'
  );
  const [interviewDuration, setInterviewDuration] = useState(
    () => Number(localStorage.getItem(STORAGE_KEYS.INTERVIEW_DURATION)) || 15
  );

  const [currentQuestion, setCurrentQuestion] = useState(
    () => localStorage.getItem(STORAGE_KEYS.CURRENT_QUESTION) || savedSession?.currentQuestion || ''
  );
  const [questionNumber, setQuestionNumber] = useState(savedSession?.questionNumber || 1);
  const [currentStage, setCurrentStage] = useState(savedSession?.currentStage || 'WARM_UP');
  const [difficulty, setDifficulty] = useState(savedSession?.difficulty || 'Easy');
  const [remainingTime, setRemainingTime] = useState(savedSession?.remainingTime ?? 900);
  const [interviewProgress, setInterviewProgress] = useState(savedSession?.interviewProgress ?? 0);
  const [interviewStatus, setInterviewStatus] = useState(savedSession?.interviewStatus || 'idle');
  const [isTimerPaused, setTimerPaused] = useState(false);

  const [transcriptHistory, setTranscriptHistory] = useState(savedSession?.transcriptHistory || []);
  const [lastCandidateTranscript, setLastCandidateTranscript] = useState(
    savedSession?.lastCandidateTranscript || ''
  );
  const [notifications, setNotifications] = useState([]);
  const [finalReport, setFinalReport] = useState(() => readJson(STORAGE_KEYS.FINAL_REPORT, null));

  const [history, setHistory] = useState(() => readJson(STORAGE_KEYS.HISTORY, []));

  const lastBackendSyncRef = useRef(Date.now());

  // Persist core config
  useEffect(() => {
    if (parsedResume) {
      localStorage.setItem(STORAGE_KEYS.PARSED_RESUME, JSON.stringify(parsedResume));
    }
    if (jobRole) localStorage.setItem(STORAGE_KEYS.JOB_ROLE, jobRole);
    if (interviewType) localStorage.setItem(STORAGE_KEYS.INTERVIEW_TYPE, interviewType);
    if (interviewDuration) {
      localStorage.setItem(STORAGE_KEYS.INTERVIEW_DURATION, String(interviewDuration));
    }
    if (finalReport) {
      localStorage.setItem(STORAGE_KEYS.FINAL_REPORT, JSON.stringify(finalReport));
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [parsedResume, jobRole, interviewType, interviewDuration, finalReport, history]);

  // Persist active interview session snapshot
  useEffect(() => {
    if (!sessionId || interviewStatus !== 'in_progress') return;

    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    if (currentQuestion) localStorage.setItem(STORAGE_KEYS.CURRENT_QUESTION, currentQuestion);

    localStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        sessionId,
        currentQuestion,
        questionNumber,
        currentStage,
        difficulty,
        remainingTime,
        interviewProgress,
        interviewStatus,
        transcriptHistory,
        lastCandidateTranscript,
      })
    );
  }, [
    sessionId,
    currentQuestion,
    questionNumber,
    currentStage,
    difficulty,
    remainingTime,
    interviewProgress,
    interviewStatus,
    transcriptHistory,
    lastCandidateTranscript,
  ]);

  // Local timer tick — decrements only between backend syncs
  useEffect(() => {
    if (interviewStatus !== 'in_progress' || remainingTime <= 0 || isTimerPaused) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [interviewStatus, remainingTime > 0, isTimerPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveResume = (resumeData) => {
    setParsedResume(resumeData);
  };

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const saveFinalReport = useCallback(
    (reportData) => {
      setFinalReport(reportData);
      setInterviewStatus('completed');

      if (reportData && sessionId) {
        setHistory((prev) => {
          const exists = prev.some((item) => item.sessionId === sessionId);
          if (exists) return prev;
          return [
            {
              sessionId,
              jobRole: reportData.job_role || jobRole,
              interviewType: reportData.interview_type || interviewType,
              overallScore: reportData.overall_score,
              rating: reportData.performance_rating,
              date: new Date().toLocaleDateString(),
              report: reportData,
            },
            ...prev,
          ];
        });
      }
    },
    [sessionId, jobRole, interviewType]
  );

  const initInterviewSession = ({
    sessionId: newSessionId,
    question,
    stage = 'WARM_UP',
    remainingTime: initialRemainingTime = 900,
    progress = 0,
    difficulty: initialDifficulty = 'Easy',
    status = 'in_progress',
    jobRole: selectedJobRole,
    interviewType: selectedType,
    interviewDuration: selectedDuration,
  }) => {
    setSessionId(newSessionId);
    setCurrentQuestion(question);
    setQuestionNumber(1);
    setCurrentStage(stage);
    setDifficulty(initialDifficulty);
    setRemainingTime(initialRemainingTime ?? selectedDuration * 60);
    setInterviewProgress(progress);
    setInterviewStatus(status);
    setTranscriptHistory(question ? [{ role: 'interviewer', content: question }] : []);
    setLastCandidateTranscript('');
    setNotifications([]);
    setFinalReport(null);
    lastBackendSyncRef.current = Date.now();

    if (selectedJobRole) setJobRole(selectedJobRole);
    if (selectedType) setInterviewType(selectedType);
    if (selectedDuration) setInterviewDuration(selectedDuration);
  };

  const updateSessionFromResponse = useCallback(
    (responseData, candidateAnswerText = '') => {
      if (!responseData) return;

      if (candidateAnswerText) {
        setLastCandidateTranscript(candidateAnswerText);
        setTranscriptHistory((prev) => [
          ...prev,
          { role: 'candidate', content: candidateAnswerText },
        ]);
      }

      const nextQuestion = responseData.question || responseData.next_question;
      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setTranscriptHistory((prev) => [
          ...prev,
          { role: 'interviewer', content: nextQuestion },
        ]);
      }

      if (responseData.question_number !== undefined && responseData.question_number !== null) {
        setQuestionNumber(responseData.question_number);
      }

      if (responseData.current_stage) {
        setCurrentStage((prevStage) => {
          if (responseData.current_stage !== prevStage) {
            const stageName = responseData.current_stage.replace(/_/g, ' ');
            addNotification(`Moved to ${stageName} Stage`, 'stage');
          }
          return responseData.current_stage;
        });
      }

      if (responseData.difficulty) {
        setDifficulty((prevDifficulty) => {
          if (responseData.difficulty !== prevDifficulty) {
            const direction =
              responseData.difficulty === 'Hard' ||
              (prevDifficulty === 'Easy' && responseData.difficulty === 'Medium')
                ? 'Increased'
                : 'Adjusted';
            addNotification(`Difficulty ${direction} to ${responseData.difficulty}`, 'difficulty');
          }
          return responseData.difficulty;
        });
      }

      if (responseData.remaining_time !== undefined && responseData.remaining_time !== null) {
        setRemainingTime(responseData.remaining_time);
        lastBackendSyncRef.current = Date.now();
      }

      if (responseData.interview_progress !== undefined) {
        setInterviewProgress(responseData.interview_progress);
      }

      if (responseData.interview_status) {
        setInterviewStatus(responseData.interview_status);
      }

      if (responseData.completed || responseData.interview_status === 'completed') {
        setInterviewStatus('completed');
        if (responseData.report) {
          saveFinalReport(responseData.report);
        }
      }
    },
    [addNotification, saveFinalReport]
  );

  const resetSession = () => {
    setSessionId('');
    setCurrentQuestion('');
    setQuestionNumber(1);
    setCurrentStage('WARM_UP');
    setDifficulty('Easy');
    setRemainingTime(900);
    setInterviewProgress(0);
    setInterviewStatus('idle');
    setTranscriptHistory([]);
    setLastCandidateTranscript('');
    setNotifications([]);
    setFinalReport(null);

    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_QUESTION);
    localStorage.removeItem(STORAGE_KEYS.FINAL_REPORT);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  };

  return (
    <InterviewContext.Provider
      value={{
        sessionId,
        parsedResume,
        jobRole,
        interviewType,
        interviewDuration,
        currentQuestion,
        questionNumber,
        currentStage,
        difficulty,
        remainingTime,
        interviewProgress,
        interviewStatus,
        isTimerPaused,
        transcriptHistory,
        lastCandidateTranscript,
        notifications,
        finalReport,
        history,

        setJobRole,
        setInterviewType,
        setInterviewDuration,
        saveResume,
        initInterviewSession,
        updateSessionFromResponse,
        saveFinalReport,
        addNotification,
        resetSession,
        setTimerPaused,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}
