'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForgeStore } from '@/lib/store';
import { PROJECT_TEMPLATES, generateId } from '@/lib/utils';
import {
  Zap, Code2, GitBranch, Terminal, Play, ChevronRight,
  Sparkles, ArrowRight, Layers, Shield, Cpu, Globe
} from 'lucide-react';
import ModelSelector from './ModelSelector';

const EXAMPLE_PROMPTS = [
  'Create a QR code generator with React',
  'Build a portfolio website for a photographer',
  'Create a Python web scraper for e-commerce',
  'Build a task management application with drag & drop',
  'Create a REST API with Node.js and authentication',
  'Build a weather dashboard with charts',
];

const FEATURES = [
  {
    icon: <Cpu className="w-5 h-5" />,
    title: 'AI-Powered Planning',
    description: 'The agent analyzes your request and creates a detailed implementation plan before writing a single line of code.',
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: 'Real Code Generation',
    description: 'ForgeAI writes complete, production-quality files — not snippets. Every component, every config, every style.',
  },
  {
    icon: <Terminal className="w-5 h-5" />,
    title: 'Command Execution',
    description: 'Runs npm install, starts dev servers, and executes build commands in a controlled environment.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Safe by Design',
    description: 'Dangerous commands are classified and blocked. You stay in control with clear permission settings.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Live Preview',
    description: 'See your application running with desktop, tablet, and mobile viewports — with instant refresh on changes.',
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    title: 'Version History',
    description: 'Every build creates a snapshot. Roll back to any previous version with one click.',
  },
];

export default function HomePage() {
  const { setCurrentView, createProject, setActiveProject } = useForgeStore();
  const [prompt, setPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<'build' | 'plan'>('build');
  const [showTemplates, setShowTemplates] = useState(false);

  const handleStart = () => {
    if (!prompt.trim()) return;
    const project = createProject(prompt.trim(), `Created by ForgeAI: ${prompt.trim()}`);
    setCurrentView('workspace');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleStart();
    }
  };

  const handleTemplate = (templateKey: string) => {
    const template = PROJECT_TEMPLATES[templateKey as keyof typeof PROJECT_TEMPLATES];
    const project = createProject(template.name, template.description, templateKey as any);
    setCurrentView('workspace');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col overflow-auto">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <img src="/logo-mark.svg" alt="ForgeAI" className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight text-white">
            Forge<span className="gradient-text">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('projects')}
            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Projects
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Settings
          </button>
          <button
            onClick={() => setCurrentView('workspace')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg"
            style={{ background: 'var(--gradient-brand)', color: 'white' }}
          >
            <Zap className="w-3.5 h-3.5" />
            Open Workspace
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-violet)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-violet)]"></span>
            </span>
            AI Coding Agent — Multi-provider · Real file operations
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Build anything with your{' '}
            <span className="gradient-text-animated">AI developer.</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed">
            Describe what you want. ForgeAI plans it, builds it, tests it, and helps you ship it.
          </p>

          {/* Prompt Box */}
          <div
            className="relative w-full max-w-2xl mx-auto mb-8"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 0 40px rgba(124, 58, 237, 0.08)',
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What should I build? e.g. Create a QR code generator with React and TypeScript"
              className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none outline-none px-5 pt-4 pb-16 text-base leading-relaxed"
              rows={3}
              style={{ fontFamily: 'var(--font-sans)' }}
            />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              {/* Mode selector & Model selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {(['build', 'plan'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-all"
                      style={{
                        background: selectedMode === mode ? 'var(--accent-violet-dim)' : 'transparent',
                        color: selectedMode === mode ? 'var(--accent-violet-light)' : 'var(--text-tertiary)',
                        border: `1px solid ${selectedMode === mode ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-[var(--border-default)]" />

                <ModelSelector />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">⌘ Enter</span>
                <button
                  onClick={handleStart}
                  disabled={!prompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--gradient-brand)', color: 'white' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Start Building
                </button>
              </div>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            {EXAMPLE_PROMPTS.map((ep) => (
              <button
                key={ep}
                onClick={() => setPrompt(ep)}
                className="px-3 py-1.5 text-xs rounded-full transition-all hover:text-[var(--text-primary)]"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {ep}
              </button>
            ))}
          </div>

          {/* CTA Secondary */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentView('workspace')}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all hover:bg-[var(--bg-hover)]"
              style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
              Open Workspace
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all hover:bg-[var(--bg-hover)]"
              style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <Layers className="w-4 h-4" />
              Start from Template
            </button>
          </div>
        </motion.div>

        {/* Templates */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="w-full max-w-4xl mx-auto mt-12"
            >
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 text-left">
                Start from Template
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(PROJECT_TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplate(key)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl text-left transition-all hover:border-[var(--accent-violet)] group"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-white">{t.name}</span>
                    <span className="text-xs text-[var(--text-tertiary)] leading-tight">{t.stack}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        <div className="w-full max-w-5xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
            A real AI coding agent, not a chatbot.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'var(--accent-violet-dim)', color: 'var(--accent-violet-light)' }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{feature.title}</h3>
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Workflow Diagram */}
        <div className="w-full max-w-3xl mx-auto mt-16 mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
            From idea to working project.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['Idea', 'Plan', 'Create', 'Execute', 'Preview', 'Test', 'Debug', 'Fix', 'Ship'].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: i === 0 ? 'var(--gradient-brand)' : 'var(--bg-surface)',
                    border: `1px solid ${i === 0 ? 'transparent' : 'var(--border-default)'}`,
                    color: i === 0 ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-[var(--text-disabled)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] px-6 py-4 text-center">
        <p className="text-xs text-[var(--text-disabled)]">
          ForgeAI · Your AI developer that actually builds. · Built with Next.js & ❤️
        </p>
      </footer>
    </div>
  );
}
