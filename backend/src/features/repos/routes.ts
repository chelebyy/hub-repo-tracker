import { FastifyInstance } from 'fastify';
import { repoService } from './service.js';
import { repoSchemas, formatRepoResponse } from './schema.js';
import { importService } from '../import/service.js';

export async function repoRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/repos - List all repos
  app.get('/api/repos', {
    schema: {
      querystring: repoSchemas.listReposQuery,
      response: {
        200: repoSchemas.reposList,
      },
    },
  }, async (request, _reply) => {
    const query = request.query as {
      favorite?: boolean;
      has_updates?: boolean;
      category?: number;
      sort?: 'name' | 'last_sync' | 'created';
      order?: 'asc' | 'desc';
    };

    const result = repoService.list(query);

    return {
      success: true,
      data: result.repos.map(repo => ({
        ...repo,
        is_favorite: Boolean(repo.is_favorite),
        sync_state: repo.sync_state ? {
          ...repo.sync_state,
          has_updates: Boolean(repo.sync_state.has_updates),
        } : null,
      })),
      meta: result.meta,
    };
  });

  // POST /api/repos/preview - Preview repo from GitHub URL
  app.post('/api/repos/preview', {
    schema: {
      body: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            pattern: '^https://github\\.com/[\\w-]+/[\\w.-]+$',
          },
        },
        required: ['url'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                name: { type: 'string' },
                full_name: { type: 'string' },
                description: { type: ['string', 'null'] },
                stars: { type: 'integer' },
                avatar_url: { type: 'string' },
                suggested_version: { type: ['string', 'null'] },
                version_source: { type: ['string', 'null'], enum: ['release', 'tag', null] },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const body = request.body as { url: string };
    const preview = await repoService.preview(body.url);

    return {
      success: true,
      data: preview,
    };
  });

  // POST /api/repos/detect-version - Detect version from local path
  app.post('/api/repos/detect-version', {
    schema: {
      body: {
        type: 'object',
        properties: {
          path: { type: 'string', minLength: 1 },
        },
        required: ['path'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                version: { type: ['string', 'null'] },
                projectType: { type: 'string', enum: ['node', 'python', 'go', 'rust', 'unknown'] },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const body = request.body as { path: string };
    const result = importService.detectVersionFromPath(body.path);

    return {
      success: true,
      data: result,
    };
  });

  // GET /api/owners - Get all owners with repo counts
  app.get('/api/owners', async () => {
    const owners = repoService.getOwners();

    return {
      success: true,
      data: owners,
    };
  });

  // POST /api/repos - Create new repo
  app.post('/api/repos', {
    schema: {
      body: repoSchemas.createRepo,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: repoSchemas.repo,
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as { url: string; description?: string; category_id?: number; notes?: string; local_path?: string };
    const repo = repoService.create(body);

    reply.code(201);
    return {
      success: true,
      data: formatRepoResponse(repo),
    };
  });

  // GET /api/repos/:id - Get single repo
  app.get('/api/repos/:id', {
    schema: {
      params: repoSchemas.idParam,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: repoSchemas.repo,
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const repo = repoService.getById(params.id);

    return {
      success: true,
      data: formatRepoResponse(repo),
    };
  });

  // PUT /api/repos/:id - Update repo
  app.put('/api/repos/:id', {
    schema: {
      params: repoSchemas.idParam,
      body: repoSchemas.updateRepo,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: repoSchemas.repo,
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const body = request.body as { description?: string };
    const repo = repoService.update(params.id, body);

    return {
      success: true,
      data: formatRepoResponse(repo),
    };
  });

  // PATCH /api/repos/:id - Partial update (notes, category_id)
  app.patch('/api/repos/:id', {
    schema: {
      params: repoSchemas.idParam,
      body: {
        type: 'object',
        properties: {
          notes: { type: ['string', 'null'] },
          category_id: { type: ['integer', 'null'] },
          local_path: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: repoSchemas.repo,
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const body = request.body as { notes?: string | null; category_id?: number | null; local_path?: string | null };
    const repo = repoService.update(params.id, body);

    return {
      success: true,
      data: formatRepoResponse(repo),
    };
  });

  // DELETE /api/repos/:id - Delete repo
  app.delete('/api/repos/:id', {
    schema: {
      params: repoSchemas.idParam,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, _reply) => {
    const params = request.params as { id: number };
    repoService.delete(params.id);

    return { success: true };
  });

  // PATCH /api/repos/:id/favorite - Toggle favorite
  app.patch('/api/repos/:id/favorite', {
    schema: {
      params: repoSchemas.idParam,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: repoSchemas.repo,
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const repo = repoService.toggleFavorite(params.id);

    return {
      success: true,
      data: formatRepoResponse(repo),
    };
  });

  // POST /api/repos/:id/acknowledge - Acknowledge release/tag update
  app.post('/api/repos/:id/acknowledge', {
    schema: {
      params: repoSchemas.idParam,
      body: repoSchemas.acknowledgeRepo,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: repoSchemas.repo,
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const body = request.body as { version: string };
    const repo = repoService.acknowledgeRelease(params.id, body.version);

    return {
      success: true,
      data: formatRepoResponse(repo),
    };
  });

  // PATCH /api/repos/:id/installed-version - Update installed version
  app.patch('/api/repos/:id/installed-version', {
    schema: {
      params: repoSchemas.idParam,
      body: {
        type: 'object',
        properties: {
          installed_version: { type: ['string', 'null'], maxLength: 100 },
        },
        required: ['installed_version'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: repoSchemas.repo,
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const body = request.body as { installed_version: string | null };
    const repo = repoService.updateInstalledVersion(params.id, body);

    return {
      success: true,
      data: formatRepoResponse(repo),
    };
  });

  // GET /api/repos/:id/version-comparison - Get version comparison
  app.get('/api/repos/:id/version-comparison', {
    schema: {
      params: repoSchemas.idParam,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                installed_version: { type: ['string', 'null'] },
                latest_version: { type: ['string', 'null'] },
                comparison: { type: 'string', enum: ['major', 'minor', 'patch', 'none', 'ahead', 'unknown'] },
                has_update: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const comparison = repoService.getVersionComparison(params.id);

    return {
      success: true,
      data: comparison,
    };
  });
}
