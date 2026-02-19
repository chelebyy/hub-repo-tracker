import { FastifyInstance } from 'fastify';
import { filesystemService } from './service.js';

export async function filesystemRoutes(app: FastifyInstance): Promise<void> {
    // GET /api/filesystem/list
    // Query: path (optional)
    app.get('/api/filesystem/list', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    path: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                path: { type: 'string' },
                                entries: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string' },
                                            path: { type: 'string' },
                                            isDirectory: { type: 'boolean' },
                                        },
                                    },
                                },
                                parent: { type: ['string', 'null'] },
                                error: { type: 'string', nullable: true },
                            },
                        },
                    },
                },
            },
        },
    }, async (request) => {
        const { path } = request.query as { path?: string };
        const result = await filesystemService.listDirectories(path);

        return {
            success: true,
            data: result,
        };
    });
}
