import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setError('');
    setUploading(true);

    // Files need to be sent as FormData, not JSON
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '80px auto', padding: '20px' }}>
      <h1>SmartHire AI</h1>
      <h2>Upload Your Resume</h2>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ marginBottom: '15px' }}
        />
        <br />
        <button type="submit" disabled={uploading} style={{ padding: '10px 20px' }}>
          {uploading ? 'Uploading & Parsing...' : 'Upload Resume'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
  <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
    <h3>✅ Resume uploaded successfully!</h3>
    <p>Your resume has been analyzed. Let's set up your interview.</p>

    <button
      onClick={() => navigate('/interview-setup', { state: { resumeId: result.resume_id } })}
      style={{ marginTop: '10px', padding: '10px 20px' }}
    >
      Continue to Interview Setup
    </button>
  </div>
)}
    </div>
  );
}

export default ResumeUpload;