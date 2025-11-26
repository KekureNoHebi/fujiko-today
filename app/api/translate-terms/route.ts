import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { LANGUAGE_CODES } from '@/lib/types/term';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const config = {
      thinkingConfig: {
        thinkingBudget: -1,
      },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        required: [...LANGUAGE_CODES],
        properties: Object.fromEntries(
          LANGUAGE_CODES.map((code) => [code, { type: Type.STRING }]),
        ),
      },
      systemInstruction: [
        {
          text: `Translate the Japanese text to multiple languages: English (en-US), Simplified Chinese (zh-CN), Traditional Chinese Taiwan (zh-TW), and Traditional Chinese Hong Kong (zh-HK). Return only the translations in the specified format.`,
        },
      ],
    };

    const model = 'gemini-2.5-flash-preview-09-2025';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    const result = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error translating text:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 },
    );
  }
}
