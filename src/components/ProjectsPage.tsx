'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForgeStore } from '@/lib/store';
import { PROJECT_TEMPLATES, formatRelativeTime, generateId } from '@/lib/utils';
import { Plus, Search, ArrowLeft, FolderOpen, Trash2, ExternalLink, Clock, Code2, Zap } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, setCurrentView, setActiveProject, deleteProject, createProject } = useForgeStore();
  const [search, setSearch] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    const project = createProject(newName.trim(), newDesc.trim());
    setCurrentView('workspace');
    setShowNewProject(false);
  };

  const handleOpen = (id: string) => {
    setActiveProject(id);
    setCurrentView('workspace');
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setCurrentView('home')}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Projects</h1>
          <p className="text-xs text-[var(--text-tertiary)]">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all"
          style={{ background: 'var(--gradient-brand)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          />
        </div>

        {/* New Project Form */}
        {showNewProject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-violet)', boxShadow: '0 0 20px rgba(124,58,237,0.1)' }}
          >
            <h2 className="text-sm font-semibold text-white mb-4">Create New Project</h2>
            <div className="space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Project name..."
                className="w-full px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                autoFocus
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 text-sm rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-40"
                  style={{ background: 'var(--gradient-brand)', color: 'white' }}
                >
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Templates Row */}
        {projects.length === 0 && !search && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Start from a template</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(PROJECT_TEMPLATES).slice(0, 4).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => {
                    const project = createProject(t.name, t.description, key as any);
                    setCurrentView('workspace');
                  }}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl text-left transition-all hover:border-[var(--accent-violet)] group"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{t.name}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">{t.stack}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <FolderOpen className="w-12 h-12 text-[var(--text-disabled)]" />
            <p className="text-[var(--text-secondary)]">No projects yet</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl"
              style={{ background: 'var(--gradient-brand)', color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative p-5 rounded-xl cursor-pointer transition-all hover:border-[var(--border-strong)]"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                onClick={() => handleOpen(project.id)}
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: project.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)',
                      color: project.status === 'completed' ? '#10b981' : '#8b5cf6',
                    }}
                  >
                    {project.status}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpen(project.id); }}
                      className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
                      title="Open"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${project.name}"?`)) deleteProject(project.id);
                      }}
                      className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 truncate">{project.name}</h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-4 line-clamp-2">{project.description}</p>

                <div className="flex items-center gap-3 text-xs text-[var(--text-disabled)]">
                  <div className="flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    <span>{project.files.length} files</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(new Date(project.updatedAt))}</span>
                  </div>
                </div>

                {project.stack && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-tertiary)]">{project.stack}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
