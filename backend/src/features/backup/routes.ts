import { FastifyInstance } from 'fastify';
import { backupService } from './service.js';
import { backupSchemas } from './schema.js';
import { createError } from '../../shared/middleware/error.js';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import type { BackupData } from './types.js';
import { backupRepository } from './repository.js';

export async function backupRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/backup/export/json - Export all data as JSON
  app.get('/api/backup/export/json', {
    schema: {
      response: {
        200: backupSchemas.backupResponse,
      },
    },
  }, async (request, reply) => {
    const backupData = backupService.exportToJson();

    // Set headers for file download
    reply.header('Content-Disposition', `attachment; filename="hub-repo-tracker-backup-${new Date().toISOString().split('T')[0]}.json"`);
    reply.header('Content-Type', 'application/json');

    return {
      success: true,
      data: backupData,
    };
  });

  // GET /api/backup/export/sqlite - Export database as SQLite file
  app.get('/api/backup/export/sqlite', {}, async (request, reply) => {
    const dbPath = backupService.exportToSqlite();

    if (!existsSync(dbPath)) {
      throw createError(404, 'FILE_NOT_FOUND', 'Database file not found');
    }

    // Read the database file
    const fileBuffer = await readFile(dbPath);

    // Set headers for file download
    reply.header('Content-Disposition', `attachment; filename="hub-repo-tracker-backup-${new Date().toISOString().split('T')[0]}.db"`);
    reply.header('Content-Type', 'application/x-sqlite3');

    return reply.send(fileBuffer);
  });

  // POST /api/backup/import/json - Restore from JSON
  app.post('/api/backup/import/json', {
    schema: {
      querystring: backupSchemas.restoreQuery,
      body: {
        type: 'object',
        additionalProperties: true,
      },
      response: {
        200: backupSchemas.restoreResponse,
        400: backupSchemas.restoreResponse,
      },
    },
  }, async (request, _reply) => {
    const query = request.query as { mode?: 'merge' | 'replace' };
    const mode = query.mode || 'merge';

    // Check if request body exists
    if (!request.body) {
      throw createError(400, 'INVALID_BODY', 'Request body is required');
    }

    const backupData = request.body as unknown;

    // Validate backup data structure
    if (!backupService.validateBackupData(backupData)) {
      throw createError(400, 'INVALID_BACKUP_FORMAT', 'Invalid backup file format');
    }

    const result = backupService.restoreFromJson(backupData, { mode });

    return result;
  });

  // POST /api/backup/preview - Preview backup file before import
  app.post('/api/backup/preview', {}, async (request, _reply) => {
    try {
      const data = await request.file();

      if (!data) {
        throw createError(400, 'NO_FILE', 'No file uploaded');
      }

      const buffer = await data.toBuffer();
      const filename = data.filename?.toLowerCase() || '';

      let preview: { total_repos: number; total_categories: number; exported_at: string };

      if (filename.endsWith('.json')) {
        const text = buffer.toString('utf-8');
        const json = JSON.parse(text);

        if (!backupService.validateBackupData(json)) {
          throw createError(400, 'INVALID_BACKUP_FORMAT', 'Invalid JSON backup file format');
        }

        preview = {
          total_repos: json.meta?.total_repos || json.data?.repos?.length || 0,
          total_categories: json.meta?.total_categories || json.data?.categories?.length || 0,
          exported_at: json.exported_at,
        };
      } else if (filename.endsWith('.db') || filename.endsWith('.sqlite') || filename.endsWith('.sqlite3')) {
        const tempDbPath = join(tmpdir(), `preview-${Date.now()}.db`);
        await writeFile(tempDbPath, buffer);

        const tempDb = new Database(tempDbPath);
        const repos = tempDb.prepare('SELECT COUNT(*) as count FROM repos').get() as { count: number };
        const categories = tempDb.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
        tempDb.close();
        await unlink(tempDbPath);

        preview = {
          total_repos: repos.count,
          total_categories: categories.count,
          exported_at: new Date().toISOString(),
        };
      } else {
        throw createError(400, 'UNSUPPORTED_FORMAT', 'Unsupported file format. Use .json or .db');
      }

      return preview;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw createError(500, 'PREVIEW_FAILED', error instanceof Error ? error.message : 'Failed to preview backup file');
    }
  });

  // POST /api/backup/import - Unified import endpoint (auto-detects format)
  app.post('/api/backup/import', {}, async (request, _reply) => {
    const query = request.query as { mode?: 'merge' | 'replace' };
    const mode = query.mode || 'merge';

    try {
      const data = await request.file();

      if (!data) {
        throw createError(400, 'NO_FILE', 'No file uploaded');
      }

      const buffer = await data.toBuffer();
      const filename = data.filename?.toLowerCase() || '';

      if (filename.endsWith('.json')) {
        const text = buffer.toString('utf-8');
        const json = JSON.parse(text);

        if (!backupService.validateBackupData(json)) {
          throw createError(400, 'INVALID_BACKUP_FORMAT', 'Invalid JSON backup file format');
        }

        const result = backupService.restoreFromJson(json, { mode });
        return result;
      } else if (filename.endsWith('.db') || filename.endsWith('.sqlite') || filename.endsWith('.sqlite3')) {
        const tempDbPath = join(tmpdir(), `restore-${Date.now()}.db`);
        await writeFile(tempDbPath, buffer);

        const tempDb = new Database(tempDbPath);
        const repos = tempDb.prepare('SELECT * FROM repos').all() as Array<Record<string, unknown>>;
        const categories = tempDb.prepare('SELECT * FROM categories').all() as Array<Record<string, unknown>>;
        const syncStates = tempDb.prepare('SELECT * FROM sync_state').all() as Array<Record<string, unknown>>;
        const versionHistory = tempDb.prepare('SELECT * FROM version_history').all() as Array<Record<string, unknown>>;
        tempDb.close();
        await unlink(tempDbPath);

        const backupData: BackupData = {
          version: '1.0',
          exported_at: new Date().toISOString(),
          data: {
            repos: repos.map(repo => {
              const repoId = repo.id as number;
              return {
                id: repoId,
                github_id: repo.github_id as string | null,
                owner: repo.owner as string,
                name: repo.name as string,
                full_name: repo.full_name as string,
                url: repo.url as string,
                description: repo.description as string | null,
                notes: repo.notes as string | null,
                category_id: repo.category_id as number | null,
                installed_version: repo.installed_version as string | null,
                local_path: repo.local_path as string | null,
                is_favorite: repo.is_favorite as number,
                created_at: repo.created_at as string,
                updated_at: repo.updated_at as string,
                version_history: versionHistory.filter(h => h.repo_id === repoId).map(h => ({
                  id: h.id as number,
                  repo_id: h.repo_id as number,
                  version_type: h.version_type as string,
                  version_value: h.version_value as string,
                  release_notes: h.release_notes as string | null,
                  detected_at: h.detected_at as string,
                  acknowledged_at: h.acknowledged_at as string | null,
                })),
              };
            }),
            categories: categories.map(cat => ({
              id: cat.id as number,
              name: cat.name as string,
              type: cat.type as string,
              color: cat.color as string,
              icon: cat.icon as string | null,
              owner_name: cat.owner_name as string | null,
              created_at: cat.created_at as string,
            })),
            sync_state: syncStates.map(ss => ({
              repo_id: ss.repo_id as number,
              last_commit_sha: ss.last_commit_sha as string | null,
              last_commit_date: ss.last_commit_date as string | null,
              last_commit_message: ss.last_commit_message as string | null,
              last_commit_author: ss.last_commit_author as string | null,
              last_release_tag: ss.last_release_tag as string | null,
              last_release_date: ss.last_release_date as string | null,
              last_release_notes: ss.last_release_notes as string | null,
              last_tag: ss.last_tag as string | null,
              last_tag_date: ss.last_tag_date as string | null,
              acknowledged_release: ss.acknowledged_release as string | null,
              release_notification_active: ss.release_notification_active as number,
              last_sync_at: ss.last_sync_at as string | null,
              has_updates: ss.has_updates as number,
            })),
            settings: {},
          },
          meta: {
            total_repos: repos.length,
            total_categories: categories.length,
          },
        };

        const result = backupRepository.restoreFromBackup(backupData, mode);
        return result;
      } else {
        throw createError(400, 'UNSUPPORTED_FORMAT', 'Unsupported file format. Use .json or .db');
      }
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw createError(500, 'IMPORT_FAILED', error instanceof Error ? error.message : 'Failed to import backup file');
    }
  });

  // POST /api/backup/import/sqlite - Restore from SQLite file (multipart upload)
  app.post('/api/backup/import/sqlite', {}, async (request, _reply) => {
    const query = request.query as { mode?: 'merge' | 'replace' };
    const mode = query.mode || 'merge';

    try {
      // Get the uploaded file from multipart data
      const data = await request.file();

      if (!data) {
        throw createError(400, 'NO_FILE', 'No file uploaded');
      }

      // For SQLite restore, we need to be very careful
      // We'll import the data from the uploaded SQLite into current database
      const tempDbPath = join(tmpdir(), `restore-${Date.now()}.db`);

      // Write uploaded file to temp location
      const buffer = await data.toBuffer();
      await writeFile(tempDbPath, buffer);

      // Open temp database and read data
      const tempDb = new Database(tempDbPath);

      // Get data from temp database
      const repos = tempDb.prepare('SELECT * FROM repos').all() as Array<Record<string, unknown>>;
      const categories = tempDb.prepare('SELECT * FROM categories').all() as Array<Record<string, unknown>>;
      const syncStates = tempDb.prepare('SELECT * FROM sync_state').all() as Array<Record<string, unknown>>;
      const versionHistory = tempDb.prepare('SELECT * FROM version_history').all() as Array<Record<string, unknown>>;

      tempDb.close();

      // Clean up temp file
      await unlink(tempDbPath);

      // Build backup data structure with proper typing
      const backupData: BackupData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        data: {
          repos: repos.map(repo => {
            const repoId = repo.id as number;
            return {
              id: repoId,
              github_id: repo.github_id as string | null,
              owner: repo.owner as string,
              name: repo.name as string,
              full_name: repo.full_name as string,
              url: repo.url as string,
              description: repo.description as string | null,
              notes: repo.notes as string | null,
              category_id: repo.category_id as number | null,
              installed_version: repo.installed_version as string | null,
              local_path: repo.local_path as string | null,
              is_favorite: repo.is_favorite as number,
              created_at: repo.created_at as string,
              updated_at: repo.updated_at as string,
              version_history: versionHistory
                .filter(h => h.repo_id === repoId)
                .map(h => ({
                  id: h.id as number,
                  repo_id: h.repo_id as number,
                  version_type: h.version_type as string,
                  version_value: h.version_value as string,
                  release_notes: h.release_notes as string | null,
                  detected_at: h.detected_at as string,
                  acknowledged_at: h.acknowledged_at as string | null,
                })),
            };
          }),
          categories: categories.map(cat => ({
            id: cat.id as number,
            name: cat.name as string,
            type: cat.type as string,
            color: cat.color as string,
            icon: cat.icon as string | null,
            owner_name: cat.owner_name as string | null,
            created_at: cat.created_at as string,
          })),
          sync_state: syncStates.map(ss => ({
            repo_id: ss.repo_id as number,
            last_commit_sha: ss.last_commit_sha as string | null,
            last_commit_date: ss.last_commit_date as string | null,
            last_commit_message: ss.last_commit_message as string | null,
            last_commit_author: ss.last_commit_author as string | null,
            last_release_tag: ss.last_release_tag as string | null,
            last_release_date: ss.last_release_date as string | null,
            last_release_notes: ss.last_release_notes as string | null,
            last_tag: ss.last_tag as string | null,
            last_tag_date: ss.last_tag_date as string | null,
            acknowledged_release: ss.acknowledged_release as string | null,
            release_notification_active: ss.release_notification_active as number,
            last_sync_at: ss.last_sync_at as string | null,
            has_updates: ss.has_updates as number,
          })),
          settings: {},
        },
        meta: {
          total_repos: repos.length,
          total_categories: categories.length,
        },
      };

      // Use existing restore logic
      const result = backupRepository.restoreFromBackup(backupData, mode);

      return result;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw createError(500, 'RESTORE_FAILED', error instanceof Error ? error.message : 'Failed to restore from SQLite file');
    }
  });
}
