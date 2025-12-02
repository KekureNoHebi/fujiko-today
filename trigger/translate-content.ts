import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { translateContent } from '@/lib/services/translation/translate';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';
import { replaceTermsWithPlaceholders } from '@/lib/services/translation/replace-terms';
import { uploadMarkdownWithEnv } from '@/lib/services/open-list';
import { translateContentSchema } from '@/lib/schemas/translate-content';
import { languageNames } from '@/lib/constants/term';

export const translateContentTask = schemaTask({
  id: 'translate-content',
  maxDuration: 300,
  schema: translateContentSchema,
  run: async (payload, { ctx }) => {
    logger.log('Starting content translation', {
      textLength: payload.text.length,
      targetLanguage: payload.targetLanguage,
      sourceLanguage: payload.sourceLanguage,
      ctx,
    });

    let text = payload.text;

    if (
      payload.sourceLanguage &&
      payload.sourceLanguage !== payload.targetLanguage
    ) {
      logger.log('Fetching terms from Directus', {
        sourceLanguage: payload.sourceLanguage,
      });

      const directusData = await fetchDirectusTerms(payload.sourceLanguage);
      const directusTerms = Object.values(directusData).flat();

      logger.log('Replacing terms with placeholders', {
        terms: directusTerms,
      });

      text = replaceTermsWithPlaceholders(text, directusTerms);
    }

    const translatedText =
      payload.sourceLanguage !== payload.targetLanguage
        ? await translateContent({
            text,
            targetLanguage:
              languageNames[payload.targetLanguage] || payload.targetLanguage,
          })
        : text;

    logger.log('Translation completed', {
      originalLength: payload.text,
      translatedLength: translatedText,
    });

    if (payload.uploadPath) {
      logger.log('Uploading translated content', {
        uploadPath: payload.uploadPath,
      });
      try {
        await uploadMarkdownWithEnv(translatedText, payload.uploadPath);
        logger.log('Upload completed', {
          uploadPath: payload.uploadPath,
        });
      } catch (error) {
        logger.error('Upload failed', {
          uploadPath: payload.uploadPath,
          error,
        });
      }
    }

    if (payload.revalidatePath) {
      logger.log('Revalidating path', {
        path: payload.revalidatePath,
      });
      try {
        const revalidateUrl = `${process.env.APP_URL}/api/revalidate`;
        const response = await fetch(revalidateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-revalidate-secret': process.env.REVALIDATE_SECRET || '',
          },
          body: JSON.stringify({
            path: payload.revalidatePath,
          }),
        });

        if (!response.ok) {
          throw new Error(`Revalidation failed: ${response.statusText}`);
        }

        const result = await response.json();
        logger.log('Revalidation completed', result);
      } catch (error) {
        logger.error('Revalidation failed', {
          path: payload.revalidatePath,
          error,
        });
      }
    }

    return {
      translatedText,
      targetLanguage: payload.targetLanguage,
    };
  },
});
