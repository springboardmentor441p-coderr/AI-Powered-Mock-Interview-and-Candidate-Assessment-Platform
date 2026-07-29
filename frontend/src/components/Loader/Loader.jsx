import React from 'react';
import './Loader.css';

export function Loader({ label = 'Loading...' }) {
  return (
    <div className="loader-container">
      <div className="loader-spinner" />
      {label && <p className="loader-label">{label}</p>}
    </div>
  );
}

export default Loader;
