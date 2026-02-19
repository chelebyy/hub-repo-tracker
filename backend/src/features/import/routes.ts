import { FastifyInstance } from 'fastify';
import { importService } from './service.js';
import { importSchemas } from './schema.js';

export async function importRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/import/scan - Scan projects folder
  app.get('/api/import/scan', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
      },
      response: {
        200: importSchemas.folderScanResult,
      },
    },
  }, async (request) => {
    const { path } = request.query as { path?: string };
    const result = importService.scanProjectsFolder(path);

    return {
      success: true,
      data: result,
    };
  });
}
