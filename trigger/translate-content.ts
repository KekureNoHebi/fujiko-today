import { logger, schemaTask } from '@trigger.dev/sdk';
import { translateContent } from '@/lib/services/translation/translate';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';
import { defaultGitHubConfig, fetchFile } from '@/lib/services/github-api';
import { translateContentSchema } from '@/lib/schemas/translate-content';
import { languageNames } from '@/lib/constants/term';
import { commitToGitHubTask } from '@/trigger/commit-to-github';
import { replaceTermsWithPlaceholders } from '@/lib/utils/content-helpers';

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

      const result = await fetchFile({
        path: payload.uploadSourcePath,
        ...defaultGitHubConfig,
      });

      if (result.status === 'not_found') {
        logger.log(
          'Source file does not exist yet - will be created during upload',
          { message: result.message },
        );
      } else if (result.status === 'error') {
        throw new Error(
          `Failed to check source file consistency: ${result.message}`,
        );
      } else if (result.data !== payload.text) {
        throw new Error(
          `Source file content mismatch: The file at ${payload.uploadSourcePath} exists but its content does not match the provided text. This may indicate the source has been modified since the translation was triggered.`,
        );
      } else {
        logger.log('Source file content verified - matches provided text');
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

        logger.log('Translation completed');
      }

      if (payload.uploadPath && payload.uploadSourcePath) {
        logger.log('Triggering GitHub commit task', {
          uploadPath: payload.uploadPath,
          uploadSourcePath: payload.uploadSourcePath,
        });

        const files = [];

        files.push({
          path: payload.uploadSourcePath,
          content: payload.text,
        });

        if (
          !payload.sourceLanguage ||
          payload.sourceLanguage !== payload.targetLanguage
        ) {
          files.push({
            path: payload.uploadPath,
            content: translatedText,
          });
        }

        const result = await commitToGitHubTask.triggerAndWait({
          files,
          message: `Update: ${payload.uploadPath} (${payload.targetLanguage})`,
        });

        if (result.ok) {
          logger.log('GitHub commit completed', {
            commitSha: result.output.commitSha,
          });
        } else {
          logger.error('GitHub commit failed', {
            error: result.error,
          });
        }
      }

      return {
        translatedText,
        targetLanguage: payload.targetLanguage,
      };
    } catch (error) {
      logger.error('Translation failed', { error });
      throw error;
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
  },
});
