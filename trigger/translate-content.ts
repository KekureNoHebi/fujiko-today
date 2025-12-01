import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { z } from 'zod';
import { translateContent } from '@/lib/services/translation/translate';

export const translateContentTask = schemaTask({
  id: 'translate-content',
  maxDuration: 300, // 5 minutes max
  schema: z.object({
    text: z.string().min(1, 'Text is required'),
    targetLanguage: z.string().min(1, 'Target language is required'),
  }),
  run: async (payload, { ctx }) => {
    logger.log('Starting content translation', {
      textLength: payload.text.length,
      targetLanguage: payload.targetLanguage,
      ctx,
    });

    const translatedText = await translateContent({
      text: payload.text,
      targetLanguage: payload.targetLanguage,
    });

    logger.log('Translation completed', {
      originalLength: payload.text.length,
      translatedLength: translatedText.length,
    });

    return {
      translatedText,
      targetLanguage: payload.targetLanguage,
    };
  },
});
