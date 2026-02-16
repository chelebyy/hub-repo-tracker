#!/usr/bin/env node
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import open from 'open';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { config, validateConfig } from './shared/config/index.js';
import { initializeDatabase, closeDatabase, db } from './shared/db/index.js';
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

// Serve static files (Frontend) - MUST be after API routes to avoid conflicts (or use prefix)
// configured to serve from 'public' directory which will be in 'dist/public'
await app.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  constraints: {} // optional
});

// SPA Fallback: Serve index.html for any non-API route not handled above
app.setNotFoundHandler(async (req, reply) => {
  if (req.raw.url?.startsWith('/api')) {
    return reply.status(404).send({
      error: 'Not Found',
      message: 'Route not found',
      statusCode: 404
    });
  }
  return reply.sendFile('index.html');
});

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
// Start server
const start = async () => {
  try {
    const address = await app.listen({ port: config.port, host: '0.0.0.0' });

    if (config.nodeEnv !== 'development') {
      console.log('\x1b[36m%s\x1b[0m', String.raw`
   __ __         __  ____                 ______               __            
  / // /_ ______/ / / __ \___ ___  ___   /_  __/__________ ____/ /_____ ____ 
 / _  / // / __  / / /_/ / -_) _ \/ _ \   / / / __/ _  / __/ _  / -_) __/
/_//_/\_,_/\__,_/  \____/\__/ .__/\___/  /_/ /_/  \_,_/\__/ \__,_/\__/_/   
                           /_/                                               
      `);
      console.log(`🚀 Hub Repo Tracker is running at: \x1b[32m${address}\x1b[0m`);
      console.log(`📁 Data Directory: \x1b[34m${path.dirname(config.database.path)}\x1b[0m`);

      // Check for token in env or database
      let hasToken = !!config.github.token;
      if (!hasToken) {
        try {
          const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('github_token') as { value: string } | undefined;
          if (row?.value) hasToken = true;
        } catch {
          // Ignore DB errors during startup check
        }
      }

      if (!hasToken) {
        console.log('\x1b[33m%s\x1b[0m', '⚠️  No GITHUB_TOKEN found. Please add it in settings for full functionality.');
      }
    } else {
      app.log.info(`Server listening at ${address}`);
    }

    // Auto-open browser in production mode (skip in Docker/CI)
    if (config.nodeEnv !== 'development' && !process.env.DOCKER && !process.env.CI) {
      try {
        const url = `http://localhost:${config.port}`;
        await open(url);
      } catch {
        // Ignore open errors (no GUI env)
      }
    }
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }
};

// Check if run directly (ESM friendly check)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('app.js') ||
  process.argv[1].endsWith('app.ts') ||
  process.argv[1].includes('hub-repo-tracker')
);

if (isDirectRun) {
  start();
}
