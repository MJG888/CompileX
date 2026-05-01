import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar/Navbar';
import CodeEditor from './components/Editor/CodeEditor';
import Console from './components/Console/Console';
import StatusBar from './components/StatusBar/StatusBar';
import { LANGUAGES, getLanguageById } from './constants/languages';
import { useTheme } from './themes/ThemeContext';
import { io } from 'socket.io-client';
import './App.css';

// Lazy-load AI Panel for performance
const AIPanel = lazy(() => import('./components/AIPanel/AIPanel'));

// ─── Mobile Detection ───
const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

// ─── Viewport Height Fix ───
// Only recalculate on orientation change, not keyboard open/close
let lastOrientation = typeof screen !== 'undefined' ? screen.orientation?.angle : 0;

const setVH = () => {
  if (typeof window === 'undefined') return;
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

if (typeof window !== 'undefined') {
  setVH();
  // Debounced resize — only on orientation change
  let resizeTimer;
  window.addEventListener('resize', () => {
    const newOrientation = screen.orientation?.angle ?? 0;
    if (newOrientation !== lastOrientation) {
      lastOrientation = newOrientation;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setVH, 150);
    }
  });
}

// ─── Socket Connection ───
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// ─── Initial Files per Language ───
const initialFiles = LANGUAGES.reduce((acc, lang) => {
  const ext = lang.id === 'python' ? '.py' : lang.id === 'javascript' ? '.js' : lang.id === 'cpp' ? '.cpp' : lang.id === 'c' ? '.c' : '.java';
  const mainName = lang.id === 'java' ? 'Main.java' : 'main' + ext;
  acc[lang.id] = [{ name: mainName, content: lang.defaultCode }];
  return acc;
}, {});

