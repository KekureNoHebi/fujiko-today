import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const {
      text,
      targetLanguageName,
      enableThinking = false,
    } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!targetLanguageName) {
      return NextResponse.json(
        { error: 'Target language name is required' },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 },
      );
    }

    // Use different models based on thinking mode
    const model = enableThinking
      ? 'z-ai/glm-4.5-air:free'
      : 'mistralai/devstral-2512:free';

    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in Japanese cultural content.

Translate the following content into ${targetLanguageName}:

Requirements:
1. Provide only the translation without explanations or meta-commentary
2. Preserve all placeholders in the exact format {{type.id}} (e.g., {{character.example}}, {{work.example}}) - do not translate or modify them
3. Maintain all Markdown formatting (headings, links, lists, bold, italic, etc.)
4. Produce natural, fluent translations appropriate for the target language
5. Preserve the original meaning and tone

Output only the translated text.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      stream: true,
    };

    // Only add reasoning config for thinking-capable models
    if (enableThinking) {
      requestBody.reasoning = {
        enabled: true,
      };
    }

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `OpenRouter API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        },
        { status: response.status },
      );
    }

    // Return the streaming response
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
