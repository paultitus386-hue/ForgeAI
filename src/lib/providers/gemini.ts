// ============================================================
// ForgeAI — Google Gemini Provider Implementation
// Supports Gemini 2.0 Flash, Gemini 1.5 Pro & Multimodal Workflows
// ============================================================

import { AIModelDefinition } from '../types';
import { ModelRegistry } from '../model-registry';
import {
  LLMProviderInterface,
  LLMMessage,
  LLMResponse,
  ProviderCompletionOptions,
} from './base';

export class GeminiProvider implements LLMProviderInterface {
  readonly provider = 'gemini' as const;
  readonly name = 'Google Gemini';

  getAvailableModels(): AIModelDefinition[] {
    return ModelRegistry.getByProvider('gemini');
  }

  async validateCredentials(apiKey?: string): Promise<{ valid: boolean; message?: string }> {
    if (!apiKey) {
      return { valid: false, message: 'No Gemini API key provided' };
    }

    try {
      const response = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini', apiKey }),
      });

      const data = await response.json();
      return {
        valid: response.ok,
        message: data.message ?? (response.ok ? 'Connected successfully' : 'Validation failed'),
      };
    } catch (err: any) {
      return { valid: false, message: err.message ?? 'Network error validating Gemini key' };
    }
  }

  async generate(
    messages: LLMMessage[],
    options: ProviderCompletionOptions
  ): Promise<LLMResponse> {
    const { model, temperature, maxTokens, systemPrompt, apiKey } = options;

    const response = await fetch('/api/llm/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt,
        model: model || 'gemini-2.0-flash-exp',
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 8192,
        apiKey,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Gemini request failed' }));
      throw new Error(err.message ?? 'Gemini API error');
    }

    const data = await response.json();
    return {
      content: data.content ?? '',
      model: model || 'gemini-2.0-flash-exp',
      provider: 'gemini',
      tokens: data.tokens,
      toolCalls: data.toolCalls,
    };
  }
}
