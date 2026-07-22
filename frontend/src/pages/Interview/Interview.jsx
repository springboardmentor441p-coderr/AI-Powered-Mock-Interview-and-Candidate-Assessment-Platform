import { useLocation } from 'react-router-dom';

import AudioRecorder from '../../components/AudioRecorder/AudioRecorder.jsx';
import { interviewTypeOptions } from '../../components/InterviewTypeSelector/InterviewTypeSelector.jsx';
import './Interview.css';

function Interview() {
  const { state } = useLocation();
  const interviewType = state?.interviewType ?? 'technical';
  const interviewTypeLabel =
    interviewTypeOptions.find((option) => option.value === interviewType)?.label ?? 'Technical Interview';
  const currentQuestion = state?.currentQuestion ?? 'Tell me about yourself and your experience.';

  return (
    <section className="page-grid">
      <div>
        <p className="page-kicker">Interview</p>
        <h1>Interview Page</h1>
        <p className="page-description">Record your answer locally and continue the interview flow.</p>
      </div>

      <div className="interview-layout">
        <section className="question-panel">
          <div className="interview-meta">
            <div>
              <p className="question-panel__label">Interview Type</p>
              <strong>{interviewTypeLabel}</strong>
            </div>
            {state?.jobRole && (
              <div>
                <p className="question-panel__label">Job Role</p>
                <strong>{state.jobRole}</strong>
              </div>
            )}
          </div>
          <p className="question-panel__label">Current AI Question</p>
          <h2>{currentQuestion}</h2>
          {state?.sessionId && <p className="question-panel__session">Session ID: {state.sessionId}</p>}
        </section>

        <section className="recorder-panel">
          <p className="question-panel__label">Microphone Status</p>
          <AudioRecorder />
        </section>
      </div>
    </section>
  );
}

export default Interview;
