import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

function InterviewSetup() {
  const location = useLocation();
  const navigate = useNavigate();
  const resumeId = location.state?.resumeId;

  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateQuestions = async (e) => {
    e.preventDefault();

    if (!resumeId) {
      setError('No resume found. Please upload your resume first.');
      return;
    }

    if (!jdText.trim()) {
      setError('Please paste the job description');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/questions/generate', {
        resume_id: resumeId,
        jd_text: jdText,
      });

      // Pass generated questions to the interview room page
      navigate('/interview-room', { state: { questions: response.data.questions } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '80px auto', padding: '20px' }}>
      <h1>SmartHire AI</h1>
      <h2>Interview Setup</h2>
      <p>Paste the Job Description you're preparing for.</p>

      <form onSubmit={handleGenerateQuestions}>
        <textarea
          placeholder="Paste job description here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          rows={10}
          style={{ width: '100%', padding: '10px', fontFamily: 'inherit' }}
        />
        <br />
        <button type="submit" disabled={loading} style={{ marginTop: '15px', padding: '10px 20px' }}>
          {loading ? 'Generating Questions... (this may take a moment)' : 'Generate Interview Questions'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default InterviewSetup;