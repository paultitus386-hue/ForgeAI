// ============================================================
// ForgeAI — Zustand Global Store
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Project,
  ChatMessage,
  AgentState,
  AgentMode,
  AgentTask,
  AgentPlan,
  ActivityLogEntry,
  TerminalLine,
  ProjectFile,
  EnvVar,
  Permission,
  AppSettings,
  LLMSettings,
  LLMProvider,
  ProviderConnectionStatus,
  ModelUsageMetrics,
  FileDiff,
  ProjectVersion,
} from './types';
import { generateId } from './utils';

// ============================================================
// Initial Data
// ============================================================

const defaultPermissions: Permission[] = [
  { id: 'read-files', name: 'Read Files', description: 'Read workspace files', level: 'always' },
  { id: 'write-files', name: 'Write Files', description: 'Create and modify workspace files', level: 'always' },
  { id: 'run-commands', name: 'Run Terminal Commands', description: 'Execute development commands', level: 'ask' },
  { id: 'install-packages', name: 'Install Packages', description: 'Install npm/pip packages', level: 'ask' },
  { id: 'use-browser', name: 'Use Browser', description: 'Automate browser for testing', level: 'always' },
  { id: 'modify-config', name: 'Modify Configuration', description: 'Change project configuration files', level: 'ask' },
  { id: 'access-env', name: 'Access Environment Variables', description: 'Read environment variables', level: 'ask' },
];

const defaultLLMSettings: LLMSettings = {
  provider: 'openai',
  model: 'openai/gpt-6-astra',
  temperature: 0.7,
  maxTokens: 8192,
  apiKeys: {
    openai: '',
    anthropic: '',
    gemini: '',
    local: '',
  },
  autoModel: true,
  fallbackModels: ['openai/gpt-6-astra', 'anthropic/claude-fable-5', 'gemini/gemini-2.0-flash'],
  developerSettings: {
    timeoutMs: 60000,
    retryCount: 2,
    reasoningEffort: 'medium',
  },
};

const defaultSettings: AppSettings = {
  theme: 'dark',
  llm: defaultLLMSettings,
  permissions: defaultPermissions,
  workspaceDir: './workspace',
};

// ============================================================
// Store Types
// ============================================================

interface ForgeAIStore {
  // --- App State ---
  currentView: 'home' | 'workspace' | 'settings' | 'projects';
  setCurrentView: (view: 'home' | 'workspace' | 'settings' | 'projects') => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateLLMSettings: (llm: Partial<LLMSettings>) => void;
  updatePermission: (id: string, level: Permission['level']) => void;

