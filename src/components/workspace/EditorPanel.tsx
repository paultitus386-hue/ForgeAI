'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useForgeStore } from '@/lib/store';
import { Project, ProjectFile } from '@/lib/types';
import { getFileIcon, getMonacoLanguage } from '@/lib/utils';
import { X, Save, Copy, ChevronDown, Maximize2, Code2 } from 'lucide-react';

// Lazy load Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function EmptyEditor() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--accent-violet-dim)', border: '1px solid rgba(124,58,237,0.15)' }}
      >
        <Code2 className="w-8 h-8 text-[var(--accent-violet-light)]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">No file open</p>
        <p className="text-xs text-[var(--text-tertiary)]">Select a file from the sidebar or ask ForgeAI to build something</p>
      </div>
    </div>
  );
}

export default function EditorPanel({ project }: { project: Project }) {
  const { activeFileId, setActiveFile, openTabs, openTab, closeTab, updateFile } = useForgeStore();
  const [isSaved, setIsSaved] = useState(true);
  const editorRef = useRef<any>(null);

  const activeFile = project.files.find((f) => f.id === activeFileId);
  const openTabFiles = openTabs
    .map((tabId) => project.files.find((f) => f.id === tabId))
    .filter(Boolean) as ProjectFile[];

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    updateFile(project.id, activeFile.id, value);
    setIsSaved(false);
    setTimeout(() => setIsSaved(true), 2000); // Auto-save simulation
  }, [activeFile, project.id, updateFile]);

  const handleSave = () => {
    if (!activeFile) return;
    setIsSaved(true);
    // In a real app, this would save to disk
  };

  const handleCopy = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
    }
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Tab Bar */}
      {openTabFiles.length > 0 ? (
        <div
          className="flex items-center overflow-x-auto border-b border-[var(--border-subtle)] flex-shrink-0"
          style={{ background: 'var(--bg-panel)' }}
        >
          {openTabFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => setActiveFile(file.id)}
              className="group flex items-center gap-2 px-3 py-2 cursor-pointer border-b-2 min-w-0 flex-shrink-0 transition-all"
              style={{
                borderColor: activeFileId === file.id ? 'var(--accent-violet)' : 'transparent',
                background: activeFileId === file.id ? 'var(--bg-base)' : 'transparent',
                color: activeFileId === file.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <span className="text-xs">{getFileIcon(file.name)}</span>
              <span className="text-xs truncate max-w-28">{file.name}</span>
              {!isSaved && activeFileId === file.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)] flex-shrink-0" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(file.id); }}
                className="hidden group-hover:flex w-4 h-4 items-center justify-center rounded hover:bg-[var(--bg-hover)] flex-shrink-0"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Editor Actions */}
      {activeFile && (
        <div
          className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] flex-shrink-0"
          style={{ background: 'var(--bg-panel)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] font-mono">{activeFile.path}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
            >
              {activeFile.language}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="text-xs"
              style={{ color: isSaved ? 'var(--status-success)' : 'var(--status-warning)' }}
            >
              {isSaved ? '● Saved' : '● Unsaved'}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSave}
              className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              title="Save (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <MonacoEditor
            height="100%"
            language={getMonacoLanguage(activeFile.language)}
            value={activeFile.content}
            onChange={handleEditorChange}
            onMount={(editor) => { editorRef.current = editor; }}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              suggest: { showKeywords: true, showSnippets: true },
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'gutter',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
            }}
          />
        ) : (
          <EmptyEditor />
        )}
      </div>
    </div>
  );
}
