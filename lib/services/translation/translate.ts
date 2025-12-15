export interface TranslateContentInput {
  text: string;
  targetLanguage: string;
  model?: string;
}

export async function translateContent(
  input: TranslateContentInput,
): Promise<string> {
  const { text, targetLanguage, model = 'z-ai/glm-4.5-air:free' } = input;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator specializing in Japanese cultural content.

Translate the following content into ${targetLanguage}:

Requirements:
1. Provide only the translation without explanations or meta-commentary
2. Preserve all placeholders in the exact format {{type.id}} (e.g., {{character.example}}, {{work.example}}) - do not translate or modify them
3. Maintain all Markdown formatting (headings, links, lists, bold, italic, etc.)
4. Produce natural, fluent translations appropriate for the target language
5. Preserve the original meaning and tone

Output only the translated text.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        reasoning: {
          enabled: true,
        },
      }),
    },
  );

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
