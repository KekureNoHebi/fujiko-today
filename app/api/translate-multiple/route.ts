import { NextRequest } from 'next/server';
import { translateContent } from '@/lib/services/translation/translate';
import { languageNames } from '@/lib/constants/term';
import type { LanguageCode } from '@/lib/types/term';
import type { TranslationResult } from '@/lib/types/translation';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';
import {
  replacePlaceholders,
  replaceTermsWithPlaceholders,
} from '@/lib/utils/content-helpers';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { text, targetLanguage, models } = await request.json();

  // Create a TransformStream for streaming responses
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start the translation process
  (async () => {
    try {
      // Fetch terms once for all translations
      const [sourceTermsData, targetTermsData] = await Promise.all([
        fetchDirectusTerms('ja' as LanguageCode),
        fetchDirectusTerms(targetLanguage as LanguageCode),
      ]);

      const directusTerms = Object.values(sourceTermsData).flat();
      const textWithPlaceholders = replaceTermsWithPlaceholders(
        text,
        directusTerms,
      );

      // Translate with all models in parallel
      const translationPromises = models.map(async (model: string) => {
        try {
          const translatedText = await translateContent({
            text: textWithPlaceholders,
            targetLanguage:
              languageNames[targetLanguage as LanguageCode] || targetLanguage,
            model,
          });

          const finalText = replacePlaceholders(
            translatedText,
            targetTermsData,
          );

          const result: TranslationResult = {
            model,
            result: finalText,
            error: undefined,
          };

          // Stream each result as it completes
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(result)}\n\n`),
          );

          return result;
        } catch (error) {
          const errorResult: TranslationResult = {
            model,
            result: '',
            error:
              error instanceof Error ? error.message : 'Translation failed',
          };

          // Stream error result
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(errorResult)}\n\n`),
          );

          return errorResult;
        }
      });

      // Wait for all translations to complete
      await Promise.all(translationPromises);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
