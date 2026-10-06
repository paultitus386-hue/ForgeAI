import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt, model, temperature, maxTokens, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ message: 'No API key provided' }, { status: 401 });
    }

    const formattedMessages = systemPrompt
      ? [{ role: 'user', parts: [{ text: systemPrompt + '\n\nUser: ' + messages[messages.length - 1]?.content }] }]
      : messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formattedMessages,
          generationConfig: {
            temperature: temperature ?? 0.7,
            maxOutputTokens: maxTokens ?? 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ message: err.error?.message ?? 'Gemini error' }, { status: response.status });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return NextResponse.json({
      content,
      tokens: {
        input: data.usageMetadata?.promptTokenCount ?? 0,
        output: data.usageMetadata?.candidatesTokenCount ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
