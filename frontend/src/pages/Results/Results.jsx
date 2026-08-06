import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Accordion } from '../../components/Accordion/Accordion.jsx';
import { Badge, RatingBadge } from '../../components/Badge/Badge.jsx';
import Button from '../../components/Button/Button.jsx';
import { useInterview } from '../../context/InterviewContext.jsx';
import './Results.css';

function Results() {
  const navigate = useNavigate();
  const { finalReport, jobRole, interviewType, resetSession } = useInterview();

  if (!finalReport) {
    return (
      <div className="results-empty glass-card">
        <h2>No Interview Report Found</h2>
        <p>Complete an interview session to generate your comprehensive performance dashboard.</p>
        <Button onClick={() => navigate('/resume-upload')}>Start Mock Interview</Button>
      </div>
    );
  }

  const {
    candidate_information,
    communication_score,
    confidence_score,
    technical_score,
    professionalism_score,
    overall_score,
    performance_rating,
    strengths = [],
    weaknesses = [],
    recommendations = [],
    learning_resources = [],
    interview_summary = '',
    question_wise_evaluation = [],
    analytics = {},
  } = finalReport;

  const asScore = (value) => Number(value ?? 0);
  const communicationScore = asScore(communication_score);
  const confidenceScore = asScore(confidence_score);
  const technicalScore = asScore(technical_score);
  const professionalismScore = asScore(professionalism_score);
  const overallScore = asScore(overall_score);

  // Prepare chart data
  const scoreBreakdownData = [
    { category: 'Communication', score: communicationScore, fullMark: 100 },
    { category: 'Technical', score: technicalScore, fullMark: 100 },
    { category: 'Confidence', score: confidenceScore, fullMark: 100 },
    { category: 'Professionalism', score: professionalismScore, fullMark: 100 },
  ];

  // Question trend data
  const trendData = question_wise_evaluation.map((evalItem, idx) => ({
    question: `Q${evalItem.question_number || idx + 1}`,
    communication: asScore(evalItem.communication?.score),
    technical: asScore(evalItem.technical?.score),
    confidence: asScore(evalItem.confidence?.score),
    overall: asScore(evalItem.overall_score),
  }));

  const weakAreas = analytics?.weak_areas || [];
  const ranking = analytics?.candidate_ranking || {};
  const percentile = analytics?.performance_tracking?.percentile_rank;

  const handleStartNew = () => {
    resetSession();
    navigate('/resume-upload');
  };

  return (
    <div className="results-page page-grid">
      {/* Top Banner */}
      <div className="results-header glass-card">
        <div className="header-info">
          <p className="page-kicker">Performance Analytics</p>
          <h1>Interview performance report</h1>
          <p className="page-description">
            Candidate: <strong>{candidate_information?.name || 'Candidate'}</strong> | Role:{' '}
            <strong>{jobRole}</strong> ({interviewType} interview)
          </p>
        </div>

        <div className="header-overall-card">
          <div className="overall-score-badge">
            <span className="score-num">{overallScore.toFixed(1)}</span>
            <span className="score-denom">/ 100</span>
          </div>
          <div className="rating-pill-wrap">
            <span className="rating-label">Performance Rating</span>
            <RatingBadge rating={performance_rating || 'Unrated'} />
          </div>
        </div>
      </div>

      {/* 4 Category Score Cards */}
      <div className="score-cards-grid">
        <div className="score-card glass-card">
          <div className="score-card__content">
            <span className="score-card__title">Communication (30%)</span>
            <span className="score-card__value">{communicationScore.toFixed(1)}</span>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${communicationScore}%` }} />
            </div>
          </div>
        </div>

        <div className="score-card glass-card">
          <div className="score-card__content">
            <span className="score-card__title">Technical Relevance (30%)</span>
            <span className="score-card__value">{technicalScore.toFixed(1)}</span>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${technicalScore}%` }} />
            </div>
          </div>
        </div>

        <div className="score-card glass-card">
          <div className="score-card__content">
            <span className="score-card__title">Confidence (25%)</span>
            <span className="score-card__value">{confidenceScore.toFixed(1)}</span>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${confidenceScore}%` }} />
            </div>
          </div>
        </div>

        <div className="score-card glass-card">
          <div className="score-card__content">
            <span className="score-card__title">Professionalism (15%)</span>
            <span className="score-card__value">{professionalismScore.toFixed(1)}</span>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${professionalismScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Ranking & Weak Areas Summary */}
      <div className="analytics-summary-grid">
        <div className="ranking-card glass-card">
          <h3>Candidate ranking</h3>
          <div className="ranking-details">
            <div className="ranking-badge-box">
              <span className="ranking-tier">{ranking.tier || performance_rating || 'Unrated'}</span>
              {percentile !== undefined && (
                <span className="ranking-percentile">Top {100 - percentile}% ({percentile}th Percentile)</span>
              )}
            </div>
            <p className="ranking-desc">
              Your overall score of {overallScore.toFixed(1)} ranks you among competitive candidates for{' '}
              {jobRole}.
            </p>
          </div>
        </div>

        <div className="weak-areas-card glass-card">
          <h3>Development priorities</h3>
          <div className="weak-badges">
            {weakAreas.map((area, idx) => (
              <Badge key={idx} variant="warning">
                {area}
              </Badge>
            ))}
            {weakAreas.length === 0 && <span className="empty-note">No weak areas returned.</span>}
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="charts-grid">
        {/* Question Score Progression Trend */}
        <div className="chart-card glass-card">
          <h3>Score progression</h3>
          <p className="chart-subtitle">Question-by-question trajectory across key dimensions</p>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <CartesianGrid vertical={false} stroke="#252a32" />
                <XAxis dataKey="question" stroke="#68717e" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#68717e" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161a20', borderColor: '#343b46', borderRadius: 8, color: '#f2f4f7' }}
                />
                <Legend />
                <Area type="monotone" dataKey="overall" name="Overall" stroke="#3b82f6" fill="rgba(59,130,246,.12)" />
                <Area type="monotone" dataKey="technical" name="Technical" stroke="#9aa3af" fill="none" />
                <Area type="monotone" dataKey="communication" name="Communication" stroke="#68717e" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Breakdown Radar Chart */}
        <div className="chart-card glass-card">
          <h3>Competency breakdown</h3>
          <p className="chart-subtitle">Evaluation balance across candidate assessment dimensions</p>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={scoreBreakdownData}>
                <PolarGrid stroke="#252a32" />
                <PolarAngleAxis dataKey="category" stroke="#9aa3af" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#68717e" />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.16} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Feedback Cards */}
      <div className="feedback-section-grid">
        <div className="feedback-card glass-card border-green">
          <h3>Strengths</h3>
          <ul className="feedback-list">
            {strengths.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="feedback-card glass-card border-red">
          <h3>Areas to improve</h3>
          <ul className="feedback-list">
            {weaknesses.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="feedback-card glass-card border-blue">
          <h3>Recommendations</h3>
          <ul className="feedback-list">
            {recommendations.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="feedback-card glass-card border-purple">
          <h3>Learning resources</h3>
          <ul className="feedback-list">
            {learning_resources.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interview Summary Card */}
      {interview_summary && (
        <div className="interview-summary-card glass-card">
          <h3>Executive summary</h3>
          <p>{interview_summary}</p>
        </div>
      )}

      {/* Question-wise Accordion Breakdown */}
      <div className="accordion-section glass-card">
        <h2>Question-wise Evaluation Breakdown</h2>
        <Accordion items={question_wise_evaluation} />
      </div>

      {/* Action Footer */}
      <div className="results-actions">
        <Button onClick={handleStartNew} size="large">
          Start another interview
        </Button>
      </div>
    </div>
  );
}

export default Results;
