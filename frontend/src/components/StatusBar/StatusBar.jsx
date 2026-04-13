import React from 'react';
import { isMockMode } from '../../services/judge0';
import './StatusBar.css';

export default function StatusBar({ selectedLanguage, linesCount, charCount }) {
  const mock = isMockMode();

  return (
    <div className="status-bar">
      <div className="status-left">
        {mock && (
          <span className="status-item demo-badge" title="Add API keys to .env for live execution">
            <span className="demo-dot" />
            Demo Mode
          </span>
        )}
        <span className="status-item">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          CompileX IDE
        </span>
      </div>

      <div className="status-right">
        <span className="status-item">Ln {linesCount}</span>
        <span className="status-separator" />
        <span className="status-item">{charCount} chars</span>
        <span className="status-separator" />
        <span className="status-item">UTF-8</span>
        <span className="status-separator" />
        <span className="status-item lang-badge">{selectedLanguage?.toUpperCase()}</span>
      </div>
    </div>
  );
}
