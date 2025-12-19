export const OPENROUTER_API_URL =
  'https://openrouter.ai/api/v1/chat/completions';

export const TRANSLATION_MODELS = {
  withThinking: 'z-ai/glm-4.5-air:free',
  default: 'mistralai/devstral-2512:free',
} as const;

export function buildTranslationSystemPrompt(
  targetLanguageName: string,
): string {
  return `You are a professional translator specializing in Japanese cultural content.

Translate the following content into ${targetLanguageName}:

Requirements:
1. Provide only the translation without explanations or meta-commentary
2. Preserve all placeholders in the exact format {{type.id}} (e.g., {{character.example}}, {{work.example}}) - do not translate or modify them
3. Maintain all Markdown formatting (headings, links, lists, bold, italic, etc.)
4. Produce natural, fluent translations appropriate for the target language
5. Preserve the original meaning and tone

Output only the translated text.`;
}

export function buildTranslationRequestBody(params: {
  text: string;
  targetLanguageName: string;
  enableThinking?: boolean;
  stream?: boolean;
  model?: string;
}): Record<string, unknown> {
  const {
    text,
    targetLanguageName,
    enableThinking = false,
    stream = false,
    model,
  } = params;

  const selectedModel =
    model ||
    (enableThinking
      ? TRANSLATION_MODELS.withThinking
      : TRANSLATION_MODELS.default);

  const requestBody: Record<string, unknown> = {
    model: selectedModel,
    messages: [
      {
        role: 'system',
        content: buildTranslationSystemPrompt(targetLanguageName),
      },
      {
        role: 'user',
        content: text,
      },
    ],
    stream,
  };

  if (enableThinking) {
    requestBody.reasoning = {
      enabled: true,
    };
  }

  return requestBody;
}

export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  return apiKey;
}

export function buildOpenRouterHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}
