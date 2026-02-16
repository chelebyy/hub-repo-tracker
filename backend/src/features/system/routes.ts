import { FastifyInstance } from 'fastify';
import { existsSync, statSync, realpathSync } from 'fs';
import { config } from '../../shared/config/index.js';

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
