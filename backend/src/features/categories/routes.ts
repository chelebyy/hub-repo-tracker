import { FastifyInstance } from 'fastify';
import { categoryService } from './service.js';
import { categorySchemas, formatCategoryResponse } from './schema.js';

export async function categoryRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/categories - List all categories
  app.get('/api/categories', {
    schema: {
      response: {
        200: categorySchemas.categoriesList,
      },
    },
  }, async () => {
    const categories = categoryService.list();

    return {
      success: true,
      data: categories.map(formatCategoryResponse),
    };
  });

  // POST /api/categories - Create new category
  app.post('/api/categories', {
    schema: {
      body: categorySchemas.createCategory,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: categorySchemas.category,
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as {
      name: string;
      type?: 'custom' | 'owner';
      color?: string;
      icon?: string;
      owner_name?: string;
    };

    const category = categoryService.create(body);

    reply.code(201);
    return {
      success: true,
      data: formatCategoryResponse(category),
    };
  });

  // GET /api/categories/:id - Get single category
  app.get('/api/categories/:id', {
    schema: {
      params: categorySchemas.idParam,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: categorySchemas.category,
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const category = categoryService.getById(params.id);

    return {
      success: true,
      data: formatCategoryResponse(category),
    };
  });

  // PUT /api/categories/:id - Update category
  app.put('/api/categories/:id', {
    schema: {
      params: categorySchemas.idParam,
      body: categorySchemas.updateCategory,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: categorySchemas.category,
          },
        },
      },
    },
  }, async (request) => {
    const params = request.params as { id: number };
    const body = request.body as {
      name?: string;
      color?: string;
      icon?: string;
    };

    const category = categoryService.update(params.id, body);

    return {
      success: true,
      data: formatCategoryResponse(category),
    };
  });

  // DELETE /api/categories/:id - Delete category
  app.delete('/api/categories/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string | number };
      const id = Number(params.id);

      if (!id || Number.isNaN(id)) {
        reply.status(400);
        return { success: false, error: { code: 'INVALID_ID', message: 'Invalid category ID' } };
      }

      categoryService.delete(id);
      return { success: true };
    } catch (err: unknown) {
      app.log.error({ err }, 'Failed to delete category');
      const error = err as Error & { statusCode?: number; code?: string };
      const statusCode = error.statusCode || 500;
      reply.status(statusCode);
      return {
        success: false,
        error: {
          code: error.code || 'DELETE_FAILED',
          message: error.message || 'Failed to delete category',
        },
      };
    }
  });
}
