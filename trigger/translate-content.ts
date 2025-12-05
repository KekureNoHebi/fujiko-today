import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { translateContent } from '@/lib/services/translation/translate';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';
import { replaceTermsWithPlaceholders } from '@/lib/services/translation/replace-terms';
import {
  batchUpdateFilesOnConfiguredRepo,
  fetchMarkdownFromConfiguredRepo,
} from '@/lib/services/github-api';
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

    if (payload.uploadSourcePath) {
      logger.log('Checking source file consistency', {
        uploadSourcePath: payload.uploadSourcePath,
      });

      try {
        const existingContent = await fetchMarkdownFromConfiguredRepo(
          payload.uploadSourcePath,
        );

        if (existingContent.trim() !== payload.text.trim()) {
          const error = new Error(
            'Source file content mismatch: The provided text does not match the latest content in the repository. ' +
              'This may indicate that the source has been updated since this translation task was queued.',
          );
          logger.error('Source file validation failed', {
            uploadSourcePath: payload.uploadSourcePath,
            providedTextLength: payload.text.length,
            existingContentLength: existingContent.length,
          });
          throw error;
        }

        logger.log('Source file validation passed', {
          uploadSourcePath: payload.uploadSourcePath,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Failed to fetch file from GitHub')
        ) {
          logger.log(
            'Source file does not exist yet, allowing task to proceed',
            {
              uploadSourcePath: payload.uploadSourcePath,
            },
          );
        } else {
          throw error;
        }
      }
    }

    let text = payload.text;
    let translatedText = text;

    try {
      if (
        payload.sourceLanguage &&
        payload.sourceLanguage === payload.targetLanguage
      ) {
        logger.log(
          'Source and target languages are the same, skipping translation',
          {
            sourceLanguage: payload.sourceLanguage,
            targetLanguage: payload.targetLanguage,
          },
        );
      } else {
        if (payload.sourceLanguage) {
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

        translatedText = await translateContent({
          text,
          targetLanguage:
            languageNames[payload.targetLanguage] || payload.targetLanguage,
        });

        logger.log('Translation completed', {
          originalLength: payload.text,
          translatedLength: translatedText,
        });
      }

      if (payload.uploadPath && payload.uploadSourcePath) {
        logger.log('Uploading content to GitHub', {
          uploadPath: payload.uploadPath,
          uploadSourcePath: payload.uploadSourcePath,
        });
        try {
          if (
            payload.sourceLanguage &&
            payload.sourceLanguage === payload.targetLanguage
          ) {
            await batchUpdateFilesOnConfiguredRepo(
              [
                {
                  path: payload.uploadSourcePath,
                  content: payload.text,
                },
              ],
              `Update: ${payload.uploadSourcePath} (${payload.targetLanguage})`,
              'master',
            );
            logger.log(
              'Upload completed (source only, no translation needed)',
              {
                uploadSourcePath: payload.uploadSourcePath,
              },
            );
          } else {
            await batchUpdateFilesOnConfiguredRepo(
              [
                {
                  path: payload.uploadSourcePath,
                  content: payload.text,
                },
                {
                  path: payload.uploadPath,
                  content: translatedText,
                },
              ],
              `Update: ${payload.uploadPath} (${payload.targetLanguage})`,
              'master',
            );
            logger.log('Upload completed (source and translation)', {
              uploadPath: payload.uploadPath,
              uploadSourcePath: payload.uploadSourcePath,
            });
          }
        } catch (error) {
          logger.error('Upload failed', {
            uploadPath: payload.uploadPath,
            uploadSourcePath: payload.uploadSourcePath,
            error,
          });
        }
      }
    } finally {
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
    }

    return {
      translatedText,
      targetLanguage: payload.targetLanguage,
    };
  },
});
