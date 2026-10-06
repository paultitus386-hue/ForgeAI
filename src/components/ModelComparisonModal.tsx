'use client';

import { useState } from 'react';
import { useForgeStore } from '@/lib/store';
import { LLMService, ModelComparisonResult } from '@/lib/llm-service';
import { ModelRegistry } from '@/lib/model-registry';
import { X, Sparkles, Check, ArrowRight, Play, Loader2, Copy } from 'lucide-react';

interface ModelComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySolution?: (code: string) => void;
}

export default function ModelComparisonModal({
  isOpen,
  onClose,
  onApplySolution,
}: ModelComparisonModalProps) {
  const { settings, addMessage, getActiveProject, setActiveFile, updateFile } = useForgeStore();
  const [prompt, setPrompt] = useState('Create a responsive navigation bar with dark mode toggle in React');
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([
    'openai/gpt-6-astra',
    'anthropic/claude-fable-5',
    'gemini/gemini-2.0-flash',
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ModelComparisonResult[]>([]);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const allModels = ModelRegistry.getEnabled();
  const project = getActiveProject();

  const handleToggleModel = (id: string) => {
    if (selectedModelIds.includes(id)) {
      if (selectedModelIds.length > 1) {
        setSelectedModelIds(selectedModelIds.filter((m) => m !== id));
      }
    } else {
      setSelectedModelIds([...selectedModelIds, id]);
    }
  };

  const handleRunComparison = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResults([]);
    setAppliedIndex(null);

    try {
      const llmService = new LLMService(settings.llm);
      const comparisonResults = await llmService.compareModels(prompt, selectedModelIds);
      setResults(comparisonResults);
    } catch (err: any) {
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSolution = (result: ModelComparisonResult, idx: number) => {
    setAppliedIndex(idx);
    if (project) {
      addMessage(project.id, {
        role: 'assistant',
        content: `**Solution applied from ${result.model.displayName}:**\n\n${result.content}`,
      });
    }
    onApplySolution?.(result.content);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-strong)]"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent-violet-dim)] text-[var(--accent-violet-light)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Compare AI Models Side-by-Side</h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                Evaluate outputs from GPT-6 Astra, Claude Fable 5, and Gemini simultaneously
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Input & Model Checkboxes */}
        <div className="p-6 border-b border-[var(--border-subtle)] space-y-4 bg-[var(--bg-base)]">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Prompt for Comparison
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="Enter coding task or question to compare across models..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--text-tertiary)]">Selected Models:</span>
              {allModels.map((m) => {
                const isChecked = selectedModelIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleToggleModel(m.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: isChecked ? 'var(--accent-violet-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${isChecked ? 'rgba(124,58,237,0.4)' : 'var(--border-subtle)'}`,
                      color: isChecked ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}
                  >
                    {isChecked && <Check className="w-3 h-3 text-[var(--accent-violet-light)]" />}
                    {m.displayName}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleRunComparison}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'var(--gradient-brand)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Solutions...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Compare Solutions
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Side-by-Side Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[var(--text-tertiary)]">
              <Sparkles className="w-8 h-8 mb-2 text-[var(--text-disabled)]" />
              <p className="text-sm">Click "Compare Solutions" to test responses from multiple models simultaneously.</p>
            </div>
          )}

          {loading && (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[var(--accent-cyan)]">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-[var(--accent-cyan)]" />
              <p className="text-sm font-medium">Running models simultaneously...</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Collecting architectural plans and code snippets</p>
            </div>
          )}

          {results.length > 0 && !loading && (
            <div className={`grid gap-4 ${results.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
              {results.map((res, idx) => (
                <div
                  key={res.modelId}
                  className="flex flex-col rounded-xl overflow-hidden border transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: appliedIndex === idx ? 'var(--status-success)' : 'var(--border-subtle)',
                  }}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-panel)] border-b border-[var(--border-subtle)]">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {res.model.displayName}
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-tertiary)] uppercase">
                          {res.model.provider}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-mono">
                        {res.durationMs}ms {res.tokens ? `• ${res.tokens.output} tokens` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 p-4 overflow-y-auto max-h-96 text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap leading-relaxed">
                    {res.error ? (
                      <div className="text-red-400">Error: {res.error}</div>
                    ) : (
                      res.content
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <button
                      onClick={() => handleUseSolution(res, idx)}
                      disabled={appliedIndex === idx}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: appliedIndex === idx ? 'rgba(16,185,129,0.2)' : 'var(--accent-violet-dim)',
                        color: appliedIndex === idx ? '#10b981' : 'var(--accent-violet-light)',
                        border: `1px solid ${appliedIndex === idx ? 'rgba(16,185,129,0.4)' : 'rgba(124,58,237,0.3)'}`,
                      }}
                    >
                      {appliedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Solution Applied
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5" />
                          Use This Solution
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
