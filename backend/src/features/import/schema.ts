export const importSchemas = {
  scannedProject: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      name: { type: 'string' },
      gitConfigPath: { type: ['string', 'null'] },
      githubRepo: {
        type: ['object', 'null'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          url: { type: 'string' },
        },
      },
      projectType: {
        type: ['string', 'null'],
        enum: ['node', 'python', 'go', 'rust', 'unknown', null],
      },
    },
  },

  folderScanResult: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: true },
      data: {
        type: 'object',
        properties: {
          projects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                name: { type: 'string' },
                gitConfigPath: { type: ['string', 'null'] },
                githubRepo: {
                  type: ['object', 'null'],
                  properties: {
                    owner: { type: 'string' },
                    repo: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
                projectType: {
                  type: ['string', 'null'],
                  enum: ['node', 'python', 'go', 'rust', 'unknown', null],
                },
              },
            },
          },
          scannedAt: { type: 'string' },
          totalFound: { type: 'integer' },
        },
      },
    },
  },
};
