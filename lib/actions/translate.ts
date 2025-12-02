'use server';

import { tasks } from '@trigger.dev/sdk/v3';
import { translateContentTask } from '@/trigger/translate-content';
import { TriggerContentTranslationParams } from '@/lib/schemas/translate-content';

export async function triggerContentTranslationAction(
  params: TriggerContentTranslationParams,
) {
  const { idempotencyKey, idempotencyKeyTTL = '60s', ...taskPayload } = params;

  await tasks.trigger<typeof translateContentTask>(
    'translate-content',
    taskPayload,
    {
      idempotencyKey,
      idempotencyKeyTTL,
    },
  );
}
