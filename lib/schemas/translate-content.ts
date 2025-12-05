import { z } from 'zod';
import { LANGUAGE_CODES } from '@/lib/types/term';

export const translateContentSchema = z
  .object({
    text: z.string().min(1, 'Text is required'),
    targetLanguage: z.enum(LANGUAGE_CODES),
    sourceLanguage: z.enum(LANGUAGE_CODES).optional(),
    uploadPath: z.string().optional(),
    uploadSourcePath: z.string().optional(),
    revalidatePath: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasUploadPath = !!data.uploadPath;
      const hasUploadSourcePath = !!data.uploadSourcePath;
      return hasUploadPath === hasUploadSourcePath;
    },
    {
      message:
        'uploadPath and uploadSourcePath must be provided together or both omitted',
      path: ['uploadPath'],
    },
  );

export type TranslateContentPayload = z.infer<typeof translateContentSchema>;

export const triggerContentTranslationSchema =
  translateContentSchema.safeExtend({
    idempotencyKey: z.string().optional(),
    idempotencyKeyTTL: z.string().optional(),
  });

export type TriggerContentTranslationParams = z.infer<
  typeof triggerContentTranslationSchema
>;
