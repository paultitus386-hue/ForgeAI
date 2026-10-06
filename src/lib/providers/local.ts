// ============================================================
// ForgeAI — Local Model Provider Implementation (Ollama / Local AI)
// ============================================================

import { AIModelDefinition } from '../types';
import { ModelRegistry } from '../model-registry';
import {
  LLMProviderInterface,
  LLMMessage,
  LLMResponse,
  ProviderCompletionOptions,
} from './base';

export class LocalProvider implements LLMProviderInterface {
  readonly provider = 'local' as const;
  readonly name = 'Local AI';

  getAvailableModels(): AIModelDefinition[] {
    return ModelRegistry.getByProvider('local');
  }

  async validateCredentials(): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', { method: 'GET' });
      if (response.ok) {
        return { valid: true, message: 'Connected to local Ollama instance' };
      }
      return { valid: false, message: 'Ollama endpoint returned non-200 status' };
    } catch {
      return { valid: false, message: 'Cannot reach Ollama at http://localhost:11434' };
    }
  }

  async generate(
    messages: LLMMessage[],
    options: ProviderCompletionOptions
  ): Promise<LLMResponse> {
    const { model, systemPrompt, baseUrl } = options;
    const url = baseUrl || 'http://localhost:11434/api/chat';

    try {
      const formattedMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.replace('ollama/', ''),
          messages: formattedMessages,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('Local Ollama server returned an error');
      const data = await response.json();
      return {
        content: data.message?.content ?? '',
        model: model || 'ollama/llama3',
        provider: 'local',
      };
    } catch (err: any) {
      throw new Error(`Local model error: ${err.message}`);
    }
  }
}