export default function App() {
  const { theme, themeName, setThemeName } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  const [filesByLang, setFilesByLang] = useState(initialFiles);
  const [activeFileName, setActiveFileName] = useState('main.py');
  const [terminalData, setTerminalData] = useState([]);
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [stdin, setStdin] = useState('');
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [verticalSplit, setVerticalSplit] = useState(65);
  const [horizontalSplit, setHorizontalSplit] = useState(28);
  const [mobileTab, setMobileTab] = useState('output'); // 'output' | 'input' | 'ai'
  const isDraggingVertical = useRef(false);
  const isDraggingHorizontal = useRef(false);
  const bodyRef = useRef(null);
  const editorContainerRef = useRef(null);
  const containerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef(null);
  const APP_VERSION = '2.0.0';

  // ─── Derived State ───
  const activeLangFiles = filesByLang[selectedLanguage] || [];
  const activeFile = activeLangFiles.find(f => f.name === activeFileName) || activeLangFiles[0];
  const code = activeFile ? activeFile.content : '';

  // Sync active file on language change
  useEffect(() => {
    const defaultFiles = filesByLang[selectedLanguage];
    if (defaultFiles?.length > 0) {
      setActiveFileName(defaultFiles[0].name);
    }
  }, [selectedLanguage]);

  const setCode = useCallback((newContent) => {
    setFilesByLang(prev => {
      const currentFiles = prev[selectedLanguage];
      if (!currentFiles?.length) return prev;

      const idx = currentFiles.findIndex(f => f.name === activeFileName);
      if (idx === -1) return prev;

      const updatedFiles = [...currentFiles];
      updatedFiles[idx] = { ...updatedFiles[idx], content: newContent };

      return { ...prev, [selectedLanguage]: updatedFiles };
    });
  }, [selectedLanguage, activeFileName]);

  // ─── File Management ───
  const handleAddFile = () => {
    setIsAddingFile(true);
    setNewFileName('');
    setTimeout(() => newFileInputRef.current?.focus(), 50);
  };

  const handleNewFileSubmit = () => {
    const name = newFileName.trim();
    setIsAddingFile(false);
    setNewFileName('');
    if (!name) return;
    if (activeLangFiles.some(f => f.name === name)) return;
    setFilesByLang(prev => ({
      ...prev,
      [selectedLanguage]: [...prev[selectedLanguage], { name, content: '' }],
    }));
    setActiveFileName(name);
  };

  const handleNewFileKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleNewFileSubmit(); }
    if (e.key === 'Escape') { setIsAddingFile(false); setNewFileName(''); }
  };

  const handleDeleteFile = (e, name) => {
    e.stopPropagation();
    if (activeLangFiles.length === 1) return;
    setFilesByLang(prev => {
      const newFiles = prev[selectedLanguage].filter(f => f.name !== name);
      return { ...prev, [selectedLanguage]: newFiles };
    });
    if (activeFileName === name) setActiveFileName(activeLangFiles[0].name);
  };

  // ─── WebSocket Setup ───
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setBackendConnected(true);
    });

    socket.on('disconnect', () => {
      setBackendConnected(false);
    });

    socket.on('connect_error', (err) => {
      setBackendConnected(false);
      console.warn('Socket connection error:', err.message);
    });

    socket.on('compilation_start', () => {
      setIsCompiling(true);
    });

    socket.on('compilation_complete', () => {
      setIsCompiling(false);
    });

    socket.on('terminal_output', data => {
      setTerminalData(prev => {
        // Cap at 5000 entries to prevent memory leak
        const next = [...prev, { type: 'output', text: data }];
        return next.length > 5000 ? next.slice(-5000) : next;
      });
    });

    socket.on('terminal_error', data => {
      setTerminalData(prev => {
        const next = [...prev, { type: 'error', text: data }];
        return next.length > 5000 ? next.slice(-5000) : next;
      });
    });

    socket.on('execution_complete', data => {
      setIsRunning(false);
      setIsCompiling(false);
      setIsInteractive(false);
      setResult(data);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('compilation_start');
      socket.off('compilation_complete');
      socket.off('terminal_output');
      socket.off('terminal_error');
      socket.off('execution_complete');
    };
  }, []);

  // ─── Language Switching ───
  const handleLanguageChange = (langId) => {
    setSelectedLanguage(langId);
    setResult(null);
    setTerminalData([]);
  };

  // ─── Execution ───
  const handleRun = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setIsInteractive(true);
    setResult(null);
    setTerminalData([]);

    // Switch to output tab on mobile
    if (isMobile) setMobileTab('output');

    const encode = (str) => btoa(unescape(encodeURIComponent(str)));
    const encodedFiles = activeLangFiles.map(f => ({
      name: f.name,
      content: encode(f.content),
    }));

    const lang = getLanguageById(selectedLanguage);
    socket.emit('execute', {
      files: encodedFiles,
      main_file: activeFileName,
      language_id: lang.judge0Id,
      stdin: encode(stdin || ''),
    });
  }, [activeLangFiles, activeFileName, selectedLanguage, isRunning, stdin]);

  const handleStop = useCallback(() => {
    socket.emit('stop');
  }, []);

  const handleTerminalInput = useCallback((text) => {
    socket.emit('input', text);
    setTerminalData(prev => [...prev, { type: 'input', text: text + '\n' }]);
  }, []);

  // ─── AI: Insert Code into Editor ───
  const handleInsertCode = useCallback((insertedCode) => {
    setCode(insertedCode);
    if (isMobile) {
      setAIPanelOpen(false);
      setMobileTab('editor');
    }
  }, [setCode]);

  // ─── Share Code ───
  const handleShare = async () => {
    try {
      if (navigator.share && isMobile) {
        await navigator.share({
          title: `CompileX Code Snippet`,
          text: code,
        });
      } else {
        await navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing code:', err);
    }
  };

  // ─── Keyboard Shortcuts ───
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun]
  );

  // ─── ResizeObserver for Monaco ───
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (window.monacoEditor) {
        window.monacoEditor.layout();
      }
    });

    observer.observe(editorContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // ─── Vertical Divider (Editor ↕ Console) ───
  const handleVerticalDividerMouseDown = (e) => {
    if (e.type === 'mousedown') e.preventDefault();
    isDraggingVertical.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const getClientY = (ev) => ev.touches ? ev.touches[0].clientY : ev.clientY;

    const onMove = (ev) => {
      if (!isDraggingVertical.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = getClientY(ev);
      const percentage = ((y - rect.top) / rect.height) * 100;
      setVerticalSplit(Math.min(Math.max(percentage, 20), 85));
    };

    const onEnd = () => {
      isDraggingVertical.current = false;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  // ─── Horizontal Divider (Main ↔ AI Panel) ───
  const handleHorizontalDividerMouseDown = (e) => {
    if (e.type === 'mousedown') e.preventDefault();
    isDraggingHorizontal.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const getClientX = (ev) => ev.touches ? ev.touches[0].clientX : ev.clientX;

    const onMove = (ev) => {
      if (!isDraggingHorizontal.current || !bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      const x = getClientX(ev);
      const percentage = ((rect.right - x) / rect.width) * 100;
      setHorizontalSplit(Math.min(Math.max(percentage, 18), 50));
    };

    const onEnd = () => {
      isDraggingHorizontal.current = false;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const execError = result ? (result.stderr || result.compile_output || '') : '';
  const lineCount = code.split('\n').length;

  // ─── Mobile Tab-based Layout ───
  if (isMobile) {
    return (
      <div className="app" data-theme={themeName} onKeyDown={handleKeyDown} tabIndex={-1}>
        <Navbar
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          onRun={handleRun}
          isRunning={isRunning}
          onShare={handleShare}
          onAIToggle={() => {
            setAIPanelOpen(o => !o);
            setMobileTab(aiPanelOpen ? 'output' : 'ai');
          }}
          aiPanelOpen={aiPanelOpen || mobileTab === 'ai'}
          version={APP_VERSION}
          backendConnected={backendConnected}
        />

        {/* Mobile Content Area */}
        <div className="mobile-content">
          {/* Top 60%: Editor always visible */}
          <div className="mobile-editor-section">
            <div className="file-tabs">
              {activeLangFiles.map(f => (
                <button
                  key={f.name}
                  className={`file-tab ${activeFileName === f.name ? 'active' : ''}`}
                  onClick={() => setActiveFileName(f.name)}
                >
                  {f.name}
                  {activeLangFiles.length > 1 && (
                    <span className="file-tab-close" title="Delete file" onClick={(e) => handleDeleteFile(e, f.name)}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
              {isAddingFile && (
                <div className="file-tab new-file-tab">
                  <input
                    ref={newFileInputRef}
                    type="text"
                    className="new-file-input"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onBlur={handleNewFileSubmit}
                    onKeyDown={handleNewFileKeyDown}
                    placeholder="name..."
                  />
                </div>
              )}
              <button className="add-file-btn" onClick={handleAddFile} title="Add new file">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            <div className="editor-pane" ref={editorContainerRef}>
              <CodeEditor
                value={code}
                language={getLanguageById(selectedLanguage).monacoId}
                themeName={themeName}
                onChange={(val) => setCode(val || '')}
              />
            </div>
          </div>

          {/* Bottom 40%: Output / Input / AI */}
          <div className="mobile-bottom-section">
            <div className="mobile-tab-bar">
              <button
                className={`mobile-tab-btn ${mobileTab === 'output' ? 'active' : ''}`}
                onClick={() => setMobileTab('output')}
              >
                <span>Output</span>
                {isRunning && <span className="mobile-tab-dot running" />}
              </button>
              <button
                className={`mobile-tab-btn ${mobileTab === 'input' ? 'active' : ''}`}
                onClick={() => setMobileTab('input')}
              >
                <span>Input</span>
              </button>
              <button
                className={`mobile-tab-btn ${mobileTab === 'ai' ? 'active' : ''}`}
                onClick={() => { setMobileTab('ai'); setAIPanelOpen(true); }}
              >
                <span>AI</span>
              </button>
            </div>

            <div className="mobile-bottom-content">
              {/* Output Tab */}
              <div className={`mobile-panel ${mobileTab === 'output' ? 'active' : ''}`}>
                <Console
                  terminalData={terminalData}
                  result={result}
                  isRunning={isRunning}
                  isCompiling={isCompiling}
                  isInteractive={isInteractive}
                  stdin={stdin}
                  onStdinChange={setStdin}
                  onSendInput={handleTerminalInput}
                  onStop={handleStop}
                  mobileForcedTab="output"
                />
              </div>

              {/* Input Tab */}
              <div className={`mobile-panel ${mobileTab === 'input' ? 'active' : ''}`}>
                <Console
                  terminalData={terminalData}
                  result={result}
                  isRunning={isRunning}
                  isCompiling={isCompiling}
                  isInteractive={isInteractive}
                  stdin={stdin}
                  onStdinChange={setStdin}
                  onSendInput={handleTerminalInput}
                  onStop={handleStop}
                  mobileForcedTab="input"
                />
              </div>

              {/* AI Tab */}
              <div className={`mobile-panel ${mobileTab === 'ai' ? 'active' : ''}`}>
                <Suspense fallback={<div className="ai-loading">Loading AI…</div>}>
                  <AIPanel
                    isOpen={mobileTab === 'ai'}
                    code={code}
                    files={activeLangFiles}
                    language={selectedLanguage}
                    execError={execError}
                    onInsertCode={handleInsertCode}
                    onClose={() => { setAIPanelOpen(false); setMobileTab('output'); }}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        <StatusBar selectedLanguage={selectedLanguage} linesCount={lineCount} charCount={code.length} connected={backendConnected} />
      </div>
    );
  }

  // ─── Desktop Layout ───
  return (
    <div className="app" data-theme={themeName} onKeyDown={handleKeyDown} tabIndex={-1}>
      <Navbar
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        isRunning={isRunning}
        onShare={handleShare}
        onAIToggle={() => setAIPanelOpen(o => !o)}
        aiPanelOpen={aiPanelOpen}
        version={APP_VERSION}
        backendConnected={backendConnected}
      />

      <div className={`app-body ${isResizing ? 'resizing' : ''}`} ref={bodyRef}>
        {/* Editor + Console Column */}
        <div className="editor-area" ref={containerRef} style={{ flex: aiPanelOpen ? (100 - horizontalSplit) : 100 }}>
          {/* Editor Pane */}
          <div className="editor-pane-container" style={{ flex: `0 0 ${verticalSplit}%`, minHeight: '100px' }}>
            <div className="file-tabs">
              {activeLangFiles.map(f => (
                <button
                  key={f.name}
                  className={`file-tab ${activeFileName === f.name ? 'active' : ''}`}
                  onClick={() => setActiveFileName(f.name)}
                >
                  {f.name}
                  {activeLangFiles.length > 1 && (
                    <span className="file-tab-close" title="Delete file" onClick={(e) => handleDeleteFile(e, f.name)}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
              {isAddingFile && (
                <div className="file-tab new-file-tab">
                  <input
                    ref={newFileInputRef}
                    type="text"
                    className="new-file-input"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onBlur={handleNewFileSubmit}
                    onKeyDown={handleNewFileKeyDown}
                    placeholder="filename.ext"
                  />
                </div>
              )}
              <button className="add-file-btn" onClick={handleAddFile} title="Add new file">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            <div className="editor-pane" ref={editorContainerRef}>
              <CodeEditor
                value={code}
                language={getLanguageById(selectedLanguage).monacoId}
                themeName={themeName}
                onChange={(val) => setCode(val || '')}
              />
            </div>
          </div>

          {/* Vertical Divider */}
          <div
            className="panel-divider vertical"
            onMouseDown={handleVerticalDividerMouseDown}
            onTouchStart={handleVerticalDividerMouseDown}
            style={{ touchAction: 'none' }}
          >
            <div className="divider-handle"><span /><span /><span /></div>
          </div>

          {/* Console Pane */}
          <div className="console-pane" style={{ flex: 1, minHeight: '80px' }}>
            <Console
              terminalData={terminalData}
              result={result}
              isRunning={isRunning}
              isCompiling={isCompiling}
              isInteractive={isInteractive}
              stdin={stdin}
              onStdinChange={setStdin}
              onSendInput={handleTerminalInput}
              onStop={handleStop}
            />
          </div>
        </div>

        {/* Horizontal Divider */}
        {aiPanelOpen && (
          <div
            className="panel-divider horizontal"
            onMouseDown={handleHorizontalDividerMouseDown}
            onTouchStart={handleHorizontalDividerMouseDown}
            style={{ touchAction: 'none' }}
          >
            <div className="divider-handle"><span /><span /><span /></div>
          </div>
        )}

        {/* AI Panel */}
        <div className={`ai-panel-wrapper ${aiPanelOpen ? 'open' : ''}`} style={{ flex: aiPanelOpen ? `0 0 ${horizontalSplit}%` : '0 0 0' }}>
          {aiPanelOpen && (
            <Suspense fallback={<div className="ai-loading">Loading AI…</div>}>
              <AIPanel
                isOpen={aiPanelOpen}
                code={code}
                files={activeLangFiles}
                language={selectedLanguage}
                execError={execError}
                onInsertCode={handleInsertCode}
                onClose={() => setAIPanelOpen(false)}
              />
            </Suspense>
          )}
        </div>

        {/* Resize Overlay */}
        {isResizing && <div className="resizing-overlay" />}
      </div>

      <StatusBar selectedLanguage={selectedLanguage} linesCount={lineCount} charCount={code.length} connected={backendConnected} />
    </div>
  );
}
