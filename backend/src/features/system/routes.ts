import { FastifyInstance } from 'fastify';
import { existsSync, statSync, realpathSync } from 'node:fs';
import { config } from '../../shared/config/index.js';
import { db } from '../../shared/db/index.js';

interface ValidatePathBody {
  path: string;
}

interface ValidatePathResponse {
  valid: boolean | null;
  isDirectory?: boolean;
  resolvedPath?: string | null;
  error?: string;
  message?: string;
}

export async function systemRoutes(app: FastifyInstance) {
  // Get all settings
  app.get('/api/settings', async () => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      // Mask token but let frontend know it exists
      if (row.key === 'github_token' && row.value) {
        settings[row.key] = '••••••••' + row.value.slice(-4);
      } else {
        settings[row.key] = row.value;
      }
    });

    // Also include env-based token status
    settings.has_env_token = config.github.token ? 'true' : 'false';

    return settings;
  });

  // Update settings
  app.post<{ Body: Record<string, string> }>(
    '/api/settings',
    async (request, _reply) => {
      const settings = request.body;

      const upsert = db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `);

      const transaction = db.transaction((data: Record<string, string>) => {
        for (const [key, value] of Object.entries(data)) {
          // If masked token sent back, don't update it
          if (key === 'github_token' && value.includes('••••••••')) continue;
          upsert.run(key, value);
        }
      });

      transaction(settings);
      return { success: true };
    }
  );

  // Path validation endpoint - only works in local development
  app.post<{ Body: ValidatePathBody; Reply: ValidatePathResponse }>(
    '/api/system/validate-path',
    async (request) => {
      const { path } = request.body;

      if (!path || typeof path !== 'string') {
        return { valid: false, error: 'Path is required' };
      }

      const trimmedPath = path.trim();

      if (!trimmedPath) {
        return { valid: false, error: 'Path cannot be empty' };
      }

      // Only validate in development mode or when explicitly enabled
      const canValidate = config.nodeEnv === 'development' || process.env.ENABLE_PATH_VALIDATION === 'true';

      if (!canValidate) {
        // Docker/Remote: No validation, just format check
        return {
          valid: null,
          message: 'Path validation only available in local mode',
        };
      }

      try {
        const exists = existsSync(trimmedPath);

        if (!exists) {
          return { valid: false, error: 'Path does not exist' };
        }

        const stats = statSync(trimmedPath);
        const resolvedPath = realpathSync(trimmedPath);

        return {
          valid: true,
          isDirectory: stats.isDirectory(),
          resolvedPath,
        };
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Path not accessible',
        };
      }
    }
  );
}
