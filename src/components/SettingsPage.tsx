'use client';

import { useState } from 'react';
import { useForgeStore } from '@/lib/store';
import { ModelRegistry } from '@/lib/model-registry';
import { LLMProvider, AIModelDefinition } from '@/lib/types';
import {
  ArrowLeft, Eye, EyeOff, Plus, Trash2, Save, Key, Cpu, Shield,
  Lock, Check, ChevronDown, Info, Sparkles, Loader2, RefreshCw,
  ExternalLink, Layers, Sliders, CheckCircle2, XCircle
} from 'lucide-react';

type SettingsTab = 'ai' | 'permissions' | 'environment' | 'developer' | 'about';

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'ai', label: 'AI Models', icon: <Cpu className="w-4 h-4" /> },
  { id: 'permissions', label: 'Permissions', icon: <Shield className="w-4 h-4" /> },
  { id: 'environment', label: 'Environment', icon: <Key className="w-4 h-4" /> },
  { id: 'developer', label: 'Developer', icon: <Sliders className="w-4 h-4" /> },
  { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
];

const PERMISSION_LEVELS = ['always', 'ask', 'deny'] as const;

export default function SettingsPage() {
  const {
    setCurrentView,
    settings,
    updateSettings,
    updateLLMSettings,
    updatePermission,
    getActiveProject,
    addEnvVar,
    updateEnvVar,
    deleteEnvVar,
    toggleEnvVarVisibility,
    updateProviderApiKey,
    providerStatuses,
    setProviderStatus,
    activeModel,
    setActiveModel,
  } = useForgeStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [saved, setSaved] = useState(false);
  const [visibleKeyProviders, setVisibleKeyProviders] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { testing: boolean; message?: string; success?: boolean }>>({});

  const project = getActiveProject();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddEnvVar = () => {
    if (!newKey.trim() || !project) return;
    addEnvVar(project.id, { key: newKey, value: newValue, isSecret, isVisible: !isSecret });
    setNewKey('');
    setNewValue('');
    setIsSecret(false);
  };

  const toggleKeyVisibility = (provider: string) => {
    setVisibleKeyProviders((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleTestConnection = async (provider: LLMProvider) => {
    const key = settings.llm.apiKeys?.[provider] || (settings.llm.provider === provider ? settings.llm.apiKey : '');
    setTestResults((prev) => ({ ...prev, [provider]: { testing: true } }));

    try {
      const response = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: key,
          baseUrl: settings.llm.developerSettings?.baseUrlOverrides?.[provider],
        }),
      });

      const data = await response.json();
      const success = response.ok && data.valid;

      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          success,
          message: data.message ?? (success ? 'Connected successfully' : 'Validation failed'),
        },
      }));

      setProviderStatus(provider, {
        connected: success,
        checking: false,
        lastTested: new Date(),
        error: success ? undefined : data.message,
      });
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          success: false,
          message: err.message ?? 'Network error testing connection',
        },
      }));
    }
  };

  const providers: {
    id: LLMProvider;
    label: string;
    icon: string;
    description: string;
    color: string;
  }[] = [
    {
      id: 'openai',
      label: 'OpenAI',
      icon: '⊛',
      description: 'GPT-6 Astra, Responses API & reasoning models',
      color: '#10a37f',
    },
    {
      id: 'anthropic',
      label: 'Anthropic',
      icon: '◈',
      description: 'Claude Fable 5, large-context coding & refactoring',
      color: '#d97706',
    },
    {
      id: 'gemini',
      label: 'Google Gemini',
      icon: '✦',
      description: 'Gemini 2.0 Flash, Gemini 1.5 Pro & multimodal workflows',
      color: '#06b6d4',
    },
    {
      id: 'local',
      label: 'Local (Ollama)',
      icon: '⊕',
      description: 'Private offline local models at http://localhost:11434',
      color: '#8b5cf6',
    },
  ];

  const allModels = ModelRegistry.getAll();

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setCurrentView(project ? 'workspace' : 'home')}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Settings</h1>
          <p className="text-xs text-[var(--text-tertiary)]">Multi-Model AI Configuration & Workspace Security</p>
        </div>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all"
          style={{ background: saved ? 'rgba(16,185,129,0.15)' : 'var(--gradient-brand)', color: saved ? '#10b981' : 'white' }}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <nav
          className="w-48 border-r border-[var(--border-subtle)] p-3 flex flex-col gap-1 flex-shrink-0"
          style={{ background: 'var(--bg-panel)' }}
        >
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left"
              style={{
                background: activeTab === tab.id ? 'var(--accent-violet-dim)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              <span style={{ color: activeTab === tab.id ? 'var(--accent-violet-light)' : 'inherit' }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl">
          {/* AI Models Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-8">
              {/* Auto-Routing Banner */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: 'var(--gradient-subtle)',
                  borderColor: 'rgba(124,58,237,0.3)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--accent-violet-dim)] text-[var(--accent-violet-light)] mt-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Intelligent Multi-Model Routing</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
                        When enabled, ForgeAI automatically estimates task requirements (e.g. computer use, multi-file refactoring, fast turnaround) and routes each prompt to the best available model.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateLLMSettings({ autoModel: !settings.llm.autoModel })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: settings.llm.autoModel ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                      color: 'white',
                    }}
                  >
                    {settings.llm.autoModel ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Provider Configuration Cards */}
              <div>
                <h2 className="text-base font-semibold text-white mb-1">AI Providers & API Keys</h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-4">
                  Configure authentication keys for each provider. Keys are stored safely and never leaked to chat or code.
                </p>

                <div className="space-y-4">
                  {providers.map((p) => {
                    const currentKey = settings.llm.apiKeys?.[p.id] ?? (settings.llm.provider === p.id ? settings.llm.apiKey ?? '' : '');
                    const isVisible = !!visibleKeyProviders[p.id];
                    const testStatus = testResults[p.id];
                    const isConnected = providerStatuses[p.id]?.connected;

                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl border transition-all"
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: 'var(--border-default)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg font-bold" style={{ color: p.color }}>
                              {p.icon}
                            </span>
                            <div>
                              <div className="text-sm font-semibold text-white flex items-center gap-2">
                                {p.label}
                                {isConnected ? (
                                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[var(--status-success)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" /> Connected
                                  </span>
                                ) : currentKey ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">
                                    Key configured
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-disabled)]">
                                    Simulation mode
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--text-tertiary)]">{p.description}</p>
                            </div>
                          </div>
                        </div>

                        {/* Input & Test Button */}
                        {p.id !== 'local' ? (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                              <input
                                type={isVisible ? 'text' : 'password'}
                                value={currentKey}
                                onChange={(e) => updateProviderApiKey(p.id, e.target.value)}
                                placeholder={`Enter ${p.label} API Key`}
                                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs outline-none font-mono"
                                style={{
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border-default)',
                                  color: 'var(--text-primary)',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(p.id)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-white"
                              >
                                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTestConnection(p.id)}
                              disabled={testStatus?.testing || !currentKey}
                              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                              style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-strong)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {testStatus?.testing ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Testing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Test Connection
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                            <span>Endpoint: <code>http://localhost:11434</code></span>
                            <button
                              type="button"
                              onClick={() => handleTestConnection('local')}
                              disabled={testStatus?.testing}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
                            >
                              {testStatus?.testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              Test Ollama
                            </button>
                          </div>
                        )}

                        {/* Test Status Feedback */}
                        {testStatus && !testStatus.testing && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs">
                            {testStatus.success ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-[var(--status-error)]" />
                            )}
                            <span style={{ color: testStatus.success ? 'var(--status-success)' : 'var(--status-error)' }}>
                              {testStatus.message}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Registry Overview */}
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Registered Models & Capabilities</h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-4">
                  Models available to ForgeAI across configured providers:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allModels.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border flex flex-col justify-between"
                      style={{
                        background: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-white">{m.displayName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-tertiary)] uppercase">
                            {m.provider}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-2.5">
                          {m.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-disabled)] font-mono">
                          {(m.contextWindow / 1000).toFixed(0)}k context
                        </span>
                        <div className="flex gap-1.5">
                          {m.capabilities.supportsTools && <span className="text-[var(--status-success)] font-medium">Tools</span>}
                          {m.capabilities.supportsComputerUse && <span className="text-[var(--accent-cyan)] font-medium">Computer</span>}
                          {m.capabilities.reasoning && <span className="text-[var(--accent-violet-light)] font-medium">Reasoning</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Agent Permissions</h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-4">Control what the AI agent is allowed to do without confirmation.</p>
              </div>
              {settings.permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{perm.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{perm.description}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--bg-base)' }}>
                    {PERMISSION_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => updatePermission(perm.id, lvl)}
                        className="px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-all"
                        style={{
                          background: perm.level === lvl ? 'var(--accent-violet-dim)' : 'transparent',
                          color: perm.level === lvl ? 'var(--accent-violet-light)' : 'var(--text-disabled)',
                          border: `1px solid ${perm.level === lvl ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Developer Settings Tab */}
          {activeTab === 'developer' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Developer & Advanced LLM Settings</h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-4">Configure custom base URLs, timeouts, and reasoning levels.</p>
              </div>

              {/* Timeout & Retries */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase">Timeout (ms)</label>
                  <input
                    type="number"
                    value={settings.llm.developerSettings?.timeoutMs ?? 60000}
                    onChange={(e) =>
                      updateLLMSettings({
                        developerSettings: {
                          ...settings.llm.developerSettings,
                          timeoutMs: parseInt(e.target.value) || 60000,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'white' }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase">Retry Count</label>
                  <input
                    type="number"
                    value={settings.llm.developerSettings?.retryCount ?? 2}
                    onChange={(e) =>
                      updateLLMSettings({
                        developerSettings: {
                          ...settings.llm.developerSettings,
                          retryCount: parseInt(e.target.value) || 2,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'white' }}
                  />
                </div>
              </div>

              {/* Reasoning Effort */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase">Reasoning Effort (GPT-6 Astra)</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        updateLLMSettings({
                          developerSettings: {
                            ...settings.llm.developerSettings,
                            reasoningEffort: level,
                          },
                        })
                      }
                      className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={{
                        background:
                          settings.llm.developerSettings?.reasoningEffort === level
                            ? 'var(--accent-violet-dim)'
                            : 'var(--bg-surface)',
                        color:
                          settings.llm.developerSettings?.reasoningEffort === level
                            ? 'var(--accent-violet-light)'
                            : 'var(--text-secondary)',
                        border: `1px solid ${
                          settings.llm.developerSettings?.reasoningEffort === level
                            ? 'rgba(124,58,237,0.4)'
                            : 'var(--border-subtle)'
                        }`,
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Environment Variables Tab */}
          {activeTab === 'environment' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Environment Variables</h2>
                <p className="text-xs text-[var(--text-tertiary)] mb-4">Project-specific environment variables for the workspace.</p>
              </div>

              {project ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="KEY (e.g. DATABASE_URL)"
                      className="flex-1 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'white' }}
                    />
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="VALUE"
                      className="flex-1 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'white' }}
                    />
                    <button
                      onClick={handleAddEnvVar}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                      style={{ background: 'var(--gradient-brand)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>

                  <div className="space-y-2 mt-4">
                    {project.environmentVariables.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-mono"
                      >
                        <span className="font-bold text-[var(--accent-cyan)]">{v.key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-secondary)]">{v.isVisible ? v.value : '••••••••'}</span>
                          <button onClick={() => toggleEnvVarVisibility(project.id, v.id)} className="text-[var(--text-tertiary)] hover:text-white">
                            {v.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => deleteEnvVar(project.id, v.id)} className="text-[var(--text-tertiary)] hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Open a workspace to manage project environment variables.</p>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4 max-w-xl text-xs text-[var(--text-secondary)] leading-relaxed">
              <h2 className="text-base font-semibold text-white">ForgeAI — Multi-Model AI Developer</h2>
              <p>
                ForgeAI is an autonomous developer agent platform engineered to plan, build, test, and ship complete software projects inside a local sandbox workspace.
              </p>
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                <div className="font-semibold text-white">Supported AI Providers:</div>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-tertiary)]">
                  <li><strong>OpenAI:</strong> GPT-6 Astra, Responses API & hosted shell capabilities</li>
                  <li><strong>Anthropic:</strong> Claude Fable 5, large-context coding & refactoring</li>
                  <li><strong>Google Gemini:</strong> Gemini 2.0 Flash & Gemini 1.5 Pro</li>
                  <li><strong>Local Models:</strong> Ollama / LM Studio offline integration</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
