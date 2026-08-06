import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import InterviewTypeSelector from '../../components/InterviewTypeSelector/InterviewTypeSelector.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { useInterview } from '../../context/InterviewContext.jsx';
import { startInterview } from '../../services/interviewService.js';
import { getApiErrorMessage, parseResume } from '../../services/resumeService.js';
import './ResumeUpload.css';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const DURATION_OPTIONS = [5, 10, 15, 20, 30];

function ResumeUpload() {
  const navigate = useNavigate();
  const {
    saveResume,
    initInterviewSession,
    jobRole: contextJobRole,
    interviewType: contextType,
    interviewDuration: contextDuration,
  } = useInterview();

  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const [interviewType, setInterviewType] = useState(contextType || 'technical');
  const [jobRole, setJobRole] = useState(contextJobRole || 'Backend Java Developer');
  const [interviewDuration, setInterviewDuration] = useState(contextDuration || 15);

  const validateFile = (file) => {
    if (!file) return false;
    const filename = file.name.toLowerCase();
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) => filename.endsWith(ext));
    if (!isAllowed) {
      setError(`Unsupported file format '${file.name}'. Please upload a PDF, DOC, or DOCX file.`);
      return false;
    }
    return true;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setParsedData(null);

    if (!validateFile(file)) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      const result = await parseResume(file);
      setParsedData(result);
      saveResume(result);

      if (result.name) {
        // Automatically populate candidate info if available
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to parse resume. Please check the file and try again.'));
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartInterview = async (event) => {
    event.preventDefault();
    setError('');

    if (!parsedData) {
      setError('Please upload your resume before starting the interview.');
      return;
    }

    if (!jobRole.trim()) {
      setError('Please enter the job role you want to practice for.');
      return;
    }

    setIsStarting(true);

    try {
      let activeResume = parsedData;

      const response = await startInterview({
        interviewType,
        jobRole: jobRole.trim(),
        interviewDuration: Number(interviewDuration),
        maxQuestions: 10,
        resume: activeResume,
      });

      initInterviewSession({
        sessionId: response.session_id,
        question: response.question,
        stage: response.current_stage || 'WARM_UP',
        remainingTime: response.remaining_time,
        progress: response.interview_progress,
        difficulty: response.difficulty,
        status: response.interview_status,
        jobRole: jobRole.trim(),
        interviewType,
        interviewDuration: Number(interviewDuration),
      });

      navigate('/interview');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to start interview session. Please try again.'));
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="resume-upload-page page-grid">
      <div className="page-header">
        <p className="page-kicker">Candidate Preparation</p>
        <h1>Resume Upload & Configuration</h1>
        <p className="page-description">
          Upload your resume to extract key skills and customize your time-aware AI mock interview session.
        </p>
      </div>

      <div className="resume-upload-layout">
        {/* Left Column: File Upload & Parsed Summary */}
        <div className="upload-section glass-card">
          <h2 className="section-subtitle">1. Upload Resume</h2>

          <div className="dropzone">
            <input
              id="resume-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="file-input-hidden"
            />
            <label htmlFor="resume-input" className="dropzone-label">
              <div className="dropzone-icon">📄</div>
              <span className="dropzone-text">
                {selectedFile ? selectedFile.name : 'Drag & drop or click to upload resume'}
              </span>
              <small className="dropzone-hint">Supports PDF, DOC, DOCX files</small>
            </label>
          </div>

          {isParsing && <Loader label="Parsing resume structure with AI..." />}

          {parsedData && (
            <div className="parsed-preview">
              <h3 className="preview-title">Candidate Profile Preview</h3>

              {parsedData.name && (
                <div className="preview-field">
                  <strong>Name:</strong> <span>{parsedData.name}</span>
                </div>
              )}

              {parsedData.skills && parsedData.skills.length > 0 && (
                <div className="preview-field">
                  <strong>Detected Skills:</strong>
                  <div className="skills-chips">
                    {parsedData.skills.map((skill, idx) => (
                      <span key={idx} className="skill-chip">
                        {typeof skill === 'string' ? skill : skill.name || String(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {parsedData.projects && parsedData.projects.length > 0 && (
                <div className="preview-field">
                  <strong>Detected Projects ({parsedData.projects.length}):</strong>
                  <ul className="preview-list">
                    {parsedData.projects.slice(0, 3).map((p, idx) => (
                      <li key={idx}>
                        <strong>{p.title || p.name || 'Project'}</strong>
                        {p.description && <p>{p.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.experience && parsedData.experience.length > 0 && (
                <div className="preview-field">
                  <strong>Experience Summary:</strong>
                  <ul className="preview-list">
                    {parsedData.experience.slice(0, 2).map((exp, idx) => (
                      <li key={idx}>
                        <span>{exp.role || 'Role'} at {exp.company || 'Company'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Configuration Form */}
        <form className="config-section glass-card" onSubmit={handleStartInterview}>
          <h2 className="section-subtitle">2. Interview Configuration</h2>

          <InterviewTypeSelector value={interviewType} onChange={setInterviewType} />

          <div className="form-group">
            <label className="form-label" htmlFor="jobRole">
              Job Role / Position
            </label>
            <input
              id="jobRole"
              type="text"
              className="form-input"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Backend Java Developer"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="duration">
              Interview Duration
            </label>
            <select
              id="duration"
              className="form-select"
              value={interviewDuration}
              onChange={(e) => setInterviewDuration(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map((mins) => (
                <option key={mins} value={mins}>
                  {mins} Minutes
                </option>
              ))}
            </select>
            <small className="form-hint">
              The time manager adapts question strategy based on selected duration.
            </small>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <Button disabled={isStarting || isParsing} type="submit" size="large">
            {isStarting ? 'Initializing session...' : 'Start interview'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ResumeUpload;
