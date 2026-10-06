// ============================================================
// ForgeAI — OpenAI Provider Implementation
// Supports GPT-6 Astra, Responses API & Chat Completions API
// ============================================================

import { AIModelDefinition } from '../types';
import { ModelRegistry } from '../model-registry';
import {
  LLMProviderInterface,
  LLMMessage,
  LLMResponse,
  ProviderCompletionOptions,
} from './base';

export class OpenAIProvider implements LLMProviderInterface {
  readonly provider = 'openai' as const;
  readonly name = 'OpenAI';

  getAvailableModels(): AIModelDefinition[] {
    return ModelRegistry.getByProvider('openai');
  }

  async validateCredentials(apiKey?: string): Promise<{ valid: boolean; message?: string }> {
    if (!apiKey) {
      return { valid: false, message: 'No OpenAI API key provided' };
    }

    try {
      const response = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', apiKey }),
      });

      const data = await response.json();
      return {
        valid: response.ok,
        message: data.message ?? (response.ok ? 'Connected successfully' : 'Validation failed'),
      };
    } catch (err: any) {
      return { valid: false, message: err.message ?? 'Network error validating OpenAI key' };
    }
  }

  async generate(
    messages: LLMMessage[],
    options: ProviderCompletionOptions
  ): Promise<LLMResponse> {
    const { model, temperature, maxTokens, systemPrompt, apiKey, baseUrl } = options;

    const response = await fetch('/api/llm/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt,
        model: model || 'gpt-6-astra',
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 4096,
        apiKey,
        baseUrl,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'OpenAI request failed' }));
      throw new Error(err.message ?? 'OpenAI API error');
    }

    const data = await response.json();
    return {
      content: data.content ?? '',
      model: model || 'gpt-6-astra',
      provider: 'openai',
      tokens: data.tokens,
      toolCalls: data.toolCalls,
    };
  }
}
