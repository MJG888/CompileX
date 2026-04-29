import React, { useRef, useEffect, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './CodeEditor.css';

// Detect mobile once
const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

// Custom dark theme definition
const defineThemes = (monaco) => {
  monaco.editor.defineTheme('compilex-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a7384', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c792ea', fontStyle: 'bold' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'type', foreground: '82aaff' },
      { token: 'function', foreground: '82aaff' },
      { token: 'variable', foreground: 'eeffff' },
      { token: 'operator', foreground: '89ddff' },
      { token: 'delimiter', foreground: '89ddff' },
      { token: 'identifier', foreground: 'eeffff' },
    ],
    colors: {
      'editor.background': '#0a0a0f',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#12121f',
      'editor.selectionBackground': '#7c3aed33',
      'editor.inactiveSelectionBackground': '#7c3aed1a',
      'editorLineNumber.foreground': '#3d4461',
      'editorLineNumber.activeForeground': '#7c3aed',
      'editorCursor.foreground': '#06d6a0',
      'editorGutter.background': '#0a0a0f',
      'editorWidget.background': '#1a1a2e',
      'editorWidget.border': '#2d2d4e',
      'editorSuggestWidget.background': '#1a1a2e',
      'editorSuggestWidget.border': '#2d2d4e',
      'editorSuggestWidget.selectedBackground': '#7c3aed22',
      'input.background': '#0d0d1a',
      'focusBorder': '#7c3aed',
      'scrollbarSlider.background': '#2d2d4e66',
      'scrollbarSlider.hoverBackground': '#7c3aed44',
      'scrollbarSlider.activeBackground': '#7c3aed66',
    },
  });

  monaco.editor.defineTheme('compilex-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a7384', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: 'e11d48' },
      { token: 'type', foreground: '6d28d9' },
      { token: 'function', foreground: '2563eb' },
    ],
    colors: {
      'editor.background': '#f8fafc',
      'editor.foreground': '#1e293b',
      'editor.lineHighlightBackground': '#f1f5f9',
      'editor.selectionBackground': '#7c3aed22',
      'editorLineNumber.foreground': '#94a3b8',
      'editorLineNumber.activeForeground': '#7c3aed',
      'editorCursor.foreground': '#7c3aed',
      'editorGutter.background': '#f8fafc',
    },
  });
};

export default function CodeEditor({ value, language, theme, onChange }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Register themes BEFORE mount to avoid flash
  const handleBeforeMount = (monaco) => {
    defineThemes(monaco);
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    window.monacoEditor = editor;

    // Apply custom font
    editor.updateOptions({
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    });

    // Mobile: focus handling for virtual keyboard
    if (isMobile) {
      editor.onDidFocusEditorText(() => {
        // Small delay to let keyboard animate
        setTimeout(() => editor.layout(), 300);
      });
    }
  };

  // Update theme reactively
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'compilex-dark' : 'compilex-light');
    }
  }, [theme]);

  // Memoize options to avoid unnecessary re-renders
  const editorOptions = useMemo(() => ({
    fontSize: isMobile ? 13 : 14,
    lineHeight: isMobile ? 20 : 22,
    minimap: { enabled: false },
    scrollBeyondLastLine: true,
    automaticLayout: true,
    fixedOverflowWidgets: true,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontLigatures: !isMobile,   // Ligatures can cause width calc issues on mobile

    // ─── CRITICAL: Paste fix ───
    formatOnPaste: false,       // Do NOT re-format pasted code
    autoIndent: 'keep',         // Preserve original indentation
    trimAutoWhitespace: false,  // Don't strip whitespace on paste

    // ─── Word Wrap & Indentation ───
    // Mobile: OFF — horizontal scroll is cleaner than staircase wrapping
    // Desktop: ON — nicer UX on wide screens
    wordWrap: isMobile ? 'off' : 'on',
    wrappingIndent: 'none',        // Wrapped lines start at column 0 (no staircase)
    wrappingStrategy: 'advanced',  // Smarter wrap-point decisions

    // ─── Scroll config ───
    mouseWheelZoom: !isMobile,
    smoothScrolling: true,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',       // Always show horizontal scroll for long lines
      useShadows: false,
      verticalScrollbarSize: isMobile ? 4 : 10,
      horizontalScrollbarSize: isMobile ? 4 : 10,
      verticalSliderSize: isMobile ? 4 : 10,
      horizontalSliderSize: isMobile ? 4 : 10,
    },

    // ─── Visual refinements ───
    renderLineHighlight: 'none',
    cursorStyle: 'line',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    contextmenu: !isMobile,     // Disable right-click menu on mobile (interferes with touch)
    selectOnLineNumbers: true,
    roundedSelection: true,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: false,
      indentation: false,
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    padding: { top: 12, bottom: 12 },
    lineNumbers: 'on',
    lineNumbersMinChars: isMobile ? 2 : 3,
    glyphMargin: false,
    folding: !isMobile,
    showFoldingControls: 'mouseover',
    links: true,
    colorDecorators: true,
    'semanticHighlighting.enabled': true,

    // ─── Mobile-specific ───
    ...(isMobile ? {
      lineDecorationsWidth: 4,       // Minimal gutter
      renderWhitespace: 'none',     // Cleaner on small screens
      tabSize: 4,                   // Consistent tab width
      detectIndentation: false,     // Force consistent tabs on paste
    } : {}),

    // ─── Autocomplete ───
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    parameterHints: { enabled: !isMobile },  // Skip param hints on mobile (too intrusive)
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
  }), []);

  const currentTheme = theme === 'dark' ? 'compilex-dark' : 'compilex-light';

  return (
    <div className="code-editor-wrapper">
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        theme={currentTheme}
        options={editorOptions}
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        onChange={onChange}
        loading={
          <div className="editor-loading">
            <div className="editor-loading-spinner" />
            <span>Loading Editor…</span>
          </div>
        }
      />
    </div>
  );
}
