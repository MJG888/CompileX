import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import Navbar from './components/Navbar/Navbar';
import CodeEditor from './components/Editor/CodeEditor';
import Console from './components/Console/Console';
import StatusBar from './components/StatusBar/StatusBar';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import History from './pages/History/History';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LANGUAGES, getLanguageById } from './constants/languages';
import { useTheme } from './themes/ThemeContext';
import { io } from 'socket.io-client';
import './App.css';

const AIPanel = lazy(() => import('./components/AIPanel/AIPanel'));

const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL, {
  autoConnect: false,
  reconnection: true,
});

const initialFiles = LANGUAGES.reduce((acc, lang) => {
  const ext = lang.id === 'python' ? '.py' : lang.id === 'javascript' ? '.js' : lang.id === 'cpp' ? '.cpp' : lang.id === 'c' ? '.c' : '.java';
  const mainName = lang.id === 'java' ? 'Main.java' : 'main' + ext;
  acc[lang.id] = [{ name: mainName, content: lang.defaultCode }];
  return acc;
}, {});

// ─── Main Editor Component ───
const IDE = () => {
  const { themeName } = useTheme();
  const { user } = useAuth();
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
  const [mobileTab, setMobileTab] = useState('output');
  const [isResizing, setIsResizing] = useState(false);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const isDraggingVertical = useRef(false);
  const isDraggingHorizontal = useRef(false);
  const bodyRef = useRef(null);
  const editorContainerRef = useRef(null);
  const containerRef = useRef(null);
  const newFileInputRef = useRef(null);
  const APP_VERSION = '2.1.0';

  const activeLangFiles = filesByLang[selectedLanguage] || [];
  const activeFile = activeLangFiles.find(f => f.name === activeFileName) || activeLangFiles[0];
  const code = activeFile ? activeFile.content : '';

  // ─── Restore from History Logic ───
  useEffect(() => {
    const restore = localStorage.getItem('compilex_restore');
    if (restore) {
      try {
        const { language, files, stdin: oldStdin } = JSON.parse(restore);
        setSelectedLanguage(language);
        setFilesByLang(prev => ({ ...prev, [language]: files }));
        setActiveFileName(files[0]?.name || '');
        setStdin(oldStdin || '');
        toast.success('Restored code from history');
      } catch (err) {
        console.error('Restore failed', err);
      }
      localStorage.removeItem('compilex_restore');
    }
  }, []);

  useEffect(() => {
    const defaultFiles = filesByLang[selectedLanguage];
    if (defaultFiles?.length > 0) {
      setActiveFileName(defaultFiles[0].name);
    }
  }, [selectedLanguage]);

  const setCode = useCallback((newContent) => {
    setFilesByLang(prev => {
      const currentFiles = prev[selectedLanguage];
      const idx = currentFiles.findIndex(f => f.name === activeFileName);
      if (idx === -1) return prev;
      const updatedFiles = [...currentFiles];
      updatedFiles[idx] = { ...updatedFiles[idx], content: newContent };
      return { ...prev, [selectedLanguage]: updatedFiles };
    });
  }, [selectedLanguage, activeFileName]);

  // ─── WebSocket Setup ───
  useEffect(() => {
    socket.connect();
    socket.on('connect', () => setBackendConnected(true));
    socket.on('disconnect', () => setBackendConnected(false));
    socket.on('compilation_start', () => setIsCompiling(true));
    socket.on('compilation_complete', () => setIsCompiling(false));
    socket.on('terminal_output', data => setTerminalData(p => [...p, { type: 'output', text: data }]));
    socket.on('terminal_error', data => setTerminalData(p => [...p, { type: 'error', text: data }]));
    
    socket.on('execution_complete', async (data) => {
      setIsRunning(false);
      setIsCompiling(false);
      setIsInteractive(false);
      setResult(data);

      // ─── Auto-Save to History ───
      if (user && data.status?.id === 3) {
        try {
          await axios.post(`${BACKEND_URL}/history`, {
            language: selectedLanguage,
            files: activeLangFiles,
            stdin: stdin,
            output: {
              stdout: data.stdout || '',
              stderr: data.stderr || '',
              compile_output: data.compile_output || ''
            },
            status: data.status
          });
        } catch (err) {
          console.error('Failed to save history', err);
        }
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('compilation_start');
      socket.off('compilation_complete');
      socket.off('terminal_output');
      socket.off('terminal_error');
      socket.off('execution_complete');
    };
  }, [user, selectedLanguage, activeLangFiles, stdin]);

  const handleRun = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setIsInteractive(true);
    setResult(null);
    setTerminalData([]);
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

  const handleStop = useCallback(() => socket.emit('stop'), []);
  const handleTerminalInput = useCallback((text) => {
    socket.emit('input', text);
    setTerminalData(prev => [...prev, { type: 'input', text: text + '\n' }]);
  }, []);

  const handleAddFile = () => { setIsAddingFile(true); setNewFileName(''); setTimeout(() => newFileInputRef.current?.focus(), 50); };
  const handleNewFileSubmit = () => {
    const name = newFileName.trim(); setIsAddingFile(false); setNewFileName('');
    if (!name || activeLangFiles.some(f => f.name === name)) return;
    setFilesByLang(prev => ({ ...prev, [selectedLanguage]: [...prev[selectedLanguage], { name, content: '' }] }));
    setActiveFileName(name);
  };
  const handleDeleteFile = (e, name) => {
    e.stopPropagation(); if (activeLangFiles.length === 1) return;
    setFilesByLang(prev => ({ ...prev, [selectedLanguage]: prev[selectedLanguage].filter(f => f.name !== name) }));
    if (activeFileName === name) setActiveFileName(activeLangFiles[0].name);
  };

  const handleShare = async () => {
    try {
      if (navigator.share && isMobile) {
        await navigator.share({ title: `CompileX Snippet`, text: code });
      } else {
        await navigator.clipboard.writeText(code); toast.success('Code copied!');
      }
    } catch (err) { console.error(err); }
  };

  // ─── Desktop Dividers ───
  const handleVerticalDividerMouseDown = (e) => {
    if (e.type === 'mousedown') e.preventDefault(); isDraggingVertical.current = true; setIsResizing(true);
    const onMove = (ev) => {
      if (!isDraggingVertical.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
      setVerticalSplit(Math.min(Math.max(((y - rect.top) / rect.height) * 100, 20), 85));
    };
    const onEnd = () => { isDraggingVertical.current = false; setIsResizing(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onEnd);
  };

  const handleHorizontalDividerMouseDown = (e) => {
    if (e.type === 'mousedown') e.preventDefault(); isDraggingHorizontal.current = true; setIsResizing(true);
    const onMove = (ev) => {
      if (!isDraggingHorizontal.current || !bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      setHorizontalSplit(Math.min(Math.max(((rect.right - x) / rect.width) * 100, 18), 50));
    };
    const onEnd = () => { isDraggingHorizontal.current = false; setIsResizing(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onEnd);
  };

  const execError = result ? (result.stderr || result.compile_output || '') : '';
  const lineCount = code.split('\n').length;

  return (
    <div className="app" data-theme={themeName}>
      <Navbar
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        onRun={handleRun}
        isRunning={isRunning}
        onShare={handleShare}
        onAIToggle={() => setAIPanelOpen(o => !o)}
        aiPanelOpen={aiPanelOpen}
        version={APP_VERSION}
        backendConnected={backendConnected}
      />

      {isMobile ? (
        <div className="mobile-content">
          <div className="mobile-editor-section">
            <div className="file-tabs">
              {activeLangFiles.map(f => (
                <button key={f.name} className={`file-tab ${activeFileName === f.name ? 'active' : ''}`} onClick={() => setActiveFileName(f.name)}>
                  {f.name}
                  {activeLangFiles.length > 1 && <span className="file-tab-close" onClick={(e) => handleDeleteFile(e, f.name)}>✕</span>}
                </button>
              ))}
              <button className="add-file-btn" onClick={handleAddFile}>+</button>
            </div>
            <div className="editor-pane" ref={editorContainerRef}>
              <CodeEditor value={code} language={getLanguageById(selectedLanguage).monacoId} themeName={themeName} onChange={setCode} />
            </div>
          </div>

          <div className="mobile-bottom-section">
            <div className="mobile-tab-bar">
              <button className={`mobile-tab-btn ${mobileTab === 'output' ? 'active' : ''}`} onClick={() => setMobileTab('output')}>Output</button>
              <button className={`mobile-tab-btn ${mobileTab === 'input' ? 'active' : ''}`} onClick={() => setMobileTab('input')}>Input</button>
              <button className={`mobile-tab-btn ${mobileTab === 'ai' ? 'active' : ''}`} onClick={() => { setMobileTab('ai'); setAIPanelOpen(true); }}>AI</button>
            </div>
            <div className="mobile-bottom-content">
              <div className={`mobile-panel ${mobileTab !== 'ai' ? 'active' : ''}`}>
                <Console terminalData={terminalData} result={result} isRunning={isRunning} isCompiling={isCompiling} isInteractive={isInteractive} stdin={stdin} onStdinChange={setStdin} onSendInput={handleTerminalInput} onStop={handleStop} mobileForcedTab={mobileTab} />
              </div>
              <div className={`mobile-panel ${mobileTab === 'ai' ? 'active' : ''}`}>
                <Suspense fallback={<div className="ai-loading">Loading AI…</div>}>
                  <AIPanel isOpen={mobileTab === 'ai'} code={code} files={activeLangFiles} language={selectedLanguage} execError={execError} onInsertCode={setCode} onClose={() => { setAIPanelOpen(false); setMobileTab('output'); }} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`app-body ${isResizing ? 'resizing' : ''}`} ref={bodyRef}>
          <div className="editor-area" ref={containerRef} style={{ flex: aiPanelOpen ? (100 - horizontalSplit) : 100 }}>
            <div className="editor-pane-container" style={{ flex: `0 0 ${verticalSplit}%` }}>
              <div className="file-tabs">
                {activeLangFiles.map(f => (
                  <button key={f.name} className={`file-tab ${activeFileName === f.name ? 'active' : ''}`} onClick={() => setActiveFileName(f.name)}>
                    {f.name}
                    {activeLangFiles.length > 1 && <span className="file-tab-close" onClick={(e) => handleDeleteFile(e, f.name)}>✕</span>}
                  </button>
                ))}
                {isAddingFile && <input ref={newFileInputRef} type="text" className="new-file-input" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onBlur={handleNewFileSubmit} onKeyDown={(e) => e.key === 'Enter' && handleNewFileSubmit()} />}
                <button className="add-file-btn" onClick={handleAddFile}>+</button>
              </div>
              <div className="editor-pane" ref={editorContainerRef}>
                <CodeEditor value={code} language={getLanguageById(selectedLanguage).monacoId} themeName={themeName} onChange={setCode} />
              </div>
            </div>
            <div className="panel-divider vertical" onMouseDown={handleVerticalDividerMouseDown} onTouchStart={handleVerticalDividerMouseDown}><div className="divider-handle"><span /><span /><span /></div></div>
            <div className="console-pane" style={{ flex: 1 }}>
              <Console terminalData={terminalData} result={result} isRunning={isRunning} isCompiling={isCompiling} isInteractive={isInteractive} stdin={stdin} onStdinChange={setStdin} onSendInput={handleTerminalInput} onStop={handleStop} />
            </div>
          </div>
          {aiPanelOpen && <div className="panel-divider horizontal" onMouseDown={handleHorizontalDividerMouseDown} onTouchStart={handleHorizontalDividerMouseDown}><div className="divider-handle"><span /><span /><span /></div></div>}
          <div className={`ai-panel-wrapper ${aiPanelOpen ? 'open' : ''}`} style={{ flex: aiPanelOpen ? `0 0 ${horizontalSplit}%` : '0' }}>
            {aiPanelOpen && <Suspense fallback={<div className="ai-loading">Loading AI…</div>}><AIPanel isOpen={aiPanelOpen} code={code} files={activeLangFiles} language={selectedLanguage} execError={execError} onInsertCode={setCode} onClose={() => setAIPanelOpen(false)} /></Suspense>}
          </div>
        </div>
      )}
      <StatusBar selectedLanguage={selectedLanguage} linesCount={lineCount} charCount={code.length} connected={backendConnected} />
      {isResizing && <div className="resizing-overlay" />}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: 'rgba(30, 30, 45, 0.95)',
              color: '#fff',
              fontSize: '0.85rem',
              padding: '10px 16px',
              borderRadius: '10px',
              maxWidth: '360px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<IDE />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
