import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt, model, temperature, maxTokens, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ message: 'No API key provided' }, { status: 401 });
    }

    const allMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model ?? 'gpt-4o',
        messages: allMessages,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ message: err.error?.message ?? 'OpenAI error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      content: data.choices[0]?.message?.content ?? '',
      tokens: {
        input: data.usage?.prompt_tokens ?? 0,
        output: data.usage?.completion_tokens ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
