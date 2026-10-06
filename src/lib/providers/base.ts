// ============================================================
// ForgeAI — Base LLM Provider Interface
// ============================================================

import { AIModelDefinition, LLMProvider } from '../types';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface LLMStreamEvent {
  type: 'delta' | 'done' | 'error';
  content?: string;
  error?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  tokens?: { input: number; output: number };
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
}

export interface ProviderCompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
  tools?: any[];
}

export interface LLMProviderInterface {
  readonly provider: LLMProvider;
  readonly name: string;
  generate(messages: LLMMessage[], options: ProviderCompletionOptions): Promise<LLMResponse>;
  stream?(
    messages: LLMMessage[],
    options: ProviderCompletionOptions,
    onChunk: (event: LLMStreamEvent) => void
  ): Promise<LLMResponse>;
  validateCredentials(apiKey?: string): Promise<{ valid: boolean; message?: string }>;
  getAvailableModels(): AIModelDefinition[];
}
