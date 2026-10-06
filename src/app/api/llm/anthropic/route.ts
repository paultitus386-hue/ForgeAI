import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt, model, temperature, maxTokens, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ message: 'No Anthropic API key provided' }, { status: 401 });
    }

    // Format messages for Anthropic Messages API
    // Must alternate between user and assistant, system goes to top-level system parameter
    const anthropicMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

    if (anthropicMessages.length === 0) {
      anthropicMessages.push({ role: 'user', content: 'Hello' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-fable-5',
        max_tokens: maxTokens ?? 4096,
        temperature: temperature ?? 0.7,
        system: systemPrompt || undefined,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: 'Anthropic error' } }));
      return NextResponse.json(
        { message: err.error?.message ?? `Anthropic error (Status ${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '';

    return NextResponse.json({
      content,
      tokens: {
        input: data.usage?.input_tokens ?? 0,
        output: data.usage?.output_tokens ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
