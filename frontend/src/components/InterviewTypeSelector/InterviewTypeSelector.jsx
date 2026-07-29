import React from 'react';
import './InterviewTypeSelector.css';

export const interviewTypeOptions = [
  {
    value: 'technical',
    label: 'Technical Interview',
    description: 'Practical coding, system architecture, engineering trade-offs, and problem solving.',
  },
  {
    value: 'hr',
    label: 'HR Interview',
    description: 'Behavioral scenarios, team communication, motivation, leadership, and culture fit.',
  },
];

function InterviewTypeSelector({ value = 'technical', onChange }) {
  return (
    <div className="interview-type-selector">
      <label className="type-selector__title">Interview Type</label>
      <div className="type-selector__options">
        {interviewTypeOptions.map((option) => {
          const isSelected = value === option.value;
          return (
            <label
              key={option.value}
              className={`type-selector__card ${isSelected ? 'is-selected' : ''}`}
            >
              <input
                type="radio"
                name="interviewType"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange && onChange(option.value)}
                className="type-selector__radio"
              />
              <div className="type-selector__content">
                <div className="type-selector__header">
                  <span className="type-selector__label">{option.label}</span>
                </div>
                <p className="type-selector__desc">{option.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default InterviewTypeSelector;
