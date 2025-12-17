import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { prompt, enableThinking = false } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 },
      );
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DASHSCOPE_API_KEY is not configured' },
        { status: 500 },
      );
    }

    const requestBody: Record<string, unknown> = {
      model: 'glm-4.5-air',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
    };

    // Enable thinking mode if requested
    if (enableThinking) {
      requestBody.enable_thinking = true;
    }

    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
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
