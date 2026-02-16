import path from 'node:path';

export const config = {
  port: Number.parseInt(process.env.PORT || '3750', 10),
  nodeEnv: process.env.NODE_ENV || 'production', // CLI is production by default
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'info' : 'warn'),
  logPath: process.env.LOG_PATH || path.resolve(process.cwd(), 'logs'),
  github: {
    token: process.env.GITHUB_TOKEN || '',
    syncIntervalMinutes: Number.parseInt(process.env.SYNC_INTERVAL_MINUTES || '30', 10),
  },
  database: {
    path: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/repos.db'),
  },
  projects: {
    path: process.env.PROJECTS_PATH || path.resolve(process.cwd(), 'projects'),
  },
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
