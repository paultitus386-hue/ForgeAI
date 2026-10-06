'use client';

import { useState } from 'react';
import { AgentState, AgentTask, AgentPlan, Project } from '@/lib/types';
import { formatTimestamp, formatRelativeTime } from '@/lib/utils';
import { useForgeStore } from '@/lib/store';
import { ModelRegistry } from '@/lib/model-registry';
import { Activity, ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, Circle, Loader2, AlertCircle } from 'lucide-react';

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  idle:       { label: 'Ready',      color: '#6b6789', bg: 'rgba(107,103,137,0.1)' },
  planning:   { label: 'Planning',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)'  },
  creating:   { label: 'Creating',   color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
  installing: { label: 'Installing', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  coding:     { label: 'Coding',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  running:    { label: 'Running',    color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  testing:    { label: 'Testing',    color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
  debugging:  { label: 'Debugging',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  fixing:     { label: 'Fixing',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  completed:  { label: 'Complete',   color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  failed:     { label: 'Failed',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  paused:     { label: 'Paused',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
};

function TaskItem({ task }: { task: AgentTask }) {
  const isRunning = task.status === 'running';
  const isSuccess = task.status === 'succeeded';
  const isFailed = task.status === 'failed';
  const isPlanned = task.status === 'planned';

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex-shrink-0">
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-[var(--status-success)]" />}
        {isFailed && <XCircle className="w-4 h-4 text-[var(--status-error)]" />}
        {isRunning && <Loader2 className="w-4 h-4 text-[var(--accent-violet)] animate-spin" />}
        {isPlanned && <Circle className="w-4 h-4 text-[var(--text-disabled)]" />}
        {task.status === 'cancelled' && <XCircle className="w-4 h-4 text-[var(--text-disabled)]" />}
        {task.status === 'skipped' && <Circle className="w-4 h-4 text-[var(--text-disabled)]" />}
      </div>
      <span
        className="text-xs flex-1"
        style={{
          color: isSuccess ? 'var(--status-success)' :
                 isFailed ? 'var(--status-error)' :
                 isRunning ? 'var(--text-primary)' :
                 'var(--text-tertiary)',
          fontWeight: isRunning ? 600 : 400,
        }}
      >
        {task.title}
      </span>
      {task.completedAt && (
        <span className="text-xs text-[var(--text-disabled)]">
          {formatTimestamp(task.completedAt)}
        </span>
      )}
    </div>
  );
}

export default function ActivityPanel({
  agentState,
  tasks,
  plan,
  project,
}: {
  agentState: AgentState;
  tasks: AgentTask[];
  plan: AgentPlan | null;
  project: Project;
}) {
  const { activeModel, activeModelMetrics } = useForgeStore();
  const [showLog, setShowLog] = useState(false);
  const cfg = STATE_CONFIG[agentState] ?? STATE_CONFIG.idle;

  const modelDef = activeModel !== 'auto' ? ModelRegistry.getById(activeModel) : null;
  const recentLog = [...project.activityLog].reverse().slice(0, 20);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--accent-violet)]" />
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Agent Activity</span>
        </div>
        {/* State badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {agentState !== 'idle' && agentState !== 'completed' && agentState !== 'failed' && agentState !== 'paused' && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: cfg.color }}></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: cfg.color }}></span>
            </span>
          )}
          {cfg.label}
        </div>
      </div>

      {/* Model & Usage Info Banner */}
      <div className="px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-tertiary)]">Model:</span>
          <span className="font-semibold text-white">
            {activeModel === 'auto' ? 'Auto (Intelligent)' : modelDef?.displayName || activeModel}
          </span>
        </div>
        {activeModelMetrics && (
          <div className="font-mono text-[10px] text-[var(--accent-cyan)]">
            {activeModelMetrics.outputTokens} tok
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {tasks.length > 0 ? (
          <div className="space-y-0.5">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <Activity className="w-8 h-8 text-[var(--text-disabled)]" />
            <p className="text-xs text-[var(--text-tertiary)]">Agent will show tasks here when running</p>
          </div>
        )}

        {/* Activity Log Toggle */}
        {project.activityLog.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowLog(!showLog)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors w-full"
            >
              {showLog ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Clock className="w-3 h-3" />
              Activity Log ({project.activityLog.length})
            </button>

            {showLog && (
              <div className="mt-2 space-y-1 border-l border-[var(--border-subtle)] pl-3">
                {recentLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <span
                      className="text-xs flex-shrink-0 font-mono"
                      style={{ color: 'var(--text-disabled)' }}
                    >
                      {formatTimestamp(new Date(entry.timestamp))}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: entry.type === 'success' ? 'var(--status-success)' :
                               entry.type === 'error' ? 'var(--status-error)' :
                               entry.type === 'warning' ? 'var(--status-warning)' :
                               'var(--text-tertiary)',
                      }}
                    >
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
