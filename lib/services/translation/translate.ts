import {
  OPENROUTER_API_URL,
  TRANSLATION_MODELS,
  buildTranslationRequestBody,
  getOpenRouterApiKey,
  buildOpenRouterHeaders,
} from '@/lib/services/translation/openrouter';

export interface TranslateContentInput {
  text: string;
  targetLanguage: string;
  model?: string;
}

export async function translateContent(
  input: TranslateContentInput,
): Promise<string> {
  const {
    text,
    targetLanguage,
    model = TRANSLATION_MODELS.withThinking,
  } = input;

  const apiKey = getOpenRouterApiKey();

  const requestBody = buildTranslationRequestBody({
    text,
    targetLanguageName: targetLanguage,
    enableThinking: true,
    stream: false,
    model,
  });

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: buildOpenRouterHeaders(apiKey),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter API request failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from OpenRouter API');
  }

  return data.choices[0].message.content;
}
