import type { LanguageCode } from '@/lib/types/term';
import { languageNames } from '@/lib/constants/term';
import { getDirectusTermsAction } from '@/lib/actions/term';
import { createFullHalfWidthPattern } from '@/lib/utils/content-helpers';

/**
 * Builds the prompt text
 * @internal - Use generateTranslationPrompt instead for most cases
 */
function buildPromptText(
  targetLangName: string,
  termLines: string[],
  text?: string,
): string {
  let prompt = `Please translate the following text into ${targetLangName}.

1. Provide only the translation without explanations or meta-commentary
2. Maintain the original meaning and tone
3. Use natural, fluent expressions
4. **IMPORTANT**: Use the exact terminology translations provided below - do not translate these terms differently
5. Keep the markdown formatting intact

The following terms must be translated exactly as specified:

`;

  if (termLines.length > 0) {
    prompt += termLines.join('\n') + '\n\n';
  } else {
    prompt += '(No terminology reference available)\n\n';
  }

  prompt += 'Text to Translate:\n\n';

  if (text) {
    prompt += text;
  }

  return prompt;
}

export async function generateTranslationPrompt({
  sourceLanguage = 'ja',
  targetLanguage,
  text,
}: {
  sourceLanguage?: LanguageCode;
  targetLanguage: LanguageCode;
  text: string;
}): Promise<string> {
  const targetLangName = languageNames[targetLanguage] || targetLanguage;

  try {
    const [sourceData, targetData] = await Promise.all([
      getDirectusTermsAction(sourceLanguage),
      getDirectusTermsAction(targetLanguage),
    ]);

    const sourceTerms = Object.values(sourceData).flat();
    const targetTerms = Object.values(targetData).flat();

    const targetTermMap = new Map(
      targetTerms.map((term) => [term.id, term.name]),
    );

    const termLines = sourceTerms
      .map((term) => {
        const targetName = targetTermMap.get(term.id);
        if (!targetName) return null;
        const pattern = createFullHalfWidthPattern(term.name);
        const regex = new RegExp(pattern);
        if (!regex.test(text)) return null;
        return `- ${term.name} → ${targetName}`;
      })
      .filter((line): line is string => line !== null);

    return buildPromptText(targetLangName, termLines, text);
  } catch {
    throw new Error('Failed to fetch terms from Directus');
  }
}
