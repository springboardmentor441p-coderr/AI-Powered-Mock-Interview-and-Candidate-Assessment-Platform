import './InterviewTypeSelector.css';

export const interviewTypeOptions = [
  {
    label: 'Technical Interview',
    value: 'technical',
    description: 'Role-specific technical depth, projects, skills, and problem solving.',
  },
  {
    label: 'HR Interview',
    value: 'hr',
    description: 'Motivation, communication, teamwork, leadership, and company fit.',
  },
];

function InterviewTypeSelector({ name = 'interviewType', onChange, options = interviewTypeOptions, value }) {
  return (
    <fieldset className="interview-type-selector">
      <legend>Select Interview Type</legend>
      <div className="interview-type-selector__options">
        {options.map((option) => (
          <label className="interview-type-option" key={option.value}>
            <input
              checked={value === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default InterviewTypeSelector;
