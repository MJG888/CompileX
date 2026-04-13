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
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [consoleSize, setConsoleSize] = useState(35); // % of vertical split
  const isDragging = useRef(false);
  const containerRef = useRef(null);

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

  const setCode = (newContent) => {
    setFilesByLang(prev => {
      const langFiles = [...prev[selectedLanguage]];
      const idx = langFiles.findIndex(f => f.name === activeFile.name);
      if (idx !== -1) {
        langFiles[idx] = { ...langFiles[idx], content: newContent };
      }
      return { ...prev, [selectedLanguage]: langFiles };
    });
  };

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
        language_id: lang.judge0Id 
    });
  }, [activeLangFiles, activeFileName, selectedLanguage, isRunning]);

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
  }, []);

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

  // Draggable divider for resizing panels
  const handleDividerMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = ((ev.clientY - rect.top) / rect.height) * 100;
      const clamped = Math.min(Math.max(ratio, 20), 80);
      setConsoleSize(100 - clamped);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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
      <div className="app-body">
        {/* Editor + Console column */}
        <div className="editor-area" ref={containerRef}>
          {/* File Tabs UI & Monaco Editor */}
          <div className="editor-pane-container" style={{ height: `${100 - consoleSize}%` }}>
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
            <div className="editor-pane" style={{ flex: 1 }}>
              <CodeEditor
                value={code}
                language={getLanguageById(selectedLanguage).monacoId}
                theme={theme}
                onChange={(val) => setCode(val || '')}
              />
            </div>
          </div>

          {/* Draggable Divider */}
          <div className="panel-divider" onMouseDown={handleDividerMouseDown}>
            <div className="divider-handle">
              <span /><span /><span />
            </div>
          </div>

          {/* Output Console */}
          <div className="console-pane" style={{ height: `${consoleSize}%` }}>
            <Console
              terminalData={terminalData}
              result={result}
              isRunning={isRunning}
              isInteractive={isInteractive}
              onSendInput={handleTerminalInput}
              onStop={handleStop}
            />
          </div>
        </div>

        {/* AI Panel */}
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

      {/* Status Bar */}
      <StatusBar
        selectedLanguage={selectedLanguage}
        linesCount={lineCount}
        charCount={code.length}
      />
    </div>
  );
}
