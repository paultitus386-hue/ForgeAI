// ============================================================
// ForgeAI — Anthropic Provider Implementation
// Supports Claude Fable 5, Messages API & Large Context Workflows
// ============================================================

import { AIModelDefinition } from '../types';
import { ModelRegistry } from '../model-registry';
import {
  LLMProviderInterface,
  LLMMessage,
  LLMResponse,
  ProviderCompletionOptions,
} from './base';

export class AnthropicProvider implements LLMProviderInterface {
  readonly provider = 'anthropic' as const;
  readonly name = 'Anthropic';

  getAvailableModels(): AIModelDefinition[] {
    return ModelRegistry.getByProvider('anthropic');
  }

  async validateCredentials(apiKey?: string): Promise<{ valid: boolean; message?: string }> {
    if (!apiKey) {
      return { valid: false, message: 'No Anthropic API key provided' };
    }

    try {
      const response = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'anthropic', apiKey }),
      });

      const data = await response.json();
      return {
        valid: response.ok,
        message: data.message ?? (response.ok ? 'Connected successfully' : 'Validation failed'),
      };
    } catch (err: any) {
      return { valid: false, message: err.message ?? 'Network error validating Anthropic key' };
    }
  }

  async generate(
    messages: LLMMessage[],
    options: ProviderCompletionOptions
  ): Promise<LLMResponse> {
    const { model, temperature, maxTokens, systemPrompt, apiKey, baseUrl } = options;

    const response = await fetch('/api/llm/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt,
        model: model || 'claude-fable-5',
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 4096,
        apiKey,
        baseUrl,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Anthropic request failed' }));
      throw new Error(err.message ?? 'Anthropic API error');
    }

    const data = await response.json();
    return {
      content: data.content ?? '',
      model: model || 'claude-fable-5',
      provider: 'anthropic',
      tokens: data.tokens,
      toolCalls: data.toolCalls,
    };
  }
}
