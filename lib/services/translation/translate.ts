import { GoogleGenAI } from '@google/genai';

export interface TranslateContentInput {
  text: string;
  targetLanguage: string;
}

export async function translateContent(
  input: TranslateContentInput,
): Promise<string> {
  const { text, targetLanguage } = input;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    systemInstruction: [
      {
        text: `Translate the content sent by users into ${targetLanguage}. No need to explain. Keep placeholders.`,
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

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  let fullText = '';
  for await (const chunk of response) {
    fullText += chunk.text || '';
  }

  return fullText;
}
