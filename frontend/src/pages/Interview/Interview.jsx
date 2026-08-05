import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from '../../components/AudioRecorder/AudioRecorder.jsx';
import { DifficultyBadge, StageBadge } from '../../components/Badge/Badge.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { useInterview } from '../../context/InterviewContext.jsx';
import { getApiErrorMessage, submitAnswer } from '../../services/interviewService.js';
import { endInterview } from '../../services/reportService.js';
import { playAiAudio, playAiText } from '../../services/voiceService.js';
import './Interview.css';

function Interview() {
  const navigate = useNavigate();
  const {
    sessionId,
    jobRole,
    interviewType,
    currentQuestion,
    questionNumber,
    currentStage,
    difficulty,
    remainingTime,
    interviewProgress,
    interviewStatus,
    transcriptHistory,
    lastCandidateTranscript,
    notifications,
    finalReport,
    updateSessionFromResponse,
    saveFinalReport,
    resetSession,
    addNotification,
    setTimerPaused,
  } = useInterview();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isGeneratingReportRef = useRef(false);

  // Automatically generate the report when the backend marks the interview complete.
  useEffect(() => {
    if (finalReport) {
      navigate('/results');
      return undefined;
    }

    if (interviewStatus !== 'completed' || !sessionId || isGeneratingReportRef.current) {
      return undefined;
    }

    isGeneratingReportRef.current = true;
    setIsSubmitting(true);
    endInterview({ sessionId })
      .then((report) => {
        saveFinalReport(report);
        navigate('/results');
      })
      .catch((err) => {
        isGeneratingReportRef.current = false;
        setError(getApiErrorMessage(err, 'Interview completed, but report generation failed.'));
      })
      .finally(() => {
        setIsSubmitting(false);
      });

    return undefined;
  }, [interviewStatus, finalReport, sessionId, navigate, saveFinalReport]);

  // Format seconds into "14m 28s"
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleVoiceStreamResponse = async (response) => {
    setError('');

    updateSessionFromResponse(response, response.candidate_transcript || 'Voice answer recorded');
    await playAiAudio(response);

    if (response.completed || response.interview_status === 'completed') {
      addNotification('Interview completed. Generating your report...', 'info');
    }
  };

  const handleInitialQuestionPlayback = async () => {
    await playAiText(currentQuestion);
  };

  const handleTextSubmit = async (text) => {
    if (!sessionId) {
      setError('No active interview session found. Please start from the upload page.');
      return;
    }

    setIsSubmitting(true);
    setTimerPaused(true);
    setError('');

    try {
      const response = await submitAnswer({ sessionId, answer: text });
      updateSessionFromResponse(response, text);

      if (response.completed || response.interview_status === 'completed') {
        addNotification('Interview completed. Generating your report...', 'info');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, err.message || 'Failed to submit answer.'));
    } finally {
      setIsSubmitting(false);
      setTimerPaused(false);
    }
  };

  const handleManualEnd = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);

    try {
      const report = await endInterview({ sessionId });
      saveFinalReport(report);
      navigate('/results');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to end interview.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (
      remainingTime > 0 ||
      interviewStatus !== 'in_progress' ||
      !sessionId ||
      isGeneratingReportRef.current
    ) {
      return;
    }

    isGeneratingReportRef.current = true;
    setIsSubmitting(true);
    endInterview({ sessionId })
      .then((report) => {
        saveFinalReport(report);
        navigate('/results');
      })
      .catch((err) => {
        isGeneratingReportRef.current = false;
        setError(getApiErrorMessage(err, 'Time ended, but report generation failed.'));
      })
      .finally(() => setIsSubmitting(false));
  }, [remainingTime, interviewStatus, sessionId, navigate, saveFinalReport]);

  if (!sessionId && !currentQuestion) {
    return (
      <div className="interview-empty glass-card">
        <h2>No Active Interview Session</h2>
        <p>Please configure and start an interview session first.</p>
        <Button onClick={() => navigate('/resume-upload')}>Go to Resume Upload</Button>
      </div>
    );
  }

  return (
    <div className="interview-page page-grid">
      {/* Toast Notifications */}
      <div className="notifications-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notification-toast notification--${n.type}`}>
            <span className="toast-icon">⚡</span>
            <span>{n.message}</span>
          </div>
        ))}
      </div>

      {/* Top Header / Metadata Bar */}
      <div className="interview-header-bar glass-card">
        <div className="header-meta-group">
          <span className="meta-label">Role:</span>
          <strong className="meta-val">{jobRole}</strong>
          <span className="meta-divider">•</span>
          <span className="meta-label">Type:</span>
          <span className="meta-val capitalize">{interviewType}</span>
        </div>

        <div className="header-status-group">
          <div className="status-item">
            <span className="status-label">Stage</span>
            <StageBadge stage={currentStage} />
          </div>
          <div className="status-item">
            <span className="status-label">Difficulty</span>
            <DifficultyBadge difficulty={difficulty} />
          </div>
          <div className="status-item timer-box">
            <span className="status-label">Remaining Time</span>
            <strong className="timer-value">⏱️ {formatTime(remainingTime)}</strong>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="interview-progress-bar-card glass-card">
        <div className="progress-label-row">
          <span>Interview Progress (Question {questionNumber})</span>
          <strong>{interviewProgress.toFixed(0)}%</strong>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.max(0, interviewProgress))}%` }} />
        </div>
      </div>

      {/* Main Grid: Left Question & Transcript, Right Controls */}
      <div className="interview-main-grid">
        <div className="left-column">
          {/* AI Question Card */}
          <div className="ai-question-card glass-card">
            <div className="question-card-header">
              <span className="ai-avatar">🤖 Interviewer AI</span>
              <div className="card-badges">
                <StageBadge stage={currentStage} />
                <DifficultyBadge difficulty={difficulty} />
              </div>
            </div>

            <h2 className="ai-question-text">
              {currentQuestion || 'Generating interviewer question...'}
            </h2>
          </div>

          {/* Live Transcript Log */}
          <div className="transcript-card glass-card">
            <h3 className="transcript-title">💬 Live Candidate Transcript</h3>
            {lastCandidateTranscript ? (
              <div className="latest-transcript-box">
                <span className="transcript-label">You said:</span>
                <p className="transcript-content">"{lastCandidateTranscript}"</p>
              </div>
            ) : (
              <p className="transcript-placeholder">Your spoken/written answers will appear here live after each turn.</p>
            )}

            {transcriptHistory.length > 0 && (
              <details className="transcript-history-details">
                <summary>View Full Conversation History ({transcriptHistory.length})</summary>
                <div className="history-list">
                  {transcriptHistory.map((item, idx) => (
                    <div key={idx} className={`history-item history--${item.role}`}>
                      <strong>{item.role === 'candidate' ? 'You' : 'AI'}:</strong>
                      <p>{item.content}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Right Column: Audio & Controls */}
        <div className="right-column">
          <div className="controls-card glass-card">
            <h3 className="controls-title">🎙️ Response Controls</h3>
            <AudioRecorder
              sessionId={sessionId}
              onInitialQuestionPlayback={handleInitialQuestionPlayback}
              onVoiceStreamResponse={handleVoiceStreamResponse}
              onTextSubmit={handleTextSubmit}
              onProcessingChange={setTimerPaused}
              isSubmitting={isSubmitting}
            />

            {error && <div className="error-banner">{error}</div>}

            <div className="finish-early-box">
              <Button onClick={handleManualEnd} variant="danger" disabled={isSubmitting}>
                🏁 Finish & Generate Report Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Interview;
