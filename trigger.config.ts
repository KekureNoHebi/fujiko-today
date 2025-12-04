import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: 'proj_kqsqisjscelexunsehrc',
  runtime: 'node',
  logLevel: 'log',
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 60000,
      maxTimeoutInMs: 180000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ['trigger'],
});
