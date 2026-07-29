import React from 'react';
import { NavLink } from 'react-router-dom';
import { useInterview } from '../../context/InterviewContext.jsx';
import './Navbar.css';

const links = [
  { label: 'Home', path: '/' },
  { label: 'Upload Resume', path: '/resume-upload' },
  { label: 'Interview', path: '/interview' },
  { label: 'Dashboard', path: '/results' },
  { label: 'History', path: '/history' },
];

function Navbar() {
  const { interviewStatus, currentStage, difficulty } = useInterview();

  return (
    <header className="navbar">
      <NavLink className="navbar__brand" to="/">
        <div className="navbar__logo-icon">SH</div>
        <span className="navbar__brand-text">SmartHire AI</span>
      </NavLink>

      <nav className="navbar__links" aria-label="Primary navigation">
        {links.map((link) => (
          <NavLink
            key={link.path}
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
            to={link.path}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {interviewStatus === 'in_progress' && (
        <div className="navbar__live-indicator">
          <span className="navbar__pulse-dot" />
          <span>Live Interview ({currentStage.replace('_', ' ')})</span>
        </div>
      )}
    </header>
  );
}

export default Navbar;
