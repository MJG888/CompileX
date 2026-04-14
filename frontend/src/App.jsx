import React, { useState, useCallback, useRef, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import CodeEditor from './components/Editor/CodeEditor';
import Console from './components/Console/Console';
import AIPanel from './components/AIPanel/AIPanel';
import StatusBar from './components/StatusBar/StatusBar';
import { LANGUAGES, getLanguageById } from './constants/languages';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000', { autoConnect: false });

// Initialize files grouped by language to avoid template overwrite bug
const initialFiles = LANGUAGES.reduce((acc, lang) => {
  const ext = lang.id === 'python' ? '.py' : lang.id === 'javascript' ? '.js' : lang.id === 'cpp' ? '.cpp' : lang.id === 'c' ? '.c' : '.java';
  const mainName = lang.id === 'java' ? 'Main.java' : 'main' + ext;
  acc[lang.id] = [{ name: mainName, content: lang.defaultCode }];
  return acc;
}, {});

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  
  const [filesByLang, setFilesByLang] = useState(initialFiles);
  const [activeFileName, setActiveFileName] = useState('main.py');
  const [terminalData, setTerminalData] = useState([]);
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [stdin, setStdin] = useState('');
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [verticalSplit, setVerticalSplit] = useState(70); // % for Editor (0-100)
  const [horizontalSplit, setHorizontalSplit] = useState(25); // % for AI Panel (0-100)
  const isDraggingVertical = useRef(false);
  const isDraggingHorizontal = useRef(false);
  const bodyRef = useRef(null);
  const containerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  // Derived active file properties
  const activeLangFiles = filesByLang[selectedLanguage] || [];
  const activeFile = activeLangFiles.find(f => f.name === activeFileName) || activeLangFiles[0];
  const code = activeFile ? activeFile.content : '';

  // Synchronize active file on language change
  useEffect(() => {
    const defaultFiles = filesByLang[selectedLanguage];
    if (defaultFiles && defaultFiles.length > 0) {
      setActiveFileName(defaultFiles[0].name);
    }
  }, [selectedLanguage]);

  const setCode = useCallback((newContent) => {
    setFilesByLang(prev => {
      const currentFiles = prev[selectedLanguage];
      if (!currentFiles || currentFiles.length === 0) return prev;
      
      const idx = currentFiles.findIndex(f => f.name === activeFileName);
      if (idx === -1) return prev;
      
      const updatedFiles = [...currentFiles];
      updatedFiles[idx] = { ...updatedFiles[idx], content: newContent };
      
      return { ...prev, [selectedLanguage]: updatedFiles };
    });
  }, [selectedLanguage, activeFileName]);

  const handleAddFile = () => {
    const name = prompt('Enter new file name:');
    if (!name?.trim()) return;
    if (activeLangFiles.some(f => f.name === name)) {
      alert('File already exists.');
      return;
    }
    setFilesByLang(prev => ({
      ...prev,
      [selectedLanguage]: [...prev[selectedLanguage], { name, content: '' }]
    }));
    setActiveFileName(name);
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

  // Setup WebSockets
  useEffect(() => {
    socket.connect();
    
    socket.on('terminal_output', data => {
      setTerminalData(prev => [...prev, { type: 'output', text: data }]);
    });
    
    socket.on('terminal_error', data => {
      setTerminalData(prev => [...prev, { type: 'error', text: data }]);
    });
    
    socket.on('execution_complete', data => {
      setIsRunning(false);
      setIsInteractive(false);
      setResult(data);
    });

    return () => {
      socket.off('terminal_output');
      socket.off('terminal_error');
      socket.off('execution_complete');
    };
  }, []);

  // Language switch
  const handleLanguageChange = (langId) => {
    setSelectedLanguage(langId);
    setResult(null);
    setTerminalData([]);
  };

  // Run code via WebSocket
  const handleRun = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setIsInteractive(true);
    setResult(null);
    setTerminalData([]); // clear previous output

    const encode = (str) => btoa(unescape(encodeURIComponent(str)));
    const encodedFiles = activeLangFiles.map(f => ({
      name: f.name,
        content: encode(f.content)
    }));

    const lang = getLanguageById(selectedLanguage);
    socket.emit('execute', { 
        files: encodedFiles, 
        main_file: activeFileName, 
        language_id: lang.judge0Id,
        stdin: encode(stdin || '')
    });
  }, [activeLangFiles, activeFileName, selectedLanguage, isRunning, stdin]);

  const handleStop = useCallback(() => {
    socket.emit('stop');
  }, []);

  const handleTerminalInput = useCallback((text) => {
    socket.emit('input', text);
    setTerminalData(prev => [...prev, { type: 'input', text: text + '\n' }]);
  }, []);

  // AI insert code into editor
  const handleInsertCode = useCallback((insertedCode) => {
    setCode(insertedCode);
    setAIPanelOpen(false); // Mobile UX: Close drawer after insertion
  }, [setCode]);

  // Keyboard shortcut: Ctrl+Enter to run
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun]
  );

  // Stability fix: Recalculate Monaco layout when panels resize
  useEffect(() => {
    // We use a small timeout to let the DOM settle before layout recalculation
    const timer = setTimeout(() => {
      if (window.monacoEditor) {
        window.monacoEditor.layout();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [verticalSplit, horizontalSplit, aiPanelOpen]);

  // Vertical resize: Editor vs Console
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
      const clamped = Math.min(Math.max(percentage, 15), 85);
      setVerticalSplit(clamped);
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

  // Horizontal resize: Main Area vs AI Panel
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
      const clamped = Math.min(Math.max(percentage, 15), 50);
      setHorizontalSplit(clamped);
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

  return (
    <div
      className={`app ${theme}`}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Navbar */}
      <Navbar
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        isRunning={isRunning}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onAIToggle={() => setAIPanelOpen((o) => !o)}
        aiPanelOpen={aiPanelOpen}
      />

      {/* Main layout */}
      <div className={`app-body ${isResizing ? 'resizing' : ''}`} ref={bodyRef}>
        {/* Editor + Console column */}
        <div className="editor-area" ref={containerRef} style={{ flex: aiPanelOpen ? (100 - horizontalSplit) : 100 }}>
          {/* Editor Pane (Flex basis) */}
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
                    <span
                      className="file-tab-close"
                      title="Delete file"
                      onClick={(e) => handleDeleteFile(e, f.name)}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
              <button className="add-file-btn" onClick={handleAddFile} title="Add new file">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            <div className="editor-pane">
              <CodeEditor
                value={code}
                language={getLanguageById(selectedLanguage).monacoId}
                theme={theme}
                onChange={(val) => setCode(val || '')}
              />
            </div>
          </div>

          {/* Draggable Vertical Divider */}
          <div className="panel-divider vertical" onMouseDown={handleVerticalDividerMouseDown} onTouchStart={handleVerticalDividerMouseDown}>
            <div className="divider-handle">
              <span /><span /><span />
            </div>
          </div>

          {/* Output Console (Flex fill) */}
          <div className="console-pane" style={{ flex: 1, minHeight: '80px' }}>
            <Console
              terminalData={terminalData}
              result={result}
              isRunning={isRunning}
              isInteractive={isInteractive}
              stdin={stdin}
              onStdinChange={setStdin}
              onSendInput={handleTerminalInput}
              onStop={handleStop}
            />
          </div>
        </div>

        {/* Draggable Horizontal Divider (only if AI open) */}
        {aiPanelOpen && (
          <div className="panel-divider horizontal" onMouseDown={handleHorizontalDividerMouseDown} onTouchStart={handleHorizontalDividerMouseDown}>
            <div className="divider-handle">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* AI Panel (Drawer on mobile) */}
        <div className={`ai-panel-wrapper ${aiPanelOpen ? 'open' : ''}`} style={{ flex: aiPanelOpen ? `0 0 ${horizontalSplit}%` : '0 0 0' }}>
          {aiPanelOpen && (
            <AIPanel
               isOpen={aiPanelOpen}
               code={code}
               files={activeLangFiles}
               language={selectedLanguage}
               execError={execError}
               onInsertCode={handleInsertCode}
               onClose={() => setAIPanelOpen(false)}
            />
          )}
        </div>

        {/* Global Transparent Overlay during resize to catch all mouse events */}
        {isResizing && <div className="resizing-overlay" />}
      </div>

      {/* Status Bar */}
      <StatusBar
        selectedLanguage={selectedLanguage}
        linesCount={lineCount}
        charCount={code.length}
      />
    </div>
  );
}
