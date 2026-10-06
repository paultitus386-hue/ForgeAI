'use client';

import { useState, useEffect, useRef } from 'react';
import { useForgeStore } from '@/lib/store';
import { Search, X, Zap, FolderOpen, Terminal, Play, Settings, Eye, GitBranch, Package, FileText, Layers } from 'lucide-react';

const COMMANDS = [
  { id: 'new-project', label: 'New Project', description: 'Create a new project', icon: <Zap className="w-4 h-4" />, shortcut: '' },
  { id: 'open-projects', label: 'Open Projects', description: 'Browse all projects', icon: <FolderOpen className="w-4 h-4" />, shortcut: '' },
  { id: 'run-project', label: 'Run Project', description: 'Start the development server', icon: <Play className="w-4 h-4" />, shortcut: '' },
  { id: 'open-terminal', label: 'Open Terminal', description: 'Switch to terminal panel', icon: <Terminal className="w-4 h-4" />, shortcut: '' },
  { id: 'open-preview', label: 'Open Preview', description: 'Switch to preview panel', icon: <Eye className="w-4 h-4" />, shortcut: '' },
  { id: 'open-settings', label: 'Settings', description: 'Open settings panel', icon: <Settings className="w-4 h-4" />, shortcut: ',' },
  { id: 'view-changes', label: 'View Changes', description: 'See pending diff changes', icon: <GitBranch className="w-4 h-4" />, shortcut: '' },
  { id: 'export-project', label: 'Export Project', description: 'Download project as ZIP', icon: <Package className="w-4 h-4" />, shortcut: '' },
  { id: 'go-home', label: 'Go to Home', description: 'Return to home screen', icon: <Layers className="w-4 h-4" />, shortcut: '' },
  { id: 'view-readme', label: 'View README', description: 'Open the project README', icon: <FileText className="w-4 h-4" />, shortcut: '' },
];

export default function CommandPalette() {
  const { setCommandPaletteOpen, setCurrentView, setActivePanel } = useForgeStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  useEffect(() => {
    inputRef.current?.focus();
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]?.id);
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  const executeCommand = (id?: string) => {
    if (!id) return;
    switch (id) {
      case 'go-home':
        setCurrentView('home');
        break;
      case 'open-projects':
        setCurrentView('projects');
        break;
      case 'open-settings':
        setCurrentView('settings');
        break;
      case 'open-terminal':
        setCurrentView('workspace');
        setActivePanel('terminal');
        break;
      case 'open-preview':
        setCurrentView('workspace');
        setActivePanel('preview');
        break;
      case 'view-changes':
        setCurrentView('workspace');
        setActivePanel('diff');
        break;
      case 'export-project':
        exportProject();
        break;
    }
    setCommandPaletteOpen(false);
  };

  const exportProject = async () => {
    const project = useForgeStore.getState().getActiveProject();
    if (!project) return;
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      project.files.forEach((f) => {
        zip.file(f.path, f.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
          <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
          />
          <kbd
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
              No commands found for "{query}"
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => executeCommand(cmd.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{
                  background: i === selectedIndex ? 'var(--accent-violet-dim)' : 'transparent',
                  color: i === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <span style={{ color: i === selectedIndex ? 'var(--accent-violet-light)' : 'var(--text-tertiary)' }}>
                  {cmd.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{cmd.label}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{cmd.description}</div>
                </div>
                {cmd.shortcut && (
                  <kbd
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}
                  >
                    ⌘{cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex items-center gap-3 text-xs text-[var(--text-disabled)]">
          <span>↑↓ navigate</span>
          <span>↵ execute</span>
          <span>esc close</span>
        </div>
      </div>
    </>
  );
}
