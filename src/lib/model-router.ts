// ============================================================
// ForgeAI — Intelligent Model Router
// Analyzes tasks, estimates capability requirements,
// selects optimal models, and manages graceful fallbacks.
// ============================================================

import {
  AIModelDefinition,
  ModelRoutingDecision,
  TaskCategory,
  TaskRequirements,
} from './types';
import { ModelRegistry } from './model-registry';

export class ModelRouter {
  /**
   * Estimates task requirements based on prompt semantics, project state, and complexity indicators.
   */
  static estimateTaskRequirements(
    taskDescription: string,
    context?: { fileCount?: number; stack?: string }
  ): TaskRequirements {
    const text = taskDescription.toLowerCase();

    // 1. Detect Category
    let category: TaskCategory = 'coding';
    if (text.includes('debug') || text.includes('error') || text.includes('fix') || text.includes('broken') || text.includes('failing')) {
      category = 'debugging';
    } else if (text.includes('architecture') || text.includes('design') || text.includes('system') || text.includes('scale') || text.includes('monorepo')) {
      category = 'architecture';
    } else if (text.includes('refactor') || text.includes('clean') || text.includes('modular') || text.includes('restructure') || text.includes('split')) {
      category = 'refactoring';
    } else if (text.includes('test') || text.includes('vitest') || text.includes('jest') || text.includes('cypress') || text.includes('qa')) {
      category = 'testing';
    } else if (text.includes('doc') || text.includes('readme') || text.includes('comment') || text.includes('explain') || text.includes('tutorial')) {
      category = 'documentation';
    } else if (text.includes('browser') || text.includes('automate') || text.includes('click') || text.includes('navigate') || text.includes('e2e')) {
      category = 'browser';
    } else if (text.includes('computer use') || text.includes('desktop') || text.includes('terminal') || text.includes('os')) {
      category = 'computer-use';
    } else if (text.includes('algorithm') || text.includes('math') || text.includes('analyze') || text.includes('proof') || text.includes('reason')) {
      category = 'reasoning';
    } else if (text.includes('image') || text.includes('diagram') || text.includes('visual') || text.includes('screenshot') || text.includes('ui look')) {
      category = 'vision';
    }

    // 2. Assess Complexity
    const wordCount = taskDescription.trim().split(/\s+/).length;
    const fileCount = context?.fileCount ?? 0;
    let complexity: 'low' | 'medium' | 'high' = 'medium';

    if (
      wordCount > 35 ||
      fileCount > 10 ||
      text.includes('production') ||
      text.includes('full-stack') ||
      text.includes('complete') ||
      category === 'architecture'
    ) {
      complexity = 'high';
    } else if (wordCount < 8 && fileCount < 3) {
      complexity = 'low';
    }

    // 3. Capability Requirements
    const needsComputerUse = category === 'computer-use' || text.includes('computer use');
    const needsVision = category === 'vision' || text.includes('image') || text.includes('screenshot');
    const needsTools = category !== 'documentation';
    const needsReasoning = complexity === 'high' || category === 'architecture' || category === 'debugging';

    // 4. Recommendation Mapping
    let recommendedModelId = 'openai/gpt-6-astra';
    let reasoning = 'High-complexity task requiring deep agent reasoning and tool coordination.';

    if (text.includes('google') || text.includes('firebase') || text.includes('gemini') || text.includes('gcp') || text.includes('bigquery')) {
      recommendedModelId = 'gemini/gemini-2.0-flash';
      reasoning = 'Google Cloud / Gemini ecosystem task optimized for fast multimodal turnaround.';
    } else if (category === 'refactoring' || (category === 'coding' && fileCount > 5)) {
      recommendedModelId = 'anthropic/claude-fable-5';
      reasoning = 'Large codebase understanding and multi-file refactoring best suited for Claude Fable 5.';
    } else if (needsComputerUse || category === 'architecture' || complexity === 'high') {
      recommendedModelId = 'openai/gpt-6-astra';
      reasoning = 'Advanced reasoning, agent workflows, and computer/tool use best handled by GPT-6 Astra.';
    } else if (complexity === 'low') {
      recommendedModelId = 'gemini/gemini-2.0-flash';
      reasoning = 'Fast, lightweight modification optimized for minimal latency.';
    }

    return {
      category,
      complexity,
      needsComputerUse,
      needsVision,
      needsTools,
      needsReasoning,
      recommendedModelId,
      reasoning,
    };
  }

