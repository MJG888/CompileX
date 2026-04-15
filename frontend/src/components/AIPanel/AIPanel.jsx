import React, { useState, useRef, useEffect } from 'react';
import { generateCode, debugCode, explainCode, optimizeCode, convertCode, isAIMockMode } from '../../services/gemini';
import { LANGUAGES } from '../../constants/languages';
import './AIPanel.css';

const quickActions = [
  { 
    id: 'generate', 
    label: 'Generate', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" /><polygon points="18 2 22 6 12 16 8 16 8 12 18 2" /></svg>, 
    desc: 'Describe what to build' 
  },
  { 
    id: 'debug', 
    label: 'Debug', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2m-5 1a8 8 0 0 0 10 0M5 10a8 8 0 0 0 1.5 6M19 10a8 8 0 0 1-1.5 6M4 14l2-2m14 2l-2-2m-8 6v2m-4-1l1-1m10 1l-1-1" /><circle cx="12" cy="13" r="3" /></svg>, 
    desc: 'Find and fix bugs' 
  },
  { 
    id: 'explain', 
    label: 'Explain', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>, 
    desc: 'Understand the code' 
  },
  { 
    id: 'optimize', 
    label: 'Optimize', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 14 4-4-4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>, 
    desc: 'Improve performance' 
  },
  { 
    id: 'convert', 
    label: 'Convert', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 3 4 4-4 4" /><path d="M20 7H9a7 7 0 0 0 0 14h1" /><path d="m8 21-4-4 4-4" /><path d="M4 17h11a7 7 0 0 0 0-14h-1" /></svg>, 
    desc: 'Translate to another language' 
  },
];

