import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config, validateConfig } from './shared/config/index.js';
import { initializeDatabase, closeDatabase } from './shared/db/index.js';
import { errorHandler, errorSchema } from './shared/middleware/error.js';
import { repoRoutes } from './features/repos/routes.js';
import { syncRoutes } from './features/sync/routes.js';
import { dashboardRoutes } from './features/dashboard/routes.js';
import { categoryRoutes } from './features/categories/routes.js';
import { importRoutes } from './features/import/routes.js';
import { systemRoutes } from './features/system/routes.js';
import { backupRoutes } from './features/backup/routes.js';
import { startSyncJob, stopSyncJob } from './shared/jobs/sync-job.js';
import { repoSchemas } from './features/repos/schema.js';
import { categorySchemas } from './features/categories/schema.js';

// Validate config on startup
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', error);
  process.exit(1);
}

// Initialize database
initializeDatabase();

// Create Fastify instance
const app = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
    transport: config.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
  ajv: {
    customOptions: {
      coerceTypes: true,
    },
  },
});

// Register plugins
await app.register(cors, {
  origin: true, // Allow all origins in development
});

// Register multipart for file uploads
await app.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for SQLite backups
  },
});

// Set custom error handler
app.setErrorHandler(errorHandler);

// Add response schema for errors
app.addSchema({
  $id: 'error',
  ...errorSchema,
});

// Add shared schemas for repos and categories
app.addSchema({
  $id: 'repo',
  ...repoSchemas.repo,
});

app.addSchema({
  $id: 'category',
  ...categorySchemas.category,
});

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

// Register routes
await app.register(repoRoutes);
await app.register(syncRoutes);
await app.register(dashboardRoutes);
await app.register(categoryRoutes);
await app.register(importRoutes);
await app.register(systemRoutes);
await app.register(backupRoutes);

// Start scheduled sync job
startSyncJob();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  try {
    stopSyncJob();
    await app.close();
    closeDatabase();
    app.log.info('Server closed');
    process.exit(0);
  } catch (error) {
    app.log.error(error, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    const address = await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server listening at ${address}`);
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }
};

start();
