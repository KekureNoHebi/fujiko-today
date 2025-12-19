import { NextRequest, NextResponse } from 'next/server';
import {
  OPENROUTER_API_URL,
  buildTranslationRequestBody,
  getOpenRouterApiKey,
  buildOpenRouterHeaders,
} from '@/lib/services/translation/openrouter';

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

    let apiKey: string;
    try {
      apiKey = getOpenRouterApiKey();
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'API key configuration error',
        },
        { status: 500 },
      );
    }

    const requestBody = buildTranslationRequestBody({
      text,
      targetLanguageName,
      enableThinking,
      stream: true,
    });

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: buildOpenRouterHeaders(apiKey),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `OpenRouter API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        },
        { status: response.status },
      );
    }

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
