import { FastifyInstance } from 'fastify';
import { syncService } from './service.js';

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/sync - Sync all repos
  app.post('/api/sync', async (request, reply) => {
    const currentProgress = syncService.getProgress();

    if (currentProgress?.inProgress) {
      reply.code(409);
      return {
        success: false,
        error: {
          code: 'SYNC_IN_PROGRESS',
          message: 'A sync operation is already in progress',
        },
      };
    }

    // Run sync in background
    const syncPromise = syncService.syncAll();
    let jobId: string | undefined;

    // Get jobId from the initial sync state
    syncPromise.then(() => {}).catch(error => {
      request.log.error(error, 'Sync failed');
    });

    // Small delay to ensure jobId is set
    await new Promise(resolve => setTimeout(resolve, 10));
    const progress = syncService.getProgress();
    jobId = progress?.jobId;

    reply.code(202);
    return {
      success: true,
      message: 'Sync started',
      job_id: jobId,
    };
  });

  // POST /api/sync/:id - Sync single repo
  app.post('/api/sync/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', minimum: 1 },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const params = request.params as { id: number };
    const result = await syncService.syncRepo(params.id);

    if (!result.success) {
      reply.code(result.error === 'Repository not found' ? 404 : 500);
      return {
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: result.error,
        },
      };
    }

    return {
      success: true,
      data: result,
    };
  });

  // GET /api/sync/status - Get sync progress
  app.get('/api/sync/status', async () => {
    const progress = syncService.getProgress();
    const rateLimit = syncService.getRateLimitStatus();

    return {
      success: true,
      data: {
        progress,
        rateLimit,
      },
    };
  });
}
