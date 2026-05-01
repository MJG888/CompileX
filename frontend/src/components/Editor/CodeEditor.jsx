import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';
import { THEMES } from '../../themes/themes';
import './CodeEditor.css';

// ─── Optimize Monaco Loading ───
// Use a more reliable CDN and pre-fetch
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs'
  },
});

// Detect mobile once
const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

// ─── Register ALL custom Monaco themes ───
const defineThemes = (monaco) => {
  Object.values(THEMES).forEach((themeObj) => {
    monaco.editor.defineTheme(themeObj.monacoTheme, themeObj.monaco);
  });
};

/**
 * Normalize line endings: convert \r\n and \r to \n.
 * Prevents indentation breaking on paste (especially mobile browsers
 * that send Windows-style line endings).
 */
function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export default function CodeEditor({ value, language, themeName, onChange }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Resolve the Monaco theme name from the current UI theme
  const currentTheme = useMemo(() => {
    const themeObj = THEMES[themeName];
    return themeObj ? themeObj.monacoTheme : 'compilex-warm-dark';
  }, [themeName]);

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

    // ─── PASTE FIX: Normalize line endings on paste ───
    // Intercept clipboard paste before Monaco processes it
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      editorDomNode.addEventListener('paste', (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const text = clipboardData.getData('text/plain');
        if (!text) return;

        const normalized = normalizeLineEndings(text);

        // ─── CRITICAL FIX: ALWAYS intercept paste ───
        // By preventing default, we stop Monaco's built-in paste logic from
        // trying to "helpfully" auto-indent, which is what causes the "slanting"
        // effect on already-indented code.
        e.preventDefault();
        e.stopPropagation();

        // Use Monaco's executeEdits to insert the text manually.
        // This bypasses indentation rules and preserves the clipboard's exact formatting.
        const selection = editor.getSelection();
        if (selection) {
          editor.executeEdits('paste-manual', [{
            range: selection,
            text: normalized,
            forceMoveMarkers: true,
          }]);
        }
      }, true); // Capture phase to fire before Monaco's handler
    }

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
      monacoRef.current.editor.setTheme(currentTheme);
    }
  }, [currentTheme]);

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

    // ─── CRITICAL: Paste fix settings ───
    formatOnPaste: false,        // Do NOT re-format pasted code
    autoIndent: 'none',          // Don't auto-indent (prevents paste formatting issues)
    trimAutoWhitespace: false,   // Don't strip whitespace on paste
    detectIndentation: false,    // Force consistent indentation (don't guess from pasted code)
    tabSize: 4,                  // Consistent tab width globally

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
      alwaysConsumeMouseWheel: false, // Allow scroll to pass through on mobile
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
