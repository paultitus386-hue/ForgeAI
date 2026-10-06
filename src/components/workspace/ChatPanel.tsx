'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useForgeStore } from '@/lib/store';
import { Project } from '@/lib/types';
import { Send, Square, Sparkles, ChevronDown, Code2, Paperclip } from 'lucide-react';
import { parseCodeBlocks } from '@/lib/utils';
import ModelSelector from '../ModelSelector';

// Simple markdown renderer
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="my-2 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
          {lang && (
            <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">{lang}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeLines.join('\n'))}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                Copy
              </button>
            </div>
          )}
          <pre className="code-block text-xs" style={{ margin: 0, borderRadius: 0 }}>
            {codeLines.join('\n')}
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1">{line.slice(3)}</h2>);
    }
    // H3
    else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-xs font-semibold text-[var(--text-secondary)] mt-2 mb-1 uppercase tracking-wider">{line.slice(4)}</h3>);
    }
    // Bullet
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)] my-0.5">
          <span className="text-[var(--accent-violet)] mt-0.5 flex-shrink-0">▸</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        elements.push(
          <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] my-0.5">
            <span className="text-[var(--accent-violet)] flex-shrink-0 font-mono w-4">{match[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(match[2]) }} />
          </div>
        );
      }
    }
    // Checkmark line
    else if (line.startsWith('✓') || line.startsWith('✗') || line.startsWith('●') || line.startsWith('○')) {
      const isCheck = line.startsWith('✓');
      const isFail = line.startsWith('✗');
      const isActive = line.startsWith('●');
      elements.push(
        <div key={i} className="flex items-center gap-2 text-xs my-0.5">
          <span style={{ color: isCheck ? 'var(--status-success)' : isFail ? 'var(--status-error)' : isActive ? 'var(--accent-violet)' : 'var(--text-disabled)' }}>
            {line[0]}
          </span>
          <span className="text-[var(--text-secondary)]">{line.slice(2)}</span>
        </div>
      );
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
    }
    // Regular text
    else {
      elements.push(
        <p key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
    i++;
  }

  return <div>{elements}</div>;
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background: var(--bg-base); padding: 1px 5px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.75em; color: var(--accent-cyan)">$1</code>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export default function ChatPanel({
  project,
  input,
  onInputChange,
  onSend,
  isRunning,
  onStop,
}: {
  project: Project;
  input: string;
  onInputChange: (v: string) => void;
  onSend: (msg: string, mode?: string) => void;
  isRunning: boolean;
  onStop: () => void;
}) {
  const { agentMode, setModelComparisonOpen } = useForgeStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const userMessages = project.conversations.filter((m) => m.role === 'user');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project.conversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'ArrowUp' && !input && userMessages.length > 0) {
      const idx = historyIndex < userMessages.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(idx);
      onInputChange(userMessages[userMessages.length - 1 - idx]?.content ?? '');
    }
  };

  const handleSend = () => {
    if (!input.trim() || isRunning) return;
    onSend(input.trim(), agentMode);
    setHistoryIndex(-1);
  };

  const SUGGESTED = [
    'Create a QR code generator with React',
    'Build a portfolio website',
    'Create a REST API with Node.js',
    'Add dark mode to the project',
    'Fix any errors in the code',
    'Add unit tests',
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-violet)]" />
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">AI Conversation</span>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector compact />
          <button
            type="button"
            onClick={() => setModelComparisonOpen(true)}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-white transition-all"
            title="Compare Models side-by-side"
          >
            <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
            <span>Compare</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {project.conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-violet-dim)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <Sparkles className="w-6 h-6 text-[var(--accent-violet-light)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Ready to build</p>
              <p className="text-xs text-[var(--text-tertiary)]">Describe what you want to create</p>
            </div>
            {/* Suggestions */}
            <div className="w-full space-y-1.5 mt-2">
              {SUGGESTED.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => { onInputChange(s); textareaRef.current?.focus(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:text-[var(--text-primary)]"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          project.conversations.map((message) => (
            <div key={message.id} className="animate-fade-in">
              {message.role === 'user' ? (
                // User message
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--accent-violet-dim)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--text-primary)' }}
                  >
                    {message.content}
                  </div>
                </div>
              ) : message.role === 'assistant' ? (
                // Assistant message
                <div className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--gradient-brand)' }}
                  >
                    <span className="text-white text-xs font-bold">F</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--accent-violet-light)] mb-1">ForgeAI</div>
                    <div
                      className="px-3 py-2 rounded-xl rounded-tl-none"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      {message.isStreaming ? (
                        <div>
                          {renderMarkdown(message.content)}
                          <span className="inline-flex items-center gap-1 ml-1">
                            <span className="typing-dots">
                              <span></span><span></span><span></span>
                            </span>
                          </span>
                        </div>
                      ) : (
                        renderMarkdown(message.content)
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[var(--border-subtle)] flex-shrink-0">
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What should I build? (⌘+Enter to send)"
            disabled={isRunning}
            className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none outline-none px-3 py-2.5 pb-9"
            rows={3}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" title="Attach file">
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" title="Code block">
                <Code2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {isRunning ? (
              <button
                onClick={onStop}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition-all"
                style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}
              >
                <Square className="w-3 h-3 fill-current" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--gradient-brand)', color: 'white' }}
              >
                <Send className="w-3 h-3" />
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
