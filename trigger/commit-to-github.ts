import { logger, schemaTask } from '@trigger.dev/sdk';
import { z } from 'zod';
import {
  batchUpdateFiles,
  defaultGitHubConfig,
} from '@/lib/services/github-api';

const commitToGitHubSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    }),
  ),
  message: z.string(),
});

export const commitToGitHubTask = schemaTask({
  id: 'commit-to-github',
  // 使用 queue 配置限制并发为 1，确保 GitHub 提交串行执行
  queue: {
    name: 'github-commits',
    concurrencyLimit: 1,
  },
  retry: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  schema: commitToGitHubSchema,
  run: async (payload) => {
    logger.log('Starting GitHub commit', {
      filesCount: payload.files.length,
      files: payload.files.map((f) => f.path),
      message: payload.message,
    });

    try {
      const result = await batchUpdateFiles({
        files: payload.files,
        message: payload.message,
        ...defaultGitHubConfig,
      });

      logger.log('GitHub commit completed', {
        commitSha: result.sha,
        commitUrl: result.url,
      });

      return {
        success: true,
        commitSha: result.sha,
        commitUrl: result.url,
      };
    } catch (error) {
      logger.error('GitHub commit failed', {
        error,
        files: payload.files.map((f) => f.path),
      });
      throw error;
    }
  },
});
