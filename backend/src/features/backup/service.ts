import { backupRepository } from './repository.js';
import type { BackupData, RestoreOptions, RestoreResult } from './types.js';
import { createError } from '../../shared/middleware/error.js';
import { db } from '../../shared/db/index.js';

const BACKUP_VERSION = '1.0';

export const backupService = {
  // Export all data as JSON
  exportToJson(): BackupData {
    const repos = backupRepository.exportRepos();
    const categories = backupRepository.exportCategories();
    const syncStates = backupRepository.exportSyncStates();

    // Remove version_history from repos for cleaner export (keep in separate field)
    const reposForExport = repos.map(repo => ({
      ...repo,
      version_history: repo.version_history || [],
    }));

    return {
      version: BACKUP_VERSION,
      exported_at: new Date().toISOString(),
      data: {
        repos: reposForExport,
        categories,
        sync_state: syncStates,
        settings: {},
      },
      meta: {
        total_repos: repos.length,
        total_categories: categories.length,
      },
    };
  },

  // Export database as SQLite file (returns path)
  exportToSqlite(): string {
    // Get current database path
    const dbPath = db.name;
    return dbPath;
  },

  // Validate backup data structure
  validateBackupData(data: unknown): data is BackupData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    // Check required fields
    if (typeof obj.version !== 'string') return false;
    if (typeof obj.exported_at !== 'string') return false;
    if (!obj.data || typeof obj.data !== 'object') return false;

    const dataObj = obj.data as Record<string, unknown>;
    if (!Array.isArray(dataObj.repos)) return false;
    if (!Array.isArray(dataObj.categories)) return false;
    if (!Array.isArray(dataObj.sync_state)) return false;

    return true;
  },

  // Restore from JSON
  restoreFromJson(data: BackupData, options: RestoreOptions): RestoreResult {
    // Validate version compatibility
    if (data.version !== BACKUP_VERSION) {
      throw createError(400, 'INCOMPATIBLE_VERSION', `Backup version ${data.version} is not compatible with current version ${BACKUP_VERSION}`);
    }

    return backupRepository.restoreFromBackup(data, options.mode);
  },
};
