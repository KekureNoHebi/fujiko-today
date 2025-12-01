import { GoogleGenAI } from '@google/genai';
import { fetchDirectusTerms } from '@/lib/directus-terms';
import { replaceTermsWithPlaceholders } from '@/lib/replace-terms';

export interface TranslateContentInput {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export async function translateContent(
  input: TranslateContentInput,
): Promise<string> {
  const { text, targetLanguage, sourceLanguage = 'ja' } = input;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const directusData = await fetchDirectusTerms(sourceLanguage);
  const directusTerms = Object.values(directusData).flat();
  const textWithPlaceholders = replaceTermsWithPlaceholders(
    text,
    directusTerms,
  );

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

  const model = 'gemini-2.5-pro';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: textWithPlaceholders,
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
