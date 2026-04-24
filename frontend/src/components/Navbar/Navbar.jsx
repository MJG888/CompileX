import React, { useState } from 'react';
import { LANGUAGES } from '../../constants/languages';
import './Navbar.css';

const RunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
  </svg>
);

const AIIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

export default function Navbar({
  selectedLanguage,
  onLanguageChange,
  onRun,
  isRunning,
  theme,
  onThemeToggle,
  onShare,
  onAIToggle,
  aiPanelOpen,
  version,
  backendConnected,
}) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const lang = LANGUAGES.find((l) => l.id === selectedLanguage) || LANGUAGES[0];

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <div className="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#bolt)" />
            <defs>
              <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06d6a0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="logo-text">
          Compile<span className="logo-accent">X</span>
        </span>
        <span className="logo-badge">AI</span>
        {version && <span className="version-info">v{version}</span>}
      </div>

      {/* Center: Language Selector */}
      <div className="navbar-center">
        <button
          className="language-selector-wrapper"
          onClick={() => setShowLangMenu(true)}
        >
          <span className="language-icon">{lang.icon}</span>
          <span className="language-selector-text">{lang.label}</span>
          <svg className="select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="navbar-actions">
        {/* Connection indicator */}
        {backendConnected === false && (
          <span className="connection-badge offline" title="Backend not connected">
            <span className="connection-dot" />
            Offline
          </span>
        )}

        {/* AI Toggle */}
        <button
          id="ai-panel-toggle"
          className={`btn-icon btn-ai ${aiPanelOpen ? 'active' : ''}`}
          onClick={onAIToggle}
          title="Toggle AI Assistant"
        >
          <AIIcon />
          <span>AI</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle"
          className="btn-icon"
          onClick={onThemeToggle}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Share */}
        <button id="share-btn" className="btn-icon" title="Share code" onClick={onShare}>
          <ShareIcon />
        </button>

        {/* Run Button */}
        <button
          id="run-btn"
          className={`btn-run ${isRunning ? 'running' : ''}`}
          onClick={onRun}
          disabled={isRunning}
          title="Run code (Ctrl+Enter)"
        >
          {isRunning ? (
            <>
              <div className="spinner" />
              <span>Running…</span>
            </>
          ) : (
            <>
              <RunIcon />
              <span>Run</span>
            </>
          )}
        </button>
      </div>

      {/* Language Bottom Sheet / Dropdown */}
      {showLangMenu && (
        <div className="lang-menu-overlay" onClick={() => setShowLangMenu(false)}>
          <div className="lang-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="lang-menu-header">
              <h3>Select Language</h3>
              <button className="lang-menu-close" onClick={() => setShowLangMenu(false)}>✕</button>
            </div>
            <div className="lang-menu-list">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  className={`lang-menu-item ${selectedLanguage === l.id ? 'active' : ''}`}
                  onClick={() => {
                    onLanguageChange(l.id);
                    setShowLangMenu(false);
                  }}
                >
                  <span className="lang-icon">{l.icon}</span>
                  <span className="lang-label">{l.label}</span>
                  {selectedLanguage === l.id && (
                    <svg className="lang-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
