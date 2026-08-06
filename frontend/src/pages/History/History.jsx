import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RatingBadge } from '../../components/Badge/Badge.jsx';
import Button from '../../components/Button/Button.jsx';
import { useInterview } from '../../context/InterviewContext.jsx';
import './History.css';

function History() {
  const navigate = useNavigate();
  const { history, saveFinalReport } = useInterview();

  const handleViewReport = (report) => {
    saveFinalReport(report);
    navigate('/results');
  };

  return (
    <div className="history-page page-grid">
      <div className="page-header">
        <p className="page-kicker">Interview Records</p>
        <h1>Interview History</h1>
        <p className="page-description">
          Review past mock interview reports, performance trends, and candidate feedback.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="history-empty glass-card">
          <h2>No Saved History</h2>
          <p>Complete a mock interview session to automatically save your reports here.</p>
          <Button onClick={() => navigate('/resume-upload')}>Start New Interview</Button>
        </div>
      ) : (
        <div className="history-list-grid">
          {history.map((item, idx) => (
            <div key={idx} className="history-card glass-card">
              <div className="history-card__header">
                <div>
                  <span className="history-card__role">{item.jobRole || 'Role unavailable'}</span>
                  <span className="history-card__type capitalize"> ({item.interviewType || 'type unavailable'})</span>
                </div>
                <RatingBadge rating={item.rating || 'Unrated'} />
              </div>

              <div className="history-card__body">
                <div className="history-stat">
                  <span className="stat-label">Overall Score</span>
                  <strong className="stat-val">{Number(item.overallScore ?? 0).toFixed(1)} / 100</strong>
                </div>
                <div className="history-stat">
                  <span className="stat-label">Date Completed</span>
                  <span className="stat-date">{item.date || 'Recent'}</span>
                </div>
              </div>

              <div className="history-card__actions">
                <Button onClick={() => handleViewReport(item.report)}>
                  View report
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
