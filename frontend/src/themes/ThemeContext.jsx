import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY, getTheme } from './themes';

const ThemeContext = createContext(null);

/**
 * Apply a theme's CSS custom properties to document.documentElement.
 * This makes var(--accent), var(--bg), etc. available everywhere.
 */
function applyThemeToDOM(theme) {
  const root = document.documentElement;

  // Set data-theme attribute for CSS selectors
  root.setAttribute('data-theme', theme.id);

  // Inject every CSS variable from the theme
  Object.entries(theme.vars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
}

/**
 * Read persisted theme from localStorage, with validation.
 */
function getPersistedTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEMES[stored]) return stored;
  } catch {
    // localStorage may throw in incognito/restricted contexts
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState(getPersistedTheme);

  const theme = useMemo(() => getTheme(themeName), [themeName]);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Persist to localStorage
  const setThemeName = useCallback((name) => {
    if (!THEMES[name]) return;
    setThemeNameState(name);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, name);
    } catch {
      // Silently fail if storage is unavailable
    }
  }, []);

  const value = useMemo(() => ({
    theme,         // Full theme object (vars, monaco definition, etc.)
    themeName,     // Current theme id string
    setThemeName,  // Setter function
    themes: THEMES,
  }), [theme, themeName, setThemeName]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the theme context.
 * Returns { theme, themeName, setThemeName, themes }
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
