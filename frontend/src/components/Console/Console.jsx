import React, { useState, useRef, useEffect } from 'react';
import './Console.css';

const STATUS_CONFIG = {
  idle: { label: 'Ready', color: 'var(--text-muted)', bg: 'transparent', dot: '#6b7280' },
  compiling: { label: 'Compiling…', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', dot: '#818cf8' },
  running: { label: 'Running…', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
  success: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.1)', dot: '#10b981' },
  error: { label: 'Error', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
  tle: { label: 'Time Limit Exceeded', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
  mle: { label: 'Memory Limit', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
  compile_error: { label: 'Compilation Error', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
  stopped: { label: 'Stopped', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', dot: '#94a3b8' },
};

const getStatusFromResult = (result) => {
  if (!result) return 'idle';
  const id = result.status?.id;
  if (id === 3) return 'success';
  if (id === 6) return 'compile_error';
  if (id === 5) return 'tle';
  if (id === 7) return 'mle';
  if (id === 15) return 'stopped';
  if (id >= 4) return 'error';
  return 'idle';
};

export default function Console({
  terminalData = [],
  result,
  isRunning,
  isCompiling = false,
  isInteractive,
  stdin = '',
  onStdinChange,
  onSendInput,
  onStop,
}) {
  const [activeTab, setActiveTab] = useState('output');
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalData]);

  const status = isCompiling ? 'compiling' : isRunning ? 'running' : getStatusFromResult(result);
  const statusConfig = STATUS_CONFIG[status];

  const hasOutput = terminalData.length > 0;
  const hasError = terminalData.some(d => d.type === 'error') || (result && (result.stderr || result.compile_output));
  const errorText = terminalData.filter(d => d.type === 'error').map(d => d.text).join('') +
    (result?.compile_output || '') + (result?.stderr || '');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSendInput(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="console">
      {/* Header */}
      <div className="console-header">
        <div className="console-tabs">
          <button
            id="tab-output"
            className={`console-tab ${activeTab === 'output' ? 'active' : ''}`}
            onClick={() => setActiveTab('output')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Terminal
            {hasOutput && <span className="tab-dot success" />}
          </button>
          <button
            id="tab-input"
            className={`console-tab ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Input
          </button>
          <button
            id="tab-errors"
            className={`console-tab ${activeTab === 'errors' ? 'active' : ''}`}
            onClick={() => setActiveTab('errors')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Errors
            {hasError && <span className="tab-dot error" />}
          </button>
        </div>

        {/* Status Badge */}
        <div className="console-status" style={{ color: statusConfig.color, background: statusConfig.bg }}>
          {isRunning && (
            <button className="stop-btn" onClick={onStop} title="Stop Execution (kills process)">
              <span className="stop-icon">■</span> Stop
            </button>
          )}
          {(isRunning || isCompiling) && <span className="status-spinner" />}
          <span className="status-dot" style={{ background: statusConfig.dot }} />
          <span>{statusConfig.label}</span>
          {result?.time && status === 'success' && (
            <span className="status-meta">
              {result.time}s{result.memory ? ` · ${(result.memory / 1024).toFixed(1)} MB` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="console-body">
        {/* Terminal Tab */}
        {activeTab === 'output' && (
          <div className="console-content terminal-mode" ref={scrollRef}>
            {hasOutput || isInteractive ? (
              <div className="console-output success-output">
                {terminalData.map((d, i) => (
                  <span key={i} className={`term-${d.type}`}>{d.text}</span>
                ))}
                {isInteractive && (
                  <div className="terminal-input-row">
                    <span className="term-prompt">❯</span>
                    <input
                      type="text"
                      className="terminal-input"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type input and press Enter..."
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            ) : isRunning || isCompiling ? (
              <div className="console-running">
                <div className="console-spinner" />
                <span>{isCompiling ? 'Compiling your code…' : 'Executing…'}</span>
              </div>
            ) : result && !hasOutput && !hasError ? (
              <div className="console-empty">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Program exited with no output</span>
              </div>
            ) : (
              <div className="console-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                <p>Click <strong>Run</strong> or press <kbd>Ctrl+Enter</kbd></p>
                <span>Output will appear here</span>
              </div>
            )}
          </div>
        )}

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="console-content">
            <textarea
              className="stdin-textarea"
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Provide program input (stdin) here...&#10;&#10;Each line is sent as a separate input."
              spellCheck="false"
            />
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="console-content">
            {hasError ? (
              <pre className="console-output error-output">{errorText}</pre>
            ) : (
              <div className="console-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p>No errors detected</p>
                <span>Compilation and runtime errors will appear here</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
