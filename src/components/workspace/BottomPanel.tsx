'use client';

import { useRef, useEffect, useState } from 'react';
import { useForgeStore } from '@/lib/store';
import { Project } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { Terminal, Globe, FileText, GitBranch, Diff, Trash2, RefreshCw, Monitor, Smartphone, Tablet, Maximize2, ExternalLink } from 'lucide-react';

type BottomTab = 'terminal' | 'preview' | 'logs' | 'diff' | 'git';

const TABS: { id: BottomTab; label: string; icon: React.ReactNode }[] = [
  { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-3.5 h-3.5" /> },
  { id: 'preview', label: 'Preview', icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'logs', label: 'Logs', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'diff', label: 'Changes', icon: <Diff className="w-3.5 h-3.5" /> },
  { id: 'git', label: 'Git', icon: <GitBranch className="w-3.5 h-3.5" /> },
];

// ---- Terminal Tab ----
function TerminalTab({ project }: { project: Project }) {
  const { clearTerminal } = useForgeStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project.terminalHistory]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] flex-shrink-0">
        <span className="text-xs text-[var(--text-tertiary)] font-mono">bash</span>
        <button
          onClick={() => clearTerminal(project.id)}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5"
        style={{ background: '#0a0a10' }}
      >
        {project.terminalHistory.length === 0 ? (
          <div className="text-[var(--text-disabled)]">
            <span className="text-[var(--status-success)]">forge</span>
            <span className="text-[var(--text-tertiary)]">@ai</span>
            <span className="text-white">:</span>
            <span className="text-[var(--accent-cyan)]">~/workspace</span>
            <span className="text-white">$ </span>
            <span className="animate-blink text-white">▊</span>
          </div>
        ) : (
          project.terminalHistory.map((line) => (
            <div
              key={line.id}
              className={`terminal-${line.type} leading-relaxed`}
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
            >
              {line.type === 'command' && (
                <span>
                  <span className="text-[var(--status-success)]">forge</span>
                  <span className="text-[var(--text-tertiary)]">@ai</span>
                  <span className="text-white">:</span>
                  <span className="text-[var(--accent-cyan)]">~/workspace</span>
                  <span className="text-white"> </span>
                </span>
              )}
              {line.content}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ---- Preview Tab ----
function PreviewTab({ project }: { project: Project }) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const previewUrl = project.previewUrl ?? 'about:blank';

  const viewportSizes = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '100%' },
    mobile: { width: '375px', height: '100%' },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="flex items-center gap-1">
          <input
            value={previewUrl === 'about:blank' ? 'http://localhost:5173' : previewUrl}
            readOnly
            className="text-xs font-mono text-[var(--text-tertiary)] bg-[var(--bg-base)] rounded px-2 py-0.5 w-48 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded overflow-hidden border border-[var(--border-subtle)]">
            <button
              onClick={() => setViewport('mobile')}
              className="p-1.5 transition-colors"
              style={{ background: viewport === 'mobile' ? 'var(--accent-violet-dim)' : 'transparent', color: viewport === 'mobile' ? 'var(--accent-violet-light)' : 'var(--text-tertiary)' }}
              title="Mobile"
            >
              <Smartphone className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className="p-1.5 transition-colors"
              style={{ background: viewport === 'tablet' ? 'var(--accent-violet-dim)' : 'transparent', color: viewport === 'tablet' ? 'var(--accent-violet-light)' : 'var(--text-tertiary)' }}
              title="Tablet"
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewport('desktop')}
              className="p-1.5 transition-colors"
              style={{ background: viewport === 'desktop' ? 'var(--accent-violet-dim)' : 'transparent', color: viewport === 'desktop' ? 'var(--accent-violet-light)' : 'var(--text-tertiary)' }}
              title="Desktop"
            >
              <Monitor className="w-3 h-3" />
            </button>
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" title="Refresh">
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={() => window.open(previewUrl, '_blank')}
            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            title="Open in browser"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-2" style={{ background: '#111' }}>
        <div
          className="h-full bg-white rounded overflow-hidden transition-all duration-300"
          style={{ width: viewportSizes[viewport].width, maxWidth: '100%' }}
        >
          {previewUrl !== 'about:blank' ? (
            <iframe
              key={refreshKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Application Preview"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-3"
              style={{ background: 'var(--bg-surface)' }}
            >
              <Globe className="w-10 h-10 text-[var(--text-disabled)]" />
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-secondary)]">No preview available</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Start a project build to see the live preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Diff Tab ----
function DiffTab({ project }: { project: Project }) {
  const { pendingDiffs, clearPendingDiffs } = useForgeStore();

  if (pendingDiffs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <Diff className="w-8 h-8 text-[var(--text-disabled)]" />
        <p className="text-xs text-[var(--text-tertiary)]">No pending changes</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {pendingDiffs.map((diff, i) => (
        <div key={i} className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-elevated)]">
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-1.5 py-0.5 rounded text-white"
                style={{ background: diff.type === 'added' ? '#10b981' : diff.type === 'deleted' ? '#ef4444' : '#f59e0b' }}
              >
                {diff.type}
              </span>
              <span className="text-xs font-mono text-[var(--text-secondary)]">{diff.path}</span>
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              <span className="text-[var(--status-success)]">+{diff.additions}</span>
              {' / '}
              <span className="text-[var(--status-error)]">-{diff.deletions}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Git Tab ----
function GitTab({ project }: { project: Project }) {
  const [commitMsg, setCommitMsg] = useState('');

  const changedFiles = project.files.filter((f) => {
    const now = new Date();
    const diff = now.getTime() - new Date(f.updatedAt).getTime();
    return diff < 3600000; // changed in last hour
  });

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
        <span className="text-xs font-mono text-[var(--text-secondary)]">main</span>
        <span className="text-xs text-[var(--text-tertiary)]">
          {changedFiles.length} file{changedFiles.length !== 1 ? 's' : ''} changed
        </span>
      </div>

      {changedFiles.length > 0 ? (
        <>
          <div className="flex-1 space-y-1 overflow-y-auto mb-3">
            {changedFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-xs">
                <span className="text-[var(--status-warning)]">M</span>
                <span className="text-[var(--text-secondary)] font-mono">{f.path}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="Commit message..."
              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
            />
            <button
              disabled={!commitMsg.trim()}
              className="px-3 py-1.5 text-xs rounded disabled:opacity-40"
              style={{ background: 'var(--gradient-brand)', color: 'white' }}
            >
              Commit
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <GitBranch className="w-8 h-8 text-[var(--text-disabled)]" />
          <p className="text-xs text-[var(--text-tertiary)]">Working tree clean</p>
        </div>
      )}
    </div>
  );
}

export default function BottomPanel({ project }: { project: Project }) {
  const { activePanel, setActivePanel } = useForgeStore();

  const badgeCounts: Partial<Record<BottomTab, number>> = {
    terminal: project.terminalHistory.length,
    logs: project.activityLog.length,
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-panel)' }}>
      {/* Tabs */}
      <div className="flex items-center border-b border-[var(--border-subtle)] flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-all"
            style={{
              borderColor: activePanel === tab.id ? 'var(--accent-violet)' : 'transparent',
              color: activePanel === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              background: activePanel === tab.id ? 'var(--accent-violet-dim)' : 'transparent',
            }}
          >
            {tab.icon}
            {tab.label}
            {badgeCounts[tab.id] ? (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full leading-none"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
              >
                {badgeCounts[tab.id]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activePanel === 'terminal' && <TerminalTab project={project} />}
        {activePanel === 'preview' && <PreviewTab project={project} />}
        {activePanel === 'logs' && (
          <div className="h-full overflow-y-auto p-3 space-y-1">
            {project.activityLog.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] text-center mt-8">No logs yet</p>
            ) : (
              [...project.activityLog].reverse().map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-[var(--text-disabled)] flex-shrink-0">
                    {formatTimestamp(new Date(entry.timestamp))}
                  </span>
                  <span
                    className="flex-1"
                    style={{
                      color: entry.type === 'success' ? 'var(--status-success)' :
                             entry.type === 'error' ? 'var(--status-error)' :
                             entry.type === 'warning' ? 'var(--status-warning)' :
                             'var(--text-secondary)',
                    }}
                  >
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
        {activePanel === 'diff' && <DiffTab project={project} />}
        {activePanel === 'git' && <GitTab project={project} />}
      </div>
    </div>
  );
}