// Simple markdown-to-text renderer for code blocks
function MessageContent({ text, onInsert }) {
  if (!text) return null;

  // Split on code blocks
  const parts = text.split(/(```[\w]*\n[\s\S]*?```)/g);

  return (
    <div className="message-content">
      {parts.map((part, i) => {
        const codeMatch = part.match(/^```([\w]*)\s*\n([\s\S]*?)```/);
        if (codeMatch) {
          const lang = codeMatch[1]?.trim() || '';
          const code = codeMatch[2].trim();
          return (
            <div key={i} className="code-block-wrapper">
              <div className="code-block-header">
                <span className="code-lang">{lang || 'code'}</span>
                <button className="insert-btn" onClick={() => onInsert(code)} title="Insert into editor">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                  Insert
                </button>
              </div>
              <pre className="code-block"><code>{code}</code></pre>
            </div>
          );
        }
        // Render text with basic markdown (bold, headers)
        return (
          <div key={i} className="text-block">
            {part.split('\n').map((line, j) => {
              if (line.startsWith('## ')) return <h3 key={j}>{line.slice(3)}</h3>;
              if (line.startsWith('### ')) return <h4 key={j}>{line.slice(4)}</h4>;
              if (line.startsWith('> ')) return <blockquote key={j}>{line.slice(2)}</blockquote>;
              if (line.startsWith('- ') || line.startsWith('* ')) return <li key={j}>{parseBold(line.slice(2))}</li>;
              if (line.match(/^\d+\. /)) return <li key={j}>{parseBold(line.replace(/^\d+\. /, ''))}</li>;
              if (line.startsWith('**') && line.endsWith('**')) return <p key={j}><strong>{line.slice(2, -2)}</strong></p>;
              return line ? <p key={j}>{parseBold(line)}</p> : <br key={j} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

function parseBold(text) {
  const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p
  );
}

export default function AIPanel({ isOpen, code, files, language, execError, onInsertCode, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Welcome to the **CompileX AI Assistant**.\n\nI can assist with:\n- **Generation**: Code from technical descriptions\n- **Debugging**: Identifying and fixing runtime or logical errors\n- **Documentation**: Detailed explanations of existing codebases\n- **Optimization**: Improving complexity and performance\n- **Conversion**: Porting logic across different programming languages\n\nHow can I assist your development today?${isAIMockMode() ? '\n\n> **Demo Mode** — Add `VITE_GROQ_API_KEY` to `.env` for production AI integration.' : ''}`,
    },
  ]);
  const [activeAction, setActiveAction] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [convertTarget, setConvertTarget] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeAction && inputRef.current) inputRef.current.focus();
  }, [activeAction]);

  const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const handleAction = async (actionId) => {
    setActiveAction(actionId);
    if (actionId === 'generate') {
      setPrompt('');
    } else {
      // Auto-trigger for non-prompt actions
      await runAction(actionId, null);
    }
  };

  const runAction = async (actionId, userPrompt) => {
    setIsLoading(true);
    const action = actionId || activeAction;
    const promptText = userPrompt !== null ? userPrompt : prompt;

    let userMsg = '';
    let aiResult = null;

    try {
      // Use files array if available, otherwise fallback to backward compatibility with single code block
      const contextBundle = files && files.length > 0 ? files : code;

      switch (action) {
        case 'generate':
          userMsg = `Generate ${currentLang.label} code: ${promptText}`;
          aiResult = await generateCode(promptText, currentLang.label);
          break;
        case 'debug':
          userMsg = `Debug my ${currentLang.label} code`;
          aiResult = await debugCode(contextBundle, execError || '', currentLang.label);
          break;
        case 'explain':
          userMsg = `Explain my ${currentLang.label} code`;
          aiResult = await explainCode(contextBundle, currentLang.label);
          break;
        case 'optimize':
          userMsg = `Optimize my ${currentLang.label} code`;
          aiResult = await optimizeCode(contextBundle, currentLang.label);
          break;
        case 'convert':
          const targetLang = LANGUAGES.find((l) => l.id === convertTarget);
          userMsg = `Convert my ${currentLang.label} code to ${targetLang?.label}`;
          aiResult = await convertCode(contextBundle, currentLang.label, targetLang?.label || 'JavaScript');
          break;
        default:
          aiResult = { text: 'Unknown action.', type: 'text' };
      }

      if (userMsg) addMessage('user', userMsg);
      addMessage('ai', aiResult.text);
    } catch (err) {
      addMessage('ai', `❌ **Error**: ${err.message}\n\nPlease check your API key configuration.`);
    } finally {
      setIsLoading(false);
      setActiveAction(null);
      setPrompt('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    runAction(activeAction, prompt);
  };

  if (!isOpen) return null;

  return (
    <aside className="ai-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <div className="ai-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
              <path d="M12 8v4" /><path d="M12 16h.01" />
            </svg>
          </div>
          <div>
            <span className="ai-panel-name">AI Assistant</span>
            <span className="ai-panel-model">{isAIMockMode() ? 'Demo Mode' : 'Gemini 1.5 Flash'}</span>
          </div>
        </div>
        <button className="ai-close-btn" onClick={onClose} id="ai-panel-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {quickActions.map((action) => (
          <button
            key={action.id}
            id={`ai-action-${action.id}`}
            className={`quick-action-btn ${activeAction === action.id ? 'active' : ''}`}
            onClick={() => handleAction(action.id)}
            disabled={isLoading}
            title={action.desc}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`}>
            {msg.role === 'ai' && (
              <div className="message-avatar ai-avatar-small">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            )}
            <div className="message-bubble">
              <MessageContent text={msg.text} onInsert={onInsertCode} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="ai-message ai">
            <div className="message-avatar ai-avatar-small">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>
            <div className="message-bubble">
              <div className="ai-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="ai-input-area">
        {activeAction === 'convert' && (
          <div className="convert-selector">
            <label>Convert to:</label>
            <select
              id="convert-target-lang"
              value={convertTarget}
              onChange={(e) => setConvertTarget(e.target.value)}
              className="convert-select"
            >
              {LANGUAGES.filter((l) => l.id !== language).map((l) => (
                <option key={l.id} value={l.id}>{l.icon} {l.label}</option>
              ))}
            </select>
            <button
              className="convert-go-btn"
              onClick={() => runAction('convert', null)}
              disabled={isLoading}
            >
              Convert
            </button>
          </div>
        )}

        {activeAction === 'generate' && (
          <form className="ai-prompt-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              id="ai-prompt-input"
              className="ai-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe what to generate in ${currentLang.label}…`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
              rows={2}
            />
            <button
              id="ai-submit-btn"
              type="submit"
              className="ai-submit-btn"
              disabled={isLoading || !prompt.trim()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </form>
        )}

        {!activeAction && (
          <form className="ai-prompt-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              id="ai-chat-input"
              className="ai-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything about your code…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim()) {
                    setActiveAction('generate');
                    runAction('generate', prompt);
                  }
                }
              }}
              disabled={isLoading}
              rows={2}
            />
            <button
              id="ai-chat-submit"
              type="submit"
              className="ai-submit-btn"
              disabled={isLoading || !prompt.trim()}
              onClick={() => { setActiveAction('generate'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
