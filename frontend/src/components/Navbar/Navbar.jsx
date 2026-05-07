import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LANGUAGES } from '../../constants/languages';
import { useTheme } from '../../themes/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getThemeList } from '../../themes/themes';
import { HiOutlineUserCircle, HiOutlineLogout, HiOutlineClock, HiOutlineChevronDown, HiOutlineDotsVertical, HiOutlineShare, HiOutlineSparkles } from 'react-icons/hi';
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { themeName, setThemeName } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const themeMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  const lang = LANGUAGES.find((l) => l.id === selectedLanguage) || LANGUAGES[0];
  const themeList = getThemeList();

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setShowThemeMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isEditorPage = location.pathname === '/';

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
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
      </Link>

      {/* Center: Language Selector (Only on editor page) */}
      <div className="navbar-center">
        {isEditorPage && (
          <button
            className="language-selector-wrapper"
            onClick={() => setShowLangMenu(true)}
          >
            <span className="language-icon">{lang.icon}</span>
            <span className="language-selector-text">{lang.label}</span>
            <HiOutlineChevronDown className="select-chevron" />
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="navbar-actions">
        {/* Connection indicator - Hidden on very small screens */}
        {backendConnected === false && (
          <span className="connection-badge offline" title="Backend not connected">
            <span className="connection-dot" />
            Offline
          </span>
        )}

        {/* Desktop Actions (Hidden on Mobile) */}
        <div className="desktop-only-actions">
          {isEditorPage && (
            <>
              <button
                id="ai-panel-toggle"
                className={`btn-icon btn-ai ${aiPanelOpen ? 'active' : ''}`}
                onClick={onAIToggle}
                title="Toggle AI Assistant"
              >
                <AIIcon />
                <span>AI</span>
              </button>

              <button id="share-btn" className="btn-icon" title="Share code" onClick={onShare}>
                <ShareIcon />
              </button>
            </>
          )}

          <div className="navbar-divider" />

          {/* Theme Switcher */}
          <div className="theme-switcher-wrapper" ref={themeMenuRef}>
            <button
              className={`btn-icon ${showThemeMenu ? 'active' : ''}`}
              onClick={() => setShowThemeMenu(o => !o)}
              title="Change theme"
            >
              <PaletteIcon />
            </button>
            {showThemeMenu && (
              <div className="dropdown-menu theme-dropdown">
                <div className="dropdown-header">Theme</div>
                {themeList.map((t) => (
                  <button
                    key={t.id}
                    className={`dropdown-item ${themeName === t.id ? 'active' : ''}`}
                    onClick={() => {
                      setThemeName(t.id);
                      setShowThemeMenu(false);
                    }}
                  >
                    <span className="theme-option-preview" style={{ background: t.vars['--bg'], borderColor: t.vars['--primary'] }}>
                      <span className="theme-option-accent" style={{ background: t.vars['--primary'] }} />
                    </span>
                    <span className="theme-option-label">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="navbar-divider" />

          {/* Desktop Auth */}
          {user ? (
            <div className="user-profile-wrapper" ref={userMenuRef}>
              <button 
                className={`btn-profile ${showUserMenu ? 'active' : ''}`}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <HiOutlineChevronDown className="select-chevron" />
              </button>

              {showUserMenu && (
                <div className="dropdown-menu user-dropdown">
                  <div className="user-info">
                    <p className="user-name">{user.name}</p>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/history" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <HiOutlineClock />
                    <span>History</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={() => { logout(); setShowUserMenu(false); }}>
                    <HiOutlineLogout />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Run Button (Always Visible) */}
        {isEditorPage && (
          <button
            id="run-btn"
            className={`btn-run ${isRunning ? 'running' : ''}`}
            onClick={onRun}
            disabled={isRunning}
          >
            {isRunning ? <div className="spinner" /> : <RunIcon />}
            <span>{isRunning ? 'Running…' : 'Run'}</span>
          </button>
        )}

        {/* Mobile "More" Menu Button */}
        <div className="mobile-only-actions" ref={mobileMenuRef}>
          <button 
            className={`btn-icon mobile-menu-toggle ${showMobileMenu ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {user ? (
              <div className="user-avatar mini">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <HiOutlineDotsVertical />
            )}
          </button>

          {showMobileMenu && (
            <div className="dropdown-menu mobile-dropdown">
              {user && (
                <div className="user-info mobile">
                  <p className="user-name">{user.name}</p>
                  <p className="user-email">{user.email}</p>
                </div>
              )}
              
              <div className="dropdown-header">Actions</div>
              <button className="dropdown-item" onClick={() => { onAIToggle(); setShowMobileMenu(false); }}>
                <HiOutlineSparkles />
                <span>AI Assistant</span>
              </button>
              <button className="dropdown-item" onClick={() => { onShare(); setShowMobileMenu(false); }}>
                <HiOutlineShare />
                <span>Share Code</span>
              </button>
              
              <div className="dropdown-divider" />
              <div className="dropdown-header">Appearance</div>
              <div className="mobile-theme-list">
                {themeList.map((t) => (
                  <button
                    key={t.id}
                    className={`dropdown-item ${themeName === t.id ? 'active' : ''}`}
                    onClick={() => setThemeName(t.id)}
                  >
                    <span className="theme-option-preview" style={{ background: t.vars['--bg'], borderColor: t.vars['--primary'] }}>
                      <span className="theme-option-accent" style={{ background: t.vars['--primary'] }} />
                    </span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="dropdown-divider" />
              {user ? (
                <>
                  <Link to="/history" className="dropdown-item" onClick={() => setShowMobileMenu(false)}>
                    <HiOutlineClock />
                    <span>History</span>
                  </Link>
                  <button className="dropdown-item logout" onClick={() => { logout(); setShowMobileMenu(false); }}>
                    <HiOutlineLogout />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="mobile-auth-grid">
                  <Link to="/login" className="dropdown-item" onClick={() => setShowMobileMenu(false)}>Login</Link>
                  <Link to="/signup" className="dropdown-item" onClick={() => setShowMobileMenu(false)}>Sign Up</Link>
                </div>
              )}
            </div>
          )}
        </div>
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
