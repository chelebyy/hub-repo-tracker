import cron from 'node-cron';
import { config } from '../config/index.js';
import { syncService } from '../../features/sync/service.js';
import { logger } from '../logger.js';

let scheduledTask: cron.ScheduledTask | null = null;

export function startSyncJob(): void {
  if (scheduledTask) {
    logger.warn('Sync job already running');
    return;
  }

  const intervalMinutes = config.github.syncIntervalMinutes;

  // Validate interval (minimum 5 minutes to avoid rate limits)
  const safeInterval = Math.max(intervalMinutes, 5);

  // Create cron expression: run every N minutes
  const cronExpression = `*/${safeInterval} * * * *`;

  // Run immediately on startup
  logger.info('Starting initial sync on startup');
  void syncService.syncAll().catch(err => {
    logger.error({ error: err instanceof Error ? err.message : 'Unknown error' }, 'Initial sync failed');
  });

  scheduledTask = cron.schedule(cronExpression, async () => {
    logger.info('Starting scheduled sync');

    try {
      const result = await syncService.syncAll();
      logger.info(
        { completed: result.completed, total: result.total, failed: result.failed },
        'Scheduled sync completed'
      );
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error during scheduled sync');
    }
  });

  logger.info({ intervalMinutes: safeInterval }, 'Sync job scheduled');
}

export function stopSyncJob(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Sync job stopped');
  }
}

export function isSyncJobRunning(): boolean {
  return scheduledTask !== null;
}
