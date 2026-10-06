// ============================================================
// ForgeAI — Core Type Definitions
// ============================================================

// ----- Agent States -----
export type AgentState =
  | 'idle'
  | 'planning'
  | 'creating'
  | 'installing'
  | 'coding'
  | 'running'
  | 'testing'
  | 'debugging'
  | 'fixing'
  | 'completed'
  | 'failed'
  | 'paused';

// ----- Agent Modes -----
export type AgentMode = 'build' | 'plan' | 'fix' | 'explain' | 'refactor' | 'test' | 'deploy';

// ----- Task Status -----
export type TaskStatus = 'planned' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'skipped';

// ----- Command Safety -----
export type CommandSafety = 'SAFE' | 'CAUTION' | 'BLOCKED';

// ----- LLM Providers -----
export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'local';

// ----- File Types -----
export type FileLanguage =
  | 'javascript' | 'typescript' | 'jsx' | 'tsx'
  | 'html' | 'css' | 'scss' | 'less'
  | 'json' | 'markdown' | 'yaml' | 'toml'
  | 'python' | 'java' | 'cpp' | 'c' | 'rust' | 'go'
  | 'bash' | 'sql' | 'plaintext';

// ----- Project Templates -----
export type ProjectTemplate =
  | 'react-app'
  | 'nextjs-app'
  | 'python-app'
  | 'nodejs-api'
  | 'html-css-js'
  | 'portfolio'
  | 'dashboard'
  | 'chrome-extension'
  | 'cli-tool'
  | 'rest-api';

// ============================================================
// Core Data Structures
// ============================================================

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: FileLanguage;
  isDirectory: boolean;
  children?: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
  output?: string;
  error?: string;
}

export interface AgentPlan {
  id: string;
  title: string;
  steps: AgentTask[];
  createdAt: Date;
  stack?: string;
  reasoning?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolName?: string;
  toolOutput?: string;
  codeBlocks?: { language: string; code: string }[];
  plan?: AgentPlan;
  isStreaming?: boolean;
}

export interface TerminalLine {
  id: string;
  type: 'command' | 'stdout' | 'stderr' | 'info' | 'success' | 'error';
  content: string;
  timestamp: Date;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  details?: string;
  toolUsed?: string;
}

export interface ProjectVersion {
  id: string;
  sessionNumber: number;
  title: string;
  description: string;
  createdAt: Date;
  files: ProjectFile[];
  snapshot: Record<string, string>;
}

export interface FileDiff {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  oldContent?: string;
  newContent?: string;
  additions: number;
  deletions: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  template?: ProjectTemplate;
  stack?: string;
  status: 'active' | 'completed' | 'error' | 'archived';
  files: ProjectFile[];
  versions: ProjectVersion[];
  conversations: ChatMessage[];
  agentTasks: AgentTask[];
  activityLog: ActivityLogEntry[];
  terminalHistory: TerminalLine[];
  environmentVariables: EnvVar[];
  settings: ProjectSettings;
  previewUrl?: string;
  devServerPort?: number;
  preferredModel?: string;
  fallbackModels?: string[];
  autoRoutingEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
}

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  isVisible: boolean;
}

export interface ProjectSettings {
  autoSave: boolean;
  autoDeploy: boolean;
  lintOnSave: boolean;
  formatOnSave: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  level: 'always' | 'ask' | 'deny';
}

// ============================================================
// Multi-Model Architecture Types
// ============================================================

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsCode: boolean;
  supportsComputerUse: boolean;
  reasoning: boolean;
}

export interface PricingReference {
  inputPer1M: number;
  outputPer1M: number;
}

export interface AIModelDefinition {
  id: string;
  modelId: string;
  displayName: string;
  provider: LLMProvider;
  description: string;
  bestFor: string[];
  capabilities: ModelCapabilities;
  contextWindow: number;
  pricingReference?: PricingReference;
  enabled: boolean;
}

export type TaskCategory =
  | 'coding'
  | 'debugging'
  | 'architecture'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'browser'
  | 'computer-use'
  | 'reasoning'
  | 'vision';

export interface TaskRequirements {
  category: TaskCategory;
  complexity: 'low' | 'medium' | 'high';
  needsComputerUse: boolean;
  needsVision: boolean;
  needsTools: boolean;
  needsReasoning: boolean;
  recommendedModelId: string;
  reasoning: string;
}

export interface ModelRoutingDecision {
  selectedModelId: string;
  selectedModel: AIModelDefinition;
  isAuto: boolean;
  reasoning: string;
  requirements: TaskRequirements;
  fallbackChain: string[];
}

export interface ProviderConnectionStatus {
  connected: boolean;
  checking: boolean;
  lastTested?: Date;
  error?: string;
}

export interface ModelUsageMetrics {
  modelId: string;
  provider: LLMProvider;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

export interface DeveloperSettings {
  baseUrlOverrides?: Partial<Record<LLMProvider, string>>;
  timeoutMs: number;
  retryCount: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

export interface LLMSettings {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  apiKeys: Record<LLMProvider, string>;
  autoModel: boolean;
  fallbackModels: string[];
  developerSettings: DeveloperSettings;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  llm: LLMSettings;
  permissions: Permission[];
  workspaceDir: string;
}

// ============================================================
// Tool Call Results
// ============================================================

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  safety: CommandSafety;
}

export interface FileOperationResult {
  success: boolean;
  path: string;
  operation: 'create' | 'read' | 'write' | 'delete' | 'rename' | 'list';
  content?: string;
  error?: string;
}
