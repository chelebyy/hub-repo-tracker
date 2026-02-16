import 'dotenv/config';

export const config = {
  port: Number.parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  github: {
    token: process.env.GITHUB_TOKEN || '',
    syncIntervalMinutes: Number.parseInt(process.env.SYNC_INTERVAL_MINUTES || '30', 10),
  },
  database: {
    path: process.env.DATABASE_PATH || './data/repos.db',
  },
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.github.token) {
    errors.push('GITHUB_TOKEN is required');
  }

  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
