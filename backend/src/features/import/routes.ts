import { FastifyInstance } from 'fastify';
import { importService } from './service.js';
import { importSchemas } from './schema.js';

export async function importRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/import/scan - Scan projects folder
  app.get('/api/import/scan', {
    schema: {
      response: {
        200: importSchemas.folderScanResult,
      },
    },
  }, async () => {
    const result = importService.scanProjectsFolder();

    return {
      success: true,
      data: result,
    };
  });
}
