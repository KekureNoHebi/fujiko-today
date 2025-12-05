'use server';

import { GoogleGenAI, Type } from '@google/genai';
import {
  TERM_TYPES,
  LANGUAGE_CODES,
  SUPPORTED_TERM_TYPES,
} from '@/lib/types/term';
import type {
  AnalysisResult,
  Translations,
  SupportedTermType,
  TranslationFormData,
} from '@/lib/types/term';
import client from '@/lib/api/client';
import { validateSlug } from '@/lib/utils/slug';
import {
  COLLECTION_CONFIG,
  fetchDirectusTerms,
} from '@/lib/services/directus-terms';
import type { DirectusTerm } from '@/lib/types/term';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
}

async function callGeminiAPI<T>(
  text: string,
  config: {
    responseSchema: unknown;
    systemInstruction: Array<{ text: string }>;
  },
  useStreaming = false,
): Promise<T> {
  const ai = getGeminiClient();

  const fullConfig = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    responseMimeType: 'application/json',
    ...config,
  };

  const contents = [
    {
      role: 'user',
      parts: [{ text }],
    },
  ];

  if (useStreaming) {
    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      config: fullConfig,
      contents,
    });

    let fullText = '';
    for await (const chunk of response) {
      fullText += chunk.text || '';
    }
    return JSON.parse(fullText);
  } else {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: fullConfig,
      contents,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from AI');
    }
    return JSON.parse(responseText);
  }
}

export async function analyzeTermsAction(request: {
  text: string;
}): Promise<AnalysisResult> {
  try {
    const { text } = request;

    if (!text) {
      throw new Error('Text is required');
    }

    return await callGeminiAPI<AnalysisResult>(
      text,
      {
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
                    enum: TERM_TYPES,
                  },
                },
              },
            },
          },
        },
        systemInstruction: [
          {
            text: `Identify all terms appearing in the text, including but not limited to names of characters, name of famous persons, names of works, names of places, and names of objects.`,
          },
        ],
      },
      true,
    );
  } catch (error) {
    console.error('Error analyzing terms:', error);
    throw new Error('Failed to analyze terms');
  }
}

export async function translateTermAction(request: {
  text: string;
}): Promise<Translations> {
  try {
    const { text } = request;

    if (!text) {
      throw new Error('Text is required');
    }

    return await callGeminiAPI<Translations>(
      text,
      {
        responseSchema: {
          type: Type.OBJECT,
          required: [...LANGUAGE_CODES],
          properties: Object.fromEntries(
            LANGUAGE_CODES.map((code) => [code, { type: Type.STRING }]),
          ),
        },
        systemInstruction: [
          {
            text: `Translate the Japanese text to multiple languages: English (en), Simplified Chinese (zh-CN), Traditional Chinese Taiwan (zh-TW), and Traditional Chinese Hong Kong (zh-HK). Return only the translations in the specified format.`,
          },
        ],
      },
      false,
    );
  } catch (error) {
    console.error('Error translating text:', error);
    throw new Error('Failed to translate text');
  }
}

type CollectionType = keyof typeof COLLECTION_CONFIG;

export async function saveTermAction(request: {
  type: SupportedTermType;
  formData: TranslationFormData;
  existingId?: string;
}): Promise<{
  success: boolean;
  itemId: string;
  message?: string;
}> {
  try {
    const { type, formData, existingId } = request;

    if (!SUPPORTED_TERM_TYPES.includes(type)) {
      throw new Error(
        'Invalid term type. Only character, person, and work are supported.',
      );
    }

    const endpoint = COLLECTION_CONFIG[type as CollectionType];
    const itemId = existingId || formData.id;

    if (!validateSlug(itemId)) {
      throw new Error(
        'Invalid ID format. Only lowercase letters, numbers, and dashes are allowed.',
      );
    }

    const translations = LANGUAGE_CODES.map((code) => ({
      languages_code: code,
      name: formData.translations[code],
    }));

    const payload = {
      id: itemId,
      status: 'published',
      translations,
    };

    if (existingId) {
      const response = await client.PATCH(`${endpoint}/{id}`, {
        params: {
          path: { id: itemId },
        },
        body: payload,
      });

      if (response.error) {
        console.error('Failed to update item:', response.error);
        throw new Error('Failed to update item');
      }
    } else {
      const response = await client.POST(endpoint, {
        body: payload,
      });

      if (response.error) {
        console.error('Failed to create item:', response.error);
        throw new Error('Failed to create item');
      }
    }

    return {
      success: true,
      itemId,
      message: 'Term saved successfully',
    };
  } catch (error) {
    console.error('Error saving term:', error);
    throw new Error(
      `Failed to save term: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function getDirectusTermsAction(
  languageCode: string = 'ja',
): Promise<Record<string, DirectusTerm[]>> {
  try {
    return await fetchDirectusTerms(languageCode);
  } catch (error) {
    console.error('Error fetching Directus terms:', error);
    throw new Error('Failed to fetch Directus terms');
  }
}
