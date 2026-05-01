import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../../constants/languages';
import { useTheme } from '../../themes/ThemeContext';
import { getThemeList } from '../../themes/themes';
import './Navbar.css';

const RunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
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

const PaletteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="10" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export default function Navbar({
  selectedLanguage,
  onLanguageChange,
  onRun,
  isRunning,
  onShare,
  onAIToggle,
  aiPanelOpen,
  version,
  backendConnected,
}) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { themeName, setThemeName } = useTheme();
  const themeMenuRef = useRef(null);
  const lang = LANGUAGES.find((l) => l.id === selectedLanguage) || LANGUAGES[0];
  const themeList = getThemeList();

  // Close theme menu on outside click
  useEffect(() => {
    if (!showThemeMenu) return;
    const handler = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showThemeMenu]);

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <div className="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#bolt)" />
            <defs>
              <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--teal)" />
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

        {/* Theme Switcher */}
        <div className="theme-switcher-wrapper" ref={themeMenuRef}>
          <button
            id="theme-toggle"
            className={`btn-icon btn-theme ${showThemeMenu ? 'active' : ''}`}
            onClick={() => setShowThemeMenu(o => !o)}
            title="Change theme"
          >
            <PaletteIcon />
          </button>
          {showThemeMenu && (
            <div className="theme-dropdown">
              <div className="theme-dropdown-header">Theme</div>
              {themeList.map((t) => (
                <button
                  key={t.id}
                  className={`theme-option ${themeName === t.id ? 'active' : ''}`}
                  onClick={() => {
                    setThemeName(t.id);
                    setShowThemeMenu(false);
                  }}
                >
                  <span className="theme-option-preview" style={{
                    background: t.vars['--bg'],
                    borderColor: t.vars['--primary'],
                  }}>
                    <span className="theme-option-accent" style={{ background: t.vars['--primary'] }} />
                  </span>
                  <span className="theme-option-label">{t.label}</span>
                  {themeName === t.id && (
                    <svg className="theme-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

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
