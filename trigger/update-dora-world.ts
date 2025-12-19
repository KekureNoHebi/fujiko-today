import { logger, schedules } from '@trigger.dev/sdk';
import { main } from '@/scripts/update-dora-world';
import { translateContentTask } from '@/trigger/translate-content';

export const updateDoraWorldTask = schedules.task({
  id: 'update-dora-world',
  cron: { pattern: '0 0,6-23 * * *', timezone: 'Asia/Tokyo' },
  maxDuration: 300,
  run: async (payload) => {
    logger.log('Starting scheduled dora-world update', {
      timestamp: payload.timestamp,
      lastRun: payload.lastTimestamp,
      nextRuns: payload.upcoming,
    });

    try {
      const result = await main();

      logger.log('dora-world update completed', {
        processedCount: result.processedCount,
        changedCount: result.changedCount,
        rawFilesUpdated: result.rawFilesUpdated,
        contentFilesUpdated: result.contentFilesUpdated,
        translationPayloadsCount: result.translationPayloads.length,
      });

      if (result.translationPayloads.length > 0) {
        logger.log('Triggering translation tasks', {
          count: result.translationPayloads.length,
        });

        let failureCount = 0;

        for (let i = 0; i < result.translationPayloads.length; i++) {
          const payload = result.translationPayloads[i];
          const progress = `[${i + 1}/${result.translationPayloads.length}]`;

          try {
            logger.log(`${progress} Starting translation task`, {
              targetLanguage: payload.targetLanguage,
              uploadPath: payload.uploadPath,
            });

            translateContentTask.trigger(payload);
          } catch (error) {
            failureCount++;
            logger.error(`${progress} Translation task threw error`, {
              error,
            });
          }
        }

        logger.log('Translation tasks completed', {
          total: result.translationPayloads.length,
          failed: failureCount,
        });

        return {
          ...result,
          translationResults: {
            total: result.translationPayloads.length,
            failed: failureCount,
          },
        };
      }

      return result;
    } catch (error) {
      logger.error('dora-world update failed', { error });
      throw error;
    }
  },
});
