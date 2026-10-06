// ============================================================
// ForgeAI — Central Model Registry
// ============================================================

import { AIModelDefinition, LLMProvider } from './types';

export const INITIAL_MODELS: AIModelDefinition[] = [
  // ----- OpenAI -----
  {
    id: 'openai/gpt-6-astra',
    modelId: 'gpt-6-astra',
    displayName: 'GPT-6 Astra',
    provider: 'openai',
    description: 'Next-generation frontier reasoning model designed for autonomous agentic software development, complex problem-solving, and computer/tool use.',
    bestFor: [
      'Complex coding',
      'Reasoning',
      'Agent workflows',
      'Computer/tool use',
      'Deep architectural design',
    ],
    capabilities: {
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsCode: true,
      supportsComputerUse: true,
      reasoning: true,
    },
    contextWindow: 256000,
    pricingReference: {
      inputPer1M: 3.5,
      outputPer1M: 14.0,
    },
    enabled: true,
  },
  // ----- Anthropic -----
  {
    id: 'anthropic/claude-fable-5',
    modelId: 'claude-fable-5',
    displayName: 'Claude Fable 5',
    provider: 'anthropic',
    description: 'Leading-edge software engineering model with massive context retention, nuanced code understanding, and state-of-the-art multi-file refactoring.',
    bestFor: [
      'Coding',
      'Long workflows',
      'Code understanding',
      'Large project changes',
      'Refactoring & debugging',
    ],
    capabilities: {
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsCode: true,
      supportsComputerUse: true,
      reasoning: true,
    },
    contextWindow: 300000,
    pricingReference: {
      inputPer1M: 3.0,
      outputPer1M: 15.0,
    },
    enabled: true,
  },
  // ----- Google Gemini -----
  {
    id: 'gemini/gemini-2.0-flash',
    modelId: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash',
    provider: 'gemini',
    description: 'High-speed multimodal powerhouse optimized for rapid feedback loops, Google Cloud ecosystem workflows, and multimodal inputs.',
    bestFor: [
      'Google ecosystem',
      'General development',
      'Multimodal workflows',
      'Ultra-fast iterations',
    ],
    capabilities: {
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsCode: true,
      supportsComputerUse: false,
      reasoning: true,
    },
    contextWindow: 1048576,
    pricingReference: {
      inputPer1M: 0.1,
      outputPer1M: 0.4,
    },
    enabled: true,
  },
  {
    id: 'gemini/gemini-1.5-pro',
    modelId: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Enterprise multimodal reasoning model with a 2-million token context window for massive repository-wide codebases.',
    bestFor: [
      'Repository-wide analysis',
      'Long documents & audio/video',
      'Complex multi-file reasoning',
    ],
    capabilities: {
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsCode: true,
      supportsComputerUse: false,
      reasoning: true,
    },
    contextWindow: 2097152,
    pricingReference: {
      inputPer1M: 1.25,
      outputPer1M: 5.0,
    },
    enabled: true,
  },
  // ----- Local / Ollama -----
  {
    id: 'local/ollama-llama3',
    modelId: 'ollama/llama3',
    displayName: 'Llama 3 (Local)',
    provider: 'local',
    description: 'Open-weights offline local model running directly on your machine via Ollama with 100% privacy and zero latency costs.',
    bestFor: [
      '100% Offline development',
      'Air-gapped privacy',
      'Zero cost local experiments',
    ],
    capabilities: {
      supportsStreaming: true,
      supportsTools: false,
      supportsVision: false,
      supportsCode: true,
      supportsComputerUse: false,
      reasoning: false,
    },
    contextWindow: 32000,
    pricingReference: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
    enabled: true,
  },
];

export class ModelRegistry {
  private static models: Map<string, AIModelDefinition> = new Map(
    INITIAL_MODELS.map((m) => [m.id, m])
  );

  static getAll(): AIModelDefinition[] {
    return Array.from(this.models.values());
  }

  static getEnabled(): AIModelDefinition[] {
    return this.getAll().filter((m) => m.enabled);
  }

  static getById(id: string): AIModelDefinition | undefined {
    // Lookup by full composite id ('openai/gpt-6-astra') or by raw modelId ('gpt-6-astra')
    return (
      this.models.get(id) ||
      this.getAll().find((m) => m.modelId === id || m.id === id)
    );
  }

  static getByProvider(provider: LLMProvider): AIModelDefinition[] {
    return this.getAll().filter((m) => m.provider === provider && m.enabled);
  }

  static register(model: AIModelDefinition) {
    this.models.set(model.id, model);
  }

  static unregister(id: string) {
    this.models.delete(id);
  }

  static getDefaultModelForProvider(provider: LLMProvider): AIModelDefinition {
    const list = this.getByProvider(provider);
    return list[0] || INITIAL_MODELS[0];
  }

  static getDefaultModel(): AIModelDefinition {
    return INITIAL_MODELS[0]; // GPT-6 Astra
  }

  static getFallbackChain(excludeModelId?: string): AIModelDefinition[] {
    // Default fallback order: GPT-6 Astra -> Claude Fable 5 -> Gemini 2.0 Flash -> Local
    return this.getEnabled().filter((m) => m.id !== excludeModelId && m.modelId !== excludeModelId);
  }
}
