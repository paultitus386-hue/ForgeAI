import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, baseUrl } = await req.json();

    if (!provider) {
      return NextResponse.json({ valid: false, message: 'Provider required' }, { status: 400 });
    }

    if (provider !== 'local' && !apiKey) {
      return NextResponse.json({ valid: false, message: 'API key is required' }, { status: 400 });
    }

    if (provider === 'openai') {
      try {
        const url = baseUrl ? `${baseUrl}/models` : 'https://api.openai.com/v1/models';
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (res.ok) {
          return NextResponse.json({ valid: true, message: 'Connected to OpenAI API' });
        } else {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({
            valid: false,
            message: err.error?.message ?? `OpenAI error (${res.status}: ${res.statusText})`,
          });
        }
      } catch (err: any) {
        return NextResponse.json({ valid: false, message: `Connection error: ${err.message}` });
      }
    }

    if (provider === 'anthropic') {
      try {
        // Anthropic: test with a minimal request or models endpoint
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        });

        if (res.ok) {
          return NextResponse.json({ valid: true, message: 'Connected to Anthropic API' });
        } else {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({
            valid: false,
            message: err.error?.message ?? `Anthropic error (${res.status}: ${res.statusText})`,
          });
        }
      } catch (err: any) {
        return NextResponse.json({ valid: false, message: `Connection error: ${err.message}` });
      }
    }

    if (provider === 'gemini') {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (res.ok) {
          return NextResponse.json({ valid: true, message: 'Connected to Google Gemini API' });
        } else {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({
            valid: false,
            message: err.error?.message ?? `Gemini error (${res.status}: ${res.statusText})`,
          });
        }
      } catch (err: any) {
        return NextResponse.json({ valid: false, message: `Connection error: ${err.message}` });
      }
    }

    if (provider === 'local') {
      try {
        const url = baseUrl || 'http://localhost:11434/api/tags';
        const res = await fetch(url);
        if (res.ok) {
          return NextResponse.json({ valid: true, message: 'Connected to local Ollama server' });
        } else {
          return NextResponse.json({ valid: false, message: `Ollama returned HTTP ${res.status}` });
        }
      } catch (err: any) {
        return NextResponse.json({ valid: false, message: `Cannot connect to local server: ${err.message}` });
      }
    }

    return NextResponse.json({ valid: false, message: `Unknown provider: ${provider}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ valid: false, message: error.message }, { status: 500 });
  }
}
