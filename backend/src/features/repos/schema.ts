export const repoSchemas = {
  // Params
  idParam: {
    type: 'object',
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
    required: ['id'],
  },

  // Body schemas
  createRepo: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        pattern: '^(?:https://github\\.com/)?[\\w-]+/[\\w.-]+$',
      },
      description: { type: 'string', maxLength: 500 },
      category_id: { type: ['integer', 'null'], minimum: 1 },
      notes: { type: 'string', maxLength: 2000 },
      local_path: { type: 'string', maxLength: 1000 },
      installed_version: { type: 'string', maxLength: 100 },
    },
    required: ['url'],
  },

  updateRepo: {
    type: 'object',
    properties: {
      description: { type: 'string', maxLength: 500 },
      notes: { type: ['string', 'null'], maxLength: 2000 },
      category_id: { type: ['integer', 'null'], minimum: 1 },
      local_path: { type: ['string', 'null'], maxLength: 1000 },
    },
    minProperties: 1,
  },

  acknowledgeRepo: {
    type: 'object',
    properties: {
      version: { type: 'string', minLength: 1, maxLength: 100 },
    },
    required: ['version'],
  },

  // Query schemas
  listReposQuery: {
    type: 'object',
    properties: {
      favorite: { type: 'boolean' },
      has_updates: { type: 'boolean' },
      category: { type: 'integer', minimum: 1 },
      sort: { type: 'string', enum: ['name', 'last_sync', 'created'] },
      order: { type: 'string', enum: ['asc', 'desc'] },
    },
  },

  // Response schemas
  repo: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      github_id: { type: ['string', 'null'] },
      owner: { type: 'string' },
      name: { type: 'string' },
      full_name: { type: 'string' },
      url: { type: 'string' },
      description: { type: ['string', 'null'] },
      notes: { type: ['string', 'null'] },
      category_id: { type: ['integer', 'null'] },
      installed_version: { type: ['string', 'null'] },
      local_path: { type: ['string', 'null'] },
      is_favorite: { type: 'boolean' },
      created_at: { type: 'string' },
      updated_at: { type: 'string' },
      category: {
        type: ['object', 'null'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          color: { type: 'string' },
        },
      },
      sync_state: {
        type: ['object', 'null'],
        properties: {
          repo_id: { type: 'integer' },
          last_commit_sha: { type: ['string', 'null'] },
          last_commit_date: { type: ['string', 'null'] },
          last_commit_message: { type: ['string', 'null'] },
          last_commit_author: { type: ['string', 'null'] },
          last_release_tag: { type: ['string', 'null'] },
          last_release_date: { type: ['string', 'null'] },
          last_release_notes: { type: ['string', 'null'] },
          last_tag: { type: ['string', 'null'] },
          last_tag_date: { type: ['string', 'null'] },
          acknowledged_release: { type: ['string', 'null'] },
          release_notification_active: { type: 'boolean' },
          last_sync_at: { type: ['string', 'null'] },
          has_updates: { type: 'boolean' },
        },
      },
    },
  },

  reposList: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: true },
      data: {
        type: 'array',
        items: { $ref: 'repo' },
      },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          with_updates: { type: 'integer' },
          favorites: { type: 'integer' },
        },
      },
    },
  },

  // Preview schemas
  previewRepo: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        pattern: '^(?:https://github\\.com/)?[\\w-]+/[\\w.-]+$',
      },
    },
    required: ['url'],
  },

  previewResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: true },
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

  // Owners list
  ownersList: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: true },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo_count: { type: 'integer' },
          },
        },
      },
    },
  },
};

// Helper to convert DB row to API response
export function toApiResponse(repo: Record<string, unknown>, syncState: Record<string, unknown> | null): Record<string, unknown> {
  return {
    ...repo,
    is_favorite: Boolean(repo.is_favorite),
    sync_state: syncState ? {
      ...syncState,
      has_updates: Boolean(syncState.has_updates),
    } : null,
  };
}

// Type-safe helper for RepoWithSync
import type { RepoWithSync } from './types.js';

export function formatRepoResponse(repo: RepoWithSync): Record<string, unknown> {
  return {
    id: repo.id,
    github_id: repo.github_id,
    owner: repo.owner,
    name: repo.name,
    full_name: repo.full_name,
    url: repo.url,
    description: repo.description,
    notes: repo.notes,
    category_id: repo.category_id,
    installed_version: repo.installed_version,
    local_path: repo.local_path,
    is_favorite: Boolean(repo.is_favorite),
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    category: repo.category || null,
    sync_state: repo.sync_state ? {
      repo_id: repo.sync_state.repo_id,
      last_commit_sha: repo.sync_state.last_commit_sha,
      last_commit_date: repo.sync_state.last_commit_date,
      last_commit_message: repo.sync_state.last_commit_message,
      last_commit_author: repo.sync_state.last_commit_author,
      last_release_tag: repo.sync_state.last_release_tag,
      last_release_date: repo.sync_state.last_release_date,
      last_release_notes: repo.sync_state.last_release_notes,
      last_tag: repo.sync_state.last_tag,
      last_tag_date: repo.sync_state.last_tag_date,
      acknowledged_release: repo.sync_state.acknowledged_release,
      release_notification_active: Boolean(repo.sync_state.release_notification_active),
      last_sync_at: repo.sync_state.last_sync_at,
      has_updates: Boolean(repo.sync_state.has_updates),
    } : null,
  };
}
