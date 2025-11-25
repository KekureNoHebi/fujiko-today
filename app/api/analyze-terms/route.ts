import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

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
        required: ['terms'],
        properties: {
          terms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['name', 'type'],
              properties: {
                name: {
                  type: Type.STRING,
                },
                type: {
                  type: Type.STRING,
                  enum: ['character', 'person', 'work', 'object', 'other'],
                },
              },
            },
          },
        },
      },
      systemInstruction: [
        {
          text: `Identify all terms appearing in the text, including but not limited to names of characters, name of famous persons, names of works, and names of objects.`,
        },
      ],
    };

    const model = 'gemini-2.5-pro';
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

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = '';
    for await (const chunk of response) {
      fullText += chunk.text || '';
    }

    const result = JSON.parse(fullText);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing terms:', error);
    return NextResponse.json(
      { error: 'Failed to analyze terms' },
      { status: 500 },
    );
  }
}
