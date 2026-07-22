import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button/Button.jsx';
import InterviewTypeSelector from '../../components/InterviewTypeSelector/InterviewTypeSelector.jsx';
import { parseResume, startInterview } from '../../services/interviewService.js';
import './ResumeUpload.css';

function ResumeUpload() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [interviewType, setInterviewType] = useState('technical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleStartInterview = async (event) => {
    event.preventDefault();
    setError('');

    if (!selectedFile) {
      setError('Please upload your resume before starting the interview.');
      return;
    }

    if (!interviewType) {
      setError('Please select an interview type.');
      return;
    }

    if (!jobRole.trim()) {
      setError('Please enter the job role you want to practice for.');
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedResume = await parseResume(selectedFile);
      const interview = await startInterview({
        interviewType,
        jobRole: jobRole.trim(),
        resume: parsedResume,
        maxQuestions: 10,
      });

      navigate('/interview', {
        state: {
          currentQuestion: interview.question,
          interviewType,
          jobRole: jobRole.trim(),
          parsedResume,
          sessionId: interview.session_id,
        },
      });
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        'Unable to start the interview. Please check your backend server and try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-grid">
      <div>
        <p className="page-kicker">Resume</p>
        <h1>Resume Upload Page</h1>
        <p className="page-description">
          Choose a resume file to prepare for a future interview flow.
        </p>
      </div>

      <form className="upload-panel" onSubmit={handleStartInterview}>
        <label className="upload-panel__label" htmlFor="resume">
          Resume file
        </label>
        <input
          accept=".pdf,.doc,.docx"
          id="resume"
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] ?? null);
            setError('');
          }}
          type="file"
        />
        {selectedFile && <p className="upload-panel__filename">{selectedFile.name}</p>}

        <InterviewTypeSelector onChange={setInterviewType} value={interviewType} />

        <label className="upload-panel__label" htmlFor="jobRole">
          Job role
        </label>
        <input
          id="jobRole"
          onChange={(event) => {
            setJobRole(event.target.value);
            setError('');
          }}
          placeholder="Backend Java Developer"
          type="text"
          value={jobRole}
        />

        {error && <p className="upload-panel__error">{error}</p>}

        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Starting Interview...' : 'Start Interview'}
        </Button>
      </form>
    </section>
  );
}

export default ResumeUpload;
