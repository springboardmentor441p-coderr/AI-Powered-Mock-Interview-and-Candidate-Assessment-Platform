import React, { useState } from 'react';
import { DifficultyBadge, RatingBadge, StageBadge } from '../Badge/Badge.jsx';
import './Accordion.css';

export function Accordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleIndex = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  if (!items || items.length === 0) {
    return <p className="accordion-empty">No detailed question evaluations recorded yet.</p>;
  }

  return (
    <div className="accordion">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className={`accordion__item ${isOpen ? 'is-open' : ''}`}>
            <button
              className="accordion__header"
              onClick={() => toggleIndex(idx)}
              type="button"
              aria-expanded={isOpen}
            >
              <div className="accordion__header-title">
                <span className="accordion__num">Q{item.question_number || idx + 1}</span>
                <span className="accordion__question-text">{item.question}</span>
              </div>

              <div className="accordion__header-meta">
                <StageBadge stage={item.stage || 'WARM_UP'} />
                <DifficultyBadge difficulty={item.difficulty || 'Easy'} />
                <RatingBadge rating={item.performance_rating || 'Good'} />
                <span className="accordion__score">{item.overall_score?.toFixed(1)} / 100</span>
                <span className="accordion__chevron">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="accordion__body">
                <div className="accordion__qa-block">
                  <div className="accordion__subblock">
                    <strong>Question:</strong>
                    <p>{item.question}</p>
                  </div>
                  <div className="accordion__subblock">
                    <strong>Candidate Answer:</strong>
                    <p className="accordion__answer-text">"{item.answer}"</p>
                  </div>
                </div>

                <div className="accordion__scores-grid">
                  <div className="score-card-mini">
                    <span className="score-card-mini__label">Communication</span>
                    <span className="score-card-mini__val">{item.communication?.score?.toFixed(1)}</span>
                    <small>{item.communication?.reasoning}</small>
                  </div>
                  <div className="score-card-mini">
                    <span className="score-card-mini__label">Technical Relevance</span>
                    <span className="score-card-mini__val">{item.technical?.score?.toFixed(1)}</span>
                    <small>{item.technical?.reasoning}</small>
                  </div>
                  <div className="score-card-mini">
                    <span className="score-card-mini__label">Confidence</span>
                    <span className="score-card-mini__val">{item.confidence?.score?.toFixed(1)}</span>
                    <small>{item.confidence?.reasoning}</small>
                  </div>
                  <div className="score-card-mini">
                    <span className="score-card-mini__label">Professionalism</span>
                    <span className="score-card-mini__val">{item.professionalism?.score?.toFixed(1)}</span>
                    <small>{item.professionalism?.reasoning}</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
