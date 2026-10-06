'use client';

import { useState, useRef, useEffect } from 'react';
import { useForgeStore } from '@/lib/store';
import { ModelRegistry } from '@/lib/model-registry';
import { AIModelDefinition, LLMProvider } from '@/lib/types';
import {
  Sparkles, ChevronDown, Check, Info, Shield, Zap, Wrench,
  Eye, Terminal, Cpu, ArrowRight
} from 'lucide-react';

interface ModelSelectorProps {
  compact?: boolean;
  className?: string;
  showAuto?: boolean;
  onSelect?: (modelId: string) => void;
}

export default function ModelSelector({
  compact = false,
  className = '',
  showAuto = true,
  onSelect,
}: ModelSelectorProps) {
  const { activeModel, setActiveModel, settings, providerStatuses } = useForgeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<AIModelDefinition | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredModel(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allModels = ModelRegistry.getEnabled();
  const isAutoSelected = activeModel === 'auto';
  const selectedModelDef = !isAutoSelected ? ModelRegistry.getById(activeModel) : null;

  const handleSelect = (id: string) => {
    setActiveModel(id);
    onSelect?.(id);
    setIsOpen(false);
    setHoveredModel(null);
  };

  const getProviderIcon = (provider: LLMProvider) => {
    switch (provider) {
      case 'openai': return '⊛';
      case 'anthropic': return '◈';
      case 'gemini': return '✦';
      case 'local': return '⊕';
      default: return '●';
    }
  };

  const getProviderColor = (provider: LLMProvider) => {
    switch (provider) {
      case 'openai': return '#10a37f';
      case 'anthropic': return '#d97706';
      case 'gemini': return '#06b6d4';
      case 'local': return '#8b5cf6';
      default: return '#7c3aed';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
        }}
      >
        {isAutoSelected ? (
          <>
            <span className="flex items-center gap-1.5 text-[var(--accent-cyan)] font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Auto
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)]">
              Smart Route
            </span>
          </>
        ) : selectedModelDef ? (
          <>
            <span
              className="text-xs font-bold"
              style={{ color: getProviderColor(selectedModelDef.provider) }}
            >
              {getProviderIcon(selectedModelDef.provider)}
            </span>
            <span className="truncate max-w-[120px]">{selectedModelDef.displayName}</span>
          </>
        ) : (
          <span className="text-[var(--text-secondary)]">Select Model</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 w-80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
            <span>Choose AI Model</span>
            <span className="text-[10px] lowercase text-[var(--text-disabled)]">multi-provider</span>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {/* Auto Mode Option */}
            {showAuto && (
              <button
                type="button"
                onClick={() => handleSelect('auto')}
                onMouseEnter={() => setHoveredModel(null)}
                className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all ${
                  isAutoSelected ? 'bg-[var(--accent-cyan-dim)] border border-[rgba(6,182,212,0.3)]' : 'hover:bg-[var(--bg-hover)]'
                }`}
              >
                <div className="p-1.5 rounded-md bg-[rgba(6,182,212,0.15)] text-[var(--accent-cyan)] mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">Auto (Intelligent Router)</span>
                    {isAutoSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-cyan)] ml-auto" />}
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] leading-tight mt-0.5">
                    Dynamically chooses GPT-6 Astra, Claude Fable 5, or Gemini based on task requirements.
                  </p>
                </div>
              </button>
            )}

            {/* Individual Models */}
            {allModels.map((model) => {
              const isSelected = activeModel === model.id || activeModel === model.modelId;
              const hasKey = !!settings.llm.apiKeys?.[model.provider] || (settings.llm.provider === model.provider && !!settings.llm.apiKey);
              const isLocal = model.provider === 'local';

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelect(model.id)}
                  onMouseEnter={() => setHoveredModel(model)}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-violet-dim)] border border-[rgba(124,58,237,0.3)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div
                    className="p-1.5 rounded-md text-xs font-bold mt-0.5 flex items-center justify-center w-6 h-6"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: getProviderColor(model.provider),
                    }}
                  >
                    {getProviderIcon(model.provider)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-white">{model.displayName}</span>
                      <span className="text-[10px] text-[var(--text-disabled)] font-mono">
                        {(model.contextWindow / 1000).toFixed(0)}k ctx
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-violet-light)] ml-auto" />}
                    </div>

                    {/* Best for tags */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {model.bestFor.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Model Information Preview Bar */}
          {hoveredModel && (
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] px-2 text-[11px] text-[var(--text-secondary)]">
              <div className="font-semibold text-white mb-0.5">{hoveredModel.displayName}</div>
              <p className="text-[10px] text-[var(--text-tertiary)] mb-1.5 leading-relaxed">
                {hoveredModel.description}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] flex-wrap">
                <span className="text-[var(--text-disabled)]">Supports:</span>
                {hoveredModel.capabilities.supportsTools && <span className="text-[#10b981]">✓ Tools</span>}
                {hoveredModel.capabilities.supportsCode && <span className="text-[#10b981]">✓ Code</span>}
                {hoveredModel.capabilities.supportsComputerUse && <span className="text-[var(--accent-cyan)]">✓ Computer Use</span>}
                {hoveredModel.capabilities.reasoning && <span className="text-[#a78bfa]">✓ Reasoning</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
