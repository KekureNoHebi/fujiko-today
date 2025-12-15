'use server';

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
  DirectusTerm,
} from '@/lib/types/term';
import client from '@/lib/api/client';
import { validateSlug } from '@/lib/utils/slug';
import {
  COLLECTION_CONFIG,
  fetchDirectusTerms,
} from '@/lib/services/directus-terms';
import { checkAuth } from '@/lib/auth';

const OPENROUTER_MODEL = 'z-ai/glm-4.5-air:free';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function requireAuth() {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    throw new Error('Unauthorized');
  }
}

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  return apiKey;
}

async function callOpenRouterAPI<T>(
  text: string,
  systemInstruction: string,
  responseSchema: unknown,
): Promise<T> {
  const apiKey = getOpenRouterApiKey();

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: systemInstruction,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'response',
          strict: true,
          schema: responseSchema,
        },
      },
      reasoning: {
        enabled: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from AI');
  }

  return JSON.parse(content);
}

export async function analyzeTermsAction(request: {
  text: string;
}): Promise<AnalysisResult> {
  await requireAuth();

  try {
    const { text } = request;

    if (!text) {
      throw new Error('Text is required');
    }

    return await callOpenRouterAPI<AnalysisResult>(
      text,
      `Identify all terms appearing in the text, including but not limited to names of characters, name of famous persons, names of works, names of places, and names of objects.`,
      {
        type: 'object',
        required: ['terms'],
        properties: {
          terms: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type'],
              properties: {
                name: {
                  type: 'string',
                },
                type: {
                  type: 'string',
                  enum: TERM_TYPES,
                },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    );
  } catch (error) {
    console.error('Error analyzing terms:', error);
    throw new Error('Failed to analyze terms');
  }
}

export async function translateTermAction(request: {
  text: string;
}): Promise<Translations> {
  await requireAuth();

  try {
    const { text } = request;

    if (!text) {
      throw new Error('Text is required');
    }

    return await callOpenRouterAPI<Translations>(
      text,
      `Translate the Japanese text to multiple languages: English (en), Simplified Chinese (zh-CN), Traditional Chinese Taiwan (zh-TW), and Traditional Chinese Hong Kong (zh-HK). Return only the translations in the specified format.`,
      {
        type: 'object',
        required: [...LANGUAGE_CODES],
        properties: Object.fromEntries(
          LANGUAGE_CODES.map((code) => [code, { type: 'string' }]),
        ),
        additionalProperties: false,
      },
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
  await requireAuth();

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