  /**
   * Ranks available models according to compatibility with estimated task requirements.
   */
  static rankAvailableModels(
    requirements: TaskRequirements,
    models: AIModelDefinition[]
  ): AIModelDefinition[] {
    return [...models].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Capability Match Scoring
      if (requirements.needsComputerUse) {
        if (a.capabilities.supportsComputerUse) scoreA += 50;
        if (b.capabilities.supportsComputerUse) scoreB += 50;
      }
      if (requirements.needsVision) {
        if (a.capabilities.supportsVision) scoreA += 30;
        if (b.capabilities.supportsVision) scoreB += 30;
      }
      if (requirements.needsTools) {
        if (a.capabilities.supportsTools) scoreA += 25;
        if (b.capabilities.supportsTools) scoreB += 25;
      }
      if (requirements.needsReasoning) {
        if (a.capabilities.reasoning) scoreA += 20;
        if (b.capabilities.reasoning) scoreB += 20;
      }

      // Explicit ID recommendation bonus
      if (a.id === requirements.recommendedModelId || a.modelId === requirements.recommendedModelId) scoreA += 100;
      if (b.id === requirements.recommendedModelId || b.modelId === requirements.recommendedModelId) scoreB += 100;

      return scoreB - scoreA;
    });
  }

  /**
   * Main selection router: determines which model will execute the task.
   */
  static selectModel(
    taskDescription: string,
    options: {
      requestedModelId?: string; // 'auto', specific model ID, or undefined
      isAuto?: boolean;
      projectPreferredModel?: string;
      fallbackChain?: string[];
      availableModels?: AIModelDefinition[];
      fileCount?: number;
    }
  ): ModelRoutingDecision {
    const available = options.availableModels ?? ModelRegistry.getEnabled();
    const requirements = this.estimateTaskRequirements(taskDescription, {
      fileCount: options.fileCount,
    });

    const isAuto =
      options.isAuto ||
      options.requestedModelId === 'auto' ||
      !options.requestedModelId;

    let selectedModel: AIModelDefinition;
    let reasoning = '';

    if (!isAuto && options.requestedModelId) {
      // User explicitly selected a model
      const found = ModelRegistry.getById(options.requestedModelId);
      if (found && found.enabled) {
        selectedModel = found;
        reasoning = `User-selected model: ${found.displayName}`;
      } else {
        // Fallback to project preferred or default
        selectedModel = ModelRegistry.getDefaultModel();
        reasoning = `Requested model not found. Using default: ${selectedModel.displayName}`;
      }
    } else if (options.projectPreferredModel) {
      const preferred = ModelRegistry.getById(options.projectPreferredModel);
      if (preferred && preferred.enabled) {
        selectedModel = preferred;
        reasoning = `Project preferred model: ${preferred.displayName}`;
      } else {
        const ranked = this.rankAvailableModels(requirements, available);
        selectedModel = ranked[0] || ModelRegistry.getDefaultModel();
        reasoning = `Auto-routed: ${requirements.reasoning}`;
      }
    } else {
      // Auto mode with dynamic ranking
      const ranked = this.rankAvailableModels(requirements, available);
      selectedModel = ranked[0] || ModelRegistry.getDefaultModel();
      reasoning = `Auto-routed: ${requirements.reasoning}`;
    }

    // Compute fallback chain excluding the selected model
    const fallbackChain = (options.fallbackChain || [])
      .filter((id) => id !== selectedModel.id && id !== selectedModel.modelId)
      .concat(
        ModelRegistry.getFallbackChain(selectedModel.id)
          .map((m) => m.id)
          .filter((id) => !options.fallbackChain?.includes(id))
      );

    return {
      selectedModelId: selectedModel.id,
      selectedModel,
      isAuto,
      reasoning,
      requirements,
      fallbackChain,
    };
  }

  /**
   * Handles automatic fallback when the primary model fails or is unavailable.
   */
  static handleFallback(
    failedModelId: string,
    fallbackChain: string[],
    attemptedIds: Set<string> = new Set()
  ): { fallbackModel: AIModelDefinition | null; notificationMessage: string } {
    attemptedIds.add(failedModelId);

    const failedDef = ModelRegistry.getById(failedModelId);
    const failedName = failedDef?.displayName ?? failedModelId;

    for (const nextId of fallbackChain) {
      if (!attemptedIds.has(nextId)) {
        const candidate = ModelRegistry.getById(nextId);
        if (candidate && candidate.enabled) {
          return {
            fallbackModel: candidate,
            notificationMessage: `${failedName} unavailable. ForgeAI switched to ${candidate.displayName}.`,
          };
        }
      }
    }

    return {
      fallbackModel: null,
      notificationMessage: `All configured models in fallback chain failed. Please check your API keys in Settings.`,
    };
  }
}
