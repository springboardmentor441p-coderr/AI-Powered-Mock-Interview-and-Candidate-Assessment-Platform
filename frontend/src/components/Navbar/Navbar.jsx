import React from 'react';
import { BarChart3, BriefcaseBusiness, Clock3, FileText, Home, Mic2 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useInterview } from '../../context/InterviewContext.jsx';
import './Navbar.css';

const links = [
  { label: 'Overview', path: '/', icon: Home },
  { label: 'New interview', path: '/resume-upload', icon: FileText },
  { label: 'Interview room', path: '/interview', icon: Mic2 },
  { label: 'Reports', path: '/results', icon: BarChart3 },
  { label: 'History', path: '/history', icon: Clock3 },
];

const pageMeta = {
  '/': ['Overview', 'Monitor interview readiness and recent performance.'],
  '/resume-upload': ['New interview', 'Configure a structured candidate assessment.'],
  '/interview': ['Interview room', 'Live AI-led candidate assessment.'],
  '/results': ['Performance report', 'Review competency scores and detailed feedback.'],
  '/history': ['Interview history', 'Access completed candidate assessments.'],
};

function Navbar() {
  const { interviewStatus, currentStage } = useInterview();
  const location = useLocation();
  const [title, description] = pageMeta[location.pathname] || pageMeta['/'];

  return (
    <>
      <aside className="sidebar">
        <NavLink className="sidebar__brand" to="/" aria-label="Verixa overview">
          <span className="sidebar__mark"><BriefcaseBusiness size={17} /></span>
          <span>Verixa</span>
        </NavLink>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          <span className="sidebar__section-label">Workspace</span>
          {links.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              className={({ isActive }) =>
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
              to={path}
            >
              <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="sidebar__workspace-avatar">VX</span>
          <div><strong>Verixa</strong><small>AI-Powered Interview &amp; Candidate Assessment Platform</small></div>
        </div>
      </aside>

      <header className="topbar">
        <div className="topbar__heading">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {interviewStatus === 'in_progress' ? (
          <div className="topbar__status"><span className="status-dot" />Live · {currentStage.replaceAll('_', ' ')}</div>
        ) : (
          <div className="topbar__status topbar__status--neutral">System ready</div>
        )}
      </header>
    </>
  );
}

export default Navbar;
