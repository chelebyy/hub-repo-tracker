import type { CategoryWithCount } from './types.js';

export const categorySchemas = {
  idParam: {
    type: 'object',
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
    required: ['id'],
  },

  createCategory: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 50 },
      type: { type: 'string', enum: ['custom', 'owner'] },
      color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
      icon: { type: 'string', maxLength: 50 },
      owner_name: { type: 'string', maxLength: 100 },
    },
    required: ['name'],
  },

  updateCategory: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 50 },
      color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
      icon: { type: 'string', maxLength: 50 },
    },
    minProperties: 1,
  },

  category: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      type: { type: 'string', enum: ['custom', 'owner'] },
      color: { type: 'string' },
      icon: { type: ['string', 'null'] },
      owner_name: { type: ['string', 'null'] },
      created_at: { type: 'string' },
      repo_count: { type: 'integer' },
    },
  },

  categoriesList: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: true },
      data: {
        type: 'array',
        items: { $ref: 'category' },
      },
    },
  },
};

export function formatCategoryResponse(category: CategoryWithCount): Record<string, unknown> {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    owner_name: category.owner_name,
    created_at: category.created_at,
    repo_count: category.repo_count,
  };
}