  // --- Projects ---
  projects: Project[];
  activeProjectId: string | null;
  setActiveProject: (id: string) => void;
  createProject: (name: string, description: string, template?: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getActiveProject: () => Project | null;

  // --- Agent ---
  agentState: AgentState;
  setAgentState: (state: AgentState) => void;
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;
  currentPlan: AgentPlan | null;
  setCurrentPlan: (plan: AgentPlan | null) => void;
  currentTasks: AgentTask[];
  setCurrentTasks: (tasks: AgentTask[]) => void;
  updateTask: (id: string, updates: Partial<AgentTask>) => void;
  isAgentRunning: boolean;
  setIsAgentRunning: (running: boolean) => void;

  // --- Chat ---
  addMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (projectId: string, updates: Partial<ChatMessage>) => void;

  // --- Files ---
  activeFileId: string | null;
  setActiveFile: (id: string | null) => void;
  openTabs: string[];
  openTab: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  createFile: (projectId: string, path: string, content: string) => ProjectFile;
  updateFile: (projectId: string, fileId: string, content: string) => void;
  deleteFile: (projectId: string, fileId: string) => void;

  // --- Terminal ---
  addTerminalLine: (projectId: string, line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: (projectId: string) => void;

  // --- Activity Log ---
  addActivityLog: (projectId: string, entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;

  // --- Environment Variables ---
  addEnvVar: (projectId: string, envVar: Omit<EnvVar, 'id'>) => void;
  updateEnvVar: (projectId: string, id: string, updates: Partial<EnvVar>) => void;
  deleteEnvVar: (projectId: string, id: string) => void;
  toggleEnvVarVisibility: (projectId: string, id: string) => void;

  // --- Versions ---
  saveVersion: (projectId: string, title: string, description: string) => void;
  restoreVersion: (projectId: string, versionId: string) => void;

  // --- Diffs ---
  pendingDiffs: FileDiff[];
  setPendingDiffs: (diffs: FileDiff[]) => void;
  clearPendingDiffs: () => void;

  // --- UI Panels ---
  activePanel: 'terminal' | 'preview' | 'logs' | 'diff' | 'git';
  setActivePanel: (panel: 'terminal' | 'preview' | 'logs' | 'diff' | 'git') => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activityPanelCollapsed: boolean;
  setActivityPanelCollapsed: (collapsed: boolean) => void;

  // --- Multi-Model AI ---
  activeModel: string;
  setActiveModel: (model: string) => void;
  activeModelMetrics: ModelUsageMetrics | null;
  setActiveModelMetrics: (metrics: ModelUsageMetrics | null) => void;
  providerStatuses: Record<LLMProvider, ProviderConnectionStatus>;
  setProviderStatus: (provider: LLMProvider, status: ProviderConnectionStatus) => void;
  updateProviderApiKey: (provider: LLMProvider, key: string) => void;
  modelComparisonOpen: boolean;
  setModelComparisonOpen: (open: boolean) => void;
  setProjectPreferredModel: (projectId: string, modelId: string, fallbackModels?: string[], autoRouting?: boolean) => void;
}

// ============================================================
// Zustand Store
// ============================================================

export const useForgeStore = create<ForgeAIStore>()(
  persist(
    (set, get) => ({
      // --- App State ---
      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
      updateLLMSettings: (llm) =>
        set((state) => ({
          settings: { ...state.settings, llm: { ...state.settings.llm, ...llm } },
        })),
      updatePermission: (id, level) =>
        set((state) => ({
          settings: {
            ...state.settings,
            permissions: state.settings.permissions.map((p) =>
              p.id === id ? { ...p, level } : p
            ),
          },
        })),

      // --- Multi-Model AI ---
      activeModel: 'auto',
      setActiveModel: (model) => set({ activeModel: model }),
      activeModelMetrics: null,
      setActiveModelMetrics: (metrics) => set({ activeModelMetrics: metrics }),
      providerStatuses: {
        openai: { connected: false, checking: false },
        anthropic: { connected: false, checking: false },
        gemini: { connected: false, checking: false },
        local: { connected: false, checking: false },
      },
      setProviderStatus: (provider, status) =>
        set((state) => ({
          providerStatuses: { ...state.providerStatuses, [provider]: status },
        })),
      updateProviderApiKey: (provider, key) =>
        set((state) => ({
          settings: {
            ...state.settings,
            llm: {
              ...state.settings.llm,
              apiKeys: { ...state.settings.llm.apiKeys, [provider]: key },
            },
          },
        })),
      modelComparisonOpen: false,
      setModelComparisonOpen: (open) => set({ modelComparisonOpen: open }),
      setProjectPreferredModel: (projectId, modelId, fallbackModels, autoRouting) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  preferredModel: modelId,
                  fallbackModels: fallbackModels ?? p.fallbackModels,
                  autoRoutingEnabled: autoRouting ?? p.autoRoutingEnabled,
                }
              : p
          ),
        })),

      // --- Projects ---
      projects: [],
      activeProjectId: null,
      setActiveProject: (id) => {
        set({ activeProjectId: id, currentView: 'workspace', activeFileId: null, openTabs: [] });
      },
      createProject: (name, description, template) => {
        const project: Project = {
          id: generateId(),
          name,
          description,
          template: template as any,
          stack: '',
          status: 'active',
          files: [],
          versions: [],
          conversations: [],
          agentTasks: [],
          activityLog: [],
          terminalHistory: [],
          environmentVariables: [],
          settings: {
            autoSave: true,
            autoDeploy: false,
            lintOnSave: true,
            formatOnSave: true,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          projects: [...state.projects, project],
          activeProjectId: project.id,
          currentView: 'workspace',
        }));
        return project;
      },
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),
      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find((p) => p.id === activeProjectId) ?? null;
      },

      // --- Agent ---
      agentState: 'idle',
      setAgentState: (state) => set({ agentState: state }),
      agentMode: 'build',
      setAgentMode: (mode) => set({ agentMode: mode }),
      currentPlan: null,
      setCurrentPlan: (plan) => set({ currentPlan: plan }),
      currentTasks: [],
      setCurrentTasks: (tasks) => set({ currentTasks: tasks }),
      updateTask: (id, updates) =>
        set((state) => ({
          currentTasks: state.currentTasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      isAgentRunning: false,
      setIsAgentRunning: (running) => set({ isAgentRunning: running }),

      // --- Chat ---
      addMessage: (projectId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, conversations: [...p.conversations, newMessage] }
              : p
          ),
        }));
      },
      updateLastMessage: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const conversations = [...p.conversations];
            if (conversations.length === 0) return p;
            conversations[conversations.length - 1] = {
              ...conversations[conversations.length - 1],
              ...updates,
            };
            return { ...p, conversations };
          }),
        }));
      },

      // --- Files ---
      activeFileId: null,
      setActiveFile: (id) => set({ activeFileId: id }),
      openTabs: [],
      openTab: (fileId) =>
        set((state) => ({
          openTabs: state.openTabs.includes(fileId)
            ? state.openTabs
            : [...state.openTabs, fileId],
          activeFileId: fileId,
        })),
      closeTab: (fileId) =>
        set((state) => {
          const newTabs = state.openTabs.filter((t) => t !== fileId);
          const newActiveId =
            state.activeFileId === fileId
              ? newTabs[newTabs.length - 1] ?? null
              : state.activeFileId;
          return { openTabs: newTabs, activeFileId: newActiveId };
        }),
      createFile: (projectId, path, content) => {
        const parts = path.split('/');
        const name = parts[parts.length - 1];
        const ext = name.split('.').pop() ?? '';
        const languageMap: Record<string, string> = {
          ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
          html: 'html', css: 'css', scss: 'scss', json: 'json',
          md: 'markdown', py: 'python', sh: 'bash', sql: 'sql',
          yaml: 'yaml', yml: 'yaml', toml: 'toml',
        };
        const newFile: ProjectFile = {
          id: generateId(),
          name,
          path,
          content,
          language: (languageMap[ext] ?? 'plaintext') as any,
          isDirectory: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, files: [...p.files, newFile] } : p
          ),
        }));
        return newFile;
      },
      updateFile: (projectId, fileId, content) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  files: p.files.map((f) =>
                    f.id === fileId ? { ...f, content, updatedAt: new Date() } : f
                  ),
                }
              : p
          ),
        })),
      deleteFile: (projectId, fileId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, files: p.files.filter((f) => f.id !== fileId) }
              : p
          ),
        })),

      // --- Terminal ---
      addTerminalLine: (projectId, line) => {
        const newLine: TerminalLine = {
          ...line,
          id: generateId(),
          timestamp: new Date(),
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, terminalHistory: [...p.terminalHistory, newLine] }
              : p
          ),
        }));
      },
      clearTerminal: (projectId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, terminalHistory: [] } : p
          ),
        })),

      // --- Activity Log ---
      addActivityLog: (projectId, entry) => {
        const newEntry: ActivityLogEntry = {
          ...entry,
          id: generateId(),
          timestamp: new Date(),
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, activityLog: [...p.activityLog, newEntry] }
              : p
          ),
        }));
      },

      // --- Environment Variables ---
      addEnvVar: (projectId, envVar) => {
        const newVar: EnvVar = { ...envVar, id: generateId() };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, environmentVariables: [...p.environmentVariables, newVar] }
              : p
          ),
        }));
      },
      updateEnvVar: (projectId, id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  environmentVariables: p.environmentVariables.map((e) =>
                    e.id === id ? { ...e, ...updates } : e
                  ),
                }
              : p
          ),
        })),
      deleteEnvVar: (projectId, id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, environmentVariables: p.environmentVariables.filter((e) => e.id !== id) }
              : p
          ),
        })),
      toggleEnvVarVisibility: (projectId, id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  environmentVariables: p.environmentVariables.map((e) =>
                    e.id === id ? { ...e, isVisible: !e.isVisible } : e
                  ),
                }
              : p
          ),
        })),

      // --- Versions ---
      saveVersion: (projectId, title, description) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const version: ProjectVersion = {
          id: generateId(),
          sessionNumber: project.versions.length + 1,
          title,
          description,
          createdAt: new Date(),
          files: [...project.files],
          snapshot: Object.fromEntries(project.files.map((f) => [f.path, f.content])),
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, versions: [...p.versions, version] } : p
          ),
        }));
      },
      restoreVersion: (projectId, versionId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const version = project.versions.find((v) => v.id === versionId);
        if (!version) return;
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, files: version.files, updatedAt: new Date() }
              : p
          ),
        }));
      },

      // --- Diffs ---
      pendingDiffs: [],
      setPendingDiffs: (diffs) => set({ pendingDiffs: diffs }),
      clearPendingDiffs: () => set({ pendingDiffs: [] }),

      // --- UI Panels ---
      activePanel: 'terminal',
      setActivePanel: (panel) => set({ activePanel: panel }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      activityPanelCollapsed: false,
      setActivityPanelCollapsed: (collapsed) => set({ activityPanelCollapsed: collapsed }),
    }),
    {
      name: 'forgeai-store',
      partialize: (state) => ({
        projects: state.projects,
        settings: state.settings,
        currentView: state.currentView,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
