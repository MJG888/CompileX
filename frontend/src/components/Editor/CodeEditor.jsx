import React, { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './CodeEditor.css';

// Custom dark theme definition
const defineTheme = (monaco) => {
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
    ],
    colors: {
      'editor.background': '#0d0d1a',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#1a1a2e',
      'editor.selectionBackground': '#7c3aed33',
      'editor.inactiveSelectionBackground': '#7c3aed1a',
      'editorLineNumber.foreground': '#3d4461',
      'editorLineNumber.activeForeground': '#7c3aed',
      'editorCursor.foreground': '#06d6a0',
      'editorGutter.background': '#0d0d1a',
      'editorWidget.background': '#1a1a2e',
      'editorWidget.border': '#2d2d4e',
      'editorSuggestWidget.background': '#1a1a2e',
      'editorSuggestWidget.border': '#2d2d4e',
      'editorSuggestWidget.selectedBackground': '#7c3aed22',
      'input.background': '#0d0d1a',
      'focusBorder': '#7c3aed',
      'scrollbarSlider.background': '#2d2d4e99',
      'scrollbarSlider.hoverBackground': '#7c3aed44',
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

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    window.monacoEditor = editor; // Stability fix: Expose for resize recalculation
    defineTheme(monaco);
    monaco.editor.setTheme(theme === 'dark' ? 'compilex-dark' : 'compilex-light');

    // Custom font
    editor.updateOptions({ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" });
  };

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'compilex-dark' : 'compilex-light');
    }
  }, [theme]);

  const editorOptions = {
    fontSize: 14,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    theme: theme === 'dark' ? 'vs-dark' : 'vs-light',
    fontFamily: 'JetBrains Mono, monospace',
    mouseWheelZoom: true,
    smoothScrolling: true,
    wordWrap: 'off',
    lineNumbersMinChars: 3,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    renderLineHighlight: 'all',
    cursorStyle: 'line',
    cursorBlinking: 'smooth',
    contextmenu: true,
    selectOnLineNumbers: true,
    roundedSelection: true,
    bracketPairColorization: { enabled: true },
    padding: { top: 16, bottom: 16 },
    lineNumbers: 'on',
    glyphMargin: false,
    folding: true,
    showFoldingControls: 'mouseover',
    links: true,
    colorDecorators: true,
    'semanticHighlighting.enabled': true,
    formatOnPaste: true,
    autoIndent: 'full',
    detectIndentation: true,
    trimAutoWhitespace: true
  };

  return (
    <div className="code-editor-wrapper">
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        theme={theme === 'dark' ? 'compilex-dark' : 'compilex-light'}
        options={editorOptions}
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
