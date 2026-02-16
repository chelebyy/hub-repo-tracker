export const backupSchemas = {
  // Restore options query
  restoreQuery: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['merge', 'replace'],
        default: 'merge',
      },
    },
  },

  // Backup response
  backupResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          version: { type: 'string' },
          exported_at: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              repos: {
                type: 'array',
                items: { type: 'object' },
              },
              categories: {
                type: 'array',
                items: { type: 'object' },
              },
              sync_state: {
                type: 'array',
                items: { type: 'object' },
              },
              settings: { type: 'object' },
            },
          },
          meta: {
            type: 'object',
            properties: {
              total_repos: { type: 'integer' },
              total_categories: { type: 'integer' },
            },
          },
        },
      },
    },
  },

  // Restore response
  restoreResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      stats: {
        type: 'object',
        properties: {
          repos_imported: { type: 'integer' },
          repos_skipped: { type: 'integer' },
          categories_imported: { type: 'integer' },
          categories_skipped: { type: 'integer' },
          sync_states_restored: { type: 'integer' },
          version_history_restored: { type: 'integer' },
        },
      },
      errors: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
};
