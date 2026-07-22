import { NavLink } from 'react-router-dom';

import './Navbar.css';

const links = [
  { label: 'Home', path: '/' },
  { label: 'Upload Resume', path: '/resume-upload' },
  { label: 'Interview', path: '/interview' },
  { label: 'Results', path: '/results' },
];

function Navbar() {
  return (
    <header className="navbar">
      <NavLink className="navbar__brand" to="/">
        AI Mock Interview
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
    </header>
  );
}

export default Navbar;
