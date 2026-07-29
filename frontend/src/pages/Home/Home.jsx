import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import './Home.css';

const features = [
  {
    icon: '⏱️',
    title: 'Time-Aware AI Interviewer',
    description: 'Dynamic time manager adjusts question depth, follow-ups, and stage timing in real-time.',
  },
  {
    icon: '🎯',
    title: 'Adaptive Difficulty',
    description: 'Automatically increases or lowers question complexity based on candidate live performance.',
  },
  {
    icon: '⚡',
    title: 'Continuous Evaluation',
    description: 'Scores Communication (30%), Technical (30%), Confidence (25%), and Professionalism (15%) per question.',
  },
  {
    icon: '📊',
    title: 'Dashboard Analytics',
    description: 'Comprehensive performance reports with skill trends, weak areas, and candidate percentile rankings.',
  },
];

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-hero">
        <div className="home-hero__badge">
          <span className="sparkle">✨</span> Next-Gen AI Assessment Platform
        </div>
        <h1 className="home-hero__title">
          Master Your Interviews with <span className="text-gradient">SmartHire AI</span>
        </h1>
        <p className="home-hero__description">
          An intelligent, time-aware adaptive interview engine that evaluates your technical depth, communication,
          and confidence like a senior hiring manager.
        </p>

        <div className="home-hero__actions">
          <Button onClick={() => navigate('/resume-upload')} size="large">
            🚀 Start Interview Now
          </Button>
          <button className="btn-secondary-custom" onClick={() => navigate('/history')}>
            📜 View Interview History
          </button>
        </div>
      </div>

      <div className="features-section">
        <h2 className="features-title">Platform Features</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card glass-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
