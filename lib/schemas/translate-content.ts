import { z } from 'zod';
import { LANGUAGE_CODES } from '@/lib/types/term';

export const translateContentSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  targetLanguage: z.enum(LANGUAGE_CODES),
  sourceLanguage: z.enum(LANGUAGE_CODES).optional(),
  uploadPath: z.string().optional(),
  revalidatePath: z.string().optional(),
});

export type TranslateContentPayload = z.infer<typeof translateContentSchema>;

export const triggerContentTranslationSchema = translateContentSchema.extend({
  idempotencyKey: z.string().optional(),
  idempotencyKeyTTL: z.string().optional(),
});

export type TriggerContentTranslationParams = z.infer<
  typeof triggerContentTranslationSchema
>;
