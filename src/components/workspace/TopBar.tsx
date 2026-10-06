'use client';

import { useState } from 'react';
import { useForgeStore } from '@/lib/store';
import { Project } from '@/lib/types';
import {
  Home, ChevronRight, GitCommit, Zap, Square, Settings,
  MoreHorizontal, Play, FolderOpen, Activity, Sparkles
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import ModelSelector from '../ModelSelector';

const AGENT_STATE_COLORS: Record<string, string> = {
  idle: '#6b6789',
  planning: '#8b5cf6',
  creating: '#06b6d4',
  installing: '#f59e0b',
  coding: '#3b82f6',
  running: '#10b981',
  testing: '#06b6d4',
  debugging: '#f59e0b',
  fixing: '#ef4444',
  completed: '#10b981',
  failed: '#ef4444',
  paused: '#f59e0b',
};

const AGENT_STATE_LABELS: Record<string, string> = {
  idle: 'Ready',
  planning: 'Planning',
  creating: 'Creating',
  installing: 'Installing',
  coding: 'Coding',
  running: 'Running',
  testing: 'Testing',
  debugging: 'Debugging',
  fixing: 'Fixing',
  completed: 'Complete',
  failed: 'Failed',
  paused: 'Paused',
};

export default function TopBar({ project, onStop }: { project: Project; onStop: () => void }) {
  const {
    setCurrentView,
    agentState,
    agentMode,
    setAgentMode,
    isAgentRunning,
    setCommandPaletteOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    setModelComparisonOpen,
  } = useForgeStore();

  const stateColor = AGENT_STATE_COLORS[agentState] ?? '#6b6789';
  const stateLabel = AGENT_STATE_LABELS[agentState] ?? agentState;

  return (
    <header
      className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] flex-shrink-0"
      style={{ background: 'var(--bg-panel)', height: '44px' }}
    >
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <img src="/logo-mark.svg" alt="ForgeAI" className="w-6 h-6" />
          <span className="text-sm font-bold text-white hidden sm:block">
            Forge<span className="gradient-text">AI</span>
          </span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-disabled)]" />

        <button
          onClick={() => setCurrentView('projects')}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="max-w-32 truncate hidden sm:block">{project.name}</span>
        </button>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors ml-2"
          title="Toggle sidebar"
        >
          <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      {/* Center: Agent Status */}
      <div className="flex items-center gap-3">
        {/* Mode Selector */}
        <div
          className="flex items-center rounded-lg overflow-hidden border border-[var(--border-subtle)]"
          style={{ background: 'var(--bg-surface)' }}
        >
          {(['build', 'plan', 'fix', 'test', 'explain', 'refactor'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setAgentMode(mode)}
              className="px-2.5 py-1 text-xs capitalize font-medium transition-all"
              style={{
                background: agentMode === mode ? 'var(--accent-violet-dim)' : 'transparent',
                color: agentMode === mode ? 'var(--accent-violet-light)' : 'var(--text-tertiary)',
              }}
              title={mode}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Model Selector */}
        <ModelSelector />

        {/* Compare Models Button */}
        <button
          type="button"
          onClick={() => setModelComparisonOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--bg-hover)] transition-all border border-[var(--border-subtle)]"
          title="Compare AI Models side-by-side"
        >
          <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
          <span className="hidden md:inline">Compare</span>
        </button>

        {/* Agent State Badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
          style={{ background: `${stateColor}15`, color: stateColor, border: `1px solid ${stateColor}30` }}
        >
          {isAgentRunning ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: stateColor }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: stateColor }}></span>
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full" style={{ background: stateColor }} />
          )}
          {stateLabel}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Git Status */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded px-2 py-1 hidden sm:flex">
          <GitCommit className="w-3 h-3" />
          <span>main</span>
          <span className="text-[var(--status-success)]">✓</span>
        </div>

        {isAgentRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444430' }}
          >
            <Square className="w-3 h-3 fill-current" />
            Stop
          </button>
        ) : (
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:bg-[var(--bg-hover)]"
            style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <Activity className="w-3 h-3" />
            <span className="hidden sm:block">⌘K</span>
          </button>
        )}

        <button
          onClick={() => setCurrentView('settings')}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>
      </div>
    </header>
  );
}
