import React from 'react';
import './StatusBar.css';

export default function StatusBar({ selectedLanguage, linesCount, charCount, connected }) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <div className={`status-item connection-status ${connected ? 'connected' : 'offline'}`}>
          <span className="indicator-dot" />
          <span className="indicator-text">{connected ? 'Connected' : 'Offline'}</span>
        </div>
        <div className="status-divider" />
        <span className="status-item brand">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          CompileX
        </span>
      </div>

      <div className="status-right">
        <span className="status-item">Ln {linesCount}</span>
        <span className="status-item">Ch {charCount}</span>
        <div className="status-divider" />
        <span className="status-item encoding">UTF-8</span>
        <div className="status-divider" />
        <span className="status-item language">{selectedLanguage?.toUpperCase()}</span>
      </div>
    </div>
  );
}
