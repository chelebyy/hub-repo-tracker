import { db } from '../../shared/db/index.js';
import type { BackupData, BackupRepo, BackupCategory, BackupSyncState, BackupVersionHistory, RestoreResult } from './types.js';

export const backupRepository = {
  // Export all repos with version history
  exportRepos(): BackupRepo[] {
    const repos = db.prepare(`
      SELECT * FROM repos ORDER BY created_at ASC
    `).all() as BackupRepo[];

    // Get version history for each repo
    const historyStmt = db.prepare(`
      SELECT * FROM version_history WHERE repo_id = ? ORDER BY detected_at DESC
    `);

    return repos.map(repo => ({
      ...repo,
      version_history: historyStmt.all(repo.id) as BackupVersionHistory[],
    }));
  },

  // Export all categories
  exportCategories(): BackupCategory[] {
    return db.prepare(`
      SELECT * FROM categories ORDER BY created_at ASC
    `).all() as BackupCategory[];
  },

  // Export all sync states
  exportSyncStates(): BackupSyncState[] {
    return db.prepare(`
      SELECT * FROM sync_state
    `).all() as BackupSyncState[];
  },

  // Export all version history
  exportVersionHistory(): BackupVersionHistory[] {
    return db.prepare(`
      SELECT * FROM version_history ORDER BY detected_at DESC
    `).all() as BackupVersionHistory[];
  },

  // Clear all data (for replace mode)
  clearAllData(): void {
    db.exec(`
      DELETE FROM version_history;
      DELETE FROM sync_state;
      DELETE FROM repos;
      DELETE FROM categories;
    `);
  },

  // Import category
  importCategory(category: BackupCategory, idMapping: Map<number, number>): number | null {
    // Check if category already exists by name
    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(category.name) as { id: number } | undefined;

    if (existing) {
      idMapping.set(category.id, existing.id);
      return null; // Skipped
    }

    const result = db.prepare(`
      INSERT INTO categories (name, type, color, icon, owner_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      category.name,
      category.type || 'custom',
      category.color || '#6366f1',
      category.icon || null,
      category.owner_name || null,
      category.created_at
    );

    const newId = result.lastInsertRowid as number;
    idMapping.set(category.id, newId);
    return newId;
  },

  // Import repo
  importRepo(repo: BackupRepo, categoryIdMapping: Map<number, number>, repoIdMapping: Map<number, number>): number | null {
    // Check if repo already exists by full_name
    const existing = db.prepare('SELECT id FROM repos WHERE full_name = ?').get(repo.full_name) as { id: number } | undefined;

    if (existing) {
      repoIdMapping.set(repo.id, existing.id);
      return null; // Skipped
    }

    // Map old category_id to new one
    const newCategoryId = repo.category_id ? categoryIdMapping.get(repo.category_id) ?? null : null;

    const result = db.prepare(`
      INSERT INTO repos (github_id, owner, name, full_name, url, description, notes, category_id, installed_version, local_path, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      repo.github_id || null,
      repo.owner,
      repo.name,
      repo.full_name,
      repo.url,
      repo.description || null,
      repo.notes || null,
      newCategoryId,
      repo.installed_version || null,
      repo.local_path || null,
      repo.is_favorite || 0,
      repo.created_at,
      repo.updated_at
    );

    const newId = result.lastInsertRowid as number;
    repoIdMapping.set(repo.id, newId);
    return newId;
  },

  // Import sync state
  importSyncState(syncState: BackupSyncState, repoIdMapping: Map<number, number>): boolean {
    const newRepoId = repoIdMapping.get(syncState.repo_id);
    if (!newRepoId) return false;

    // Check if sync state already exists
    const existing = db.prepare('SELECT repo_id FROM sync_state WHERE repo_id = ?').get(newRepoId);
    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE sync_state SET
          last_commit_sha = ?,
          last_commit_date = ?,
          last_commit_message = ?,
          last_commit_author = ?,
          last_release_tag = ?,
          last_release_date = ?,
          last_release_notes = ?,
          last_tag = ?,
          last_tag_date = ?,
          acknowledged_release = ?,
          release_notification_active = ?,
          last_sync_at = ?,
          has_updates = ?
        WHERE repo_id = ?
      `).run(
        syncState.last_commit_sha,
        syncState.last_commit_date,
        syncState.last_commit_message,
        syncState.last_commit_author,
        syncState.last_release_tag,
        syncState.last_release_date,
        syncState.last_release_notes,
        syncState.last_tag,
        syncState.last_tag_date,
        syncState.acknowledged_release,
        syncState.release_notification_active,
        syncState.last_sync_at,
        syncState.has_updates,
        newRepoId
      );
    } else {
      // Insert new
      db.prepare(`
        INSERT INTO sync_state (
          repo_id, last_commit_sha, last_commit_date, last_commit_message, last_commit_author,
          last_release_tag, last_release_date, last_release_notes, last_tag, last_tag_date,
          acknowledged_release, release_notification_active, last_sync_at, has_updates
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newRepoId,
        syncState.last_commit_sha,
        syncState.last_commit_date,
        syncState.last_commit_message,
        syncState.last_commit_author,
        syncState.last_release_tag,
        syncState.last_release_date,
        syncState.last_release_notes,
        syncState.last_tag,
        syncState.last_tag_date,
        syncState.acknowledged_release,
        syncState.release_notification_active,
        syncState.last_sync_at,
        syncState.has_updates
      );
    }

    return true;
  },

  // Import version history
  importVersionHistory(history: BackupVersionHistory, repoIdMapping: Map<number, number>): boolean {
    const newRepoId = repoIdMapping.get(history.repo_id);
    if (!newRepoId) return false;

    // Check if this version history entry already exists
    const existing = db.prepare(`
      SELECT id FROM version_history
      WHERE repo_id = ? AND version_type = ? AND version_value = ? AND detected_at = ?
    `).get(newRepoId, history.version_type, history.version_value, history.detected_at);

    if (existing) return false;

    db.prepare(`
      INSERT INTO version_history (repo_id, version_type, version_value, release_notes, detected_at, acknowledged_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      newRepoId,
      history.version_type,
      history.version_value,
      history.release_notes,
      history.detected_at,
      history.acknowledged_at
    );

    return true;
  },

  // Clear data if replace mode (internal)
  _clearDataIfReplace(mode: 'merge' | 'replace'): void {
    if (mode === 'replace') {
      this.clearAllData();
    }
  },

  // Import all categories from backup (internal)
  _importCategories(
    categories: BackupCategory[],
    categoryIdMapping: Map<number, number>
  ): { imported: number; skipped: number } {
    let imported = 0;
    let skipped = 0;

    for (const category of categories) {
      const result = this.importCategory(category, categoryIdMapping);
      if (result !== null) {
        imported++;
      } else {
        skipped++;
      }
    }

    return { imported, skipped };
  },

  // Import all repos from backup (internal)
  _importRepos(
    repos: BackupRepo[],
    categoryIdMapping: Map<number, number>,
    repoIdMapping: Map<number, number>
  ): { imported: number; skipped: number } {
    let imported = 0;
    let skipped = 0;

    for (const repo of repos) {
      const result = this.importRepo(repo, categoryIdMapping, repoIdMapping);
      if (result !== null) {
        imported++;
      } else {
        skipped++;
      }
    }

    return { imported, skipped };
  },

  // Import all sync states from backup (internal)
  _importSyncStates(
    syncStates: BackupSyncState[],
    repoIdMapping: Map<number, number>
  ): number {
    let restored = 0;

    for (const syncState of syncStates) {
      if (this.importSyncState(syncState, repoIdMapping)) {
        restored++;
      }
    }

    return restored;
  },

  // Import all version history from backup repos (internal)
  _importVersionHistoryFromRepos(
    repos: BackupRepo[],
    repoIdMapping: Map<number, number>
  ): number {
    let restored = 0;

    for (const repo of repos) {
      if (repo.version_history) {
        for (const history of repo.version_history) {
          if (this.importVersionHistory(history, repoIdMapping)) {
            restored++;
          }
        }
      }
    }

    return restored;
  },

  // Full restore from backup data
  restoreFromBackup(data: BackupData, mode: 'merge' | 'replace'): RestoreResult {
    const result: RestoreResult = {
      success: true,
      message: '',
      stats: {
        repos_imported: 0,
        repos_skipped: 0,
        categories_imported: 0,
        categories_skipped: 0,
        sync_states_restored: 0,
        version_history_restored: 0,
      },
      errors: [],
    };

    try {
      const restoreTransaction = db.transaction(() => {
        const categoryIdMapping = new Map<number, number>();
        const repoIdMapping = new Map<number, number>();

        this._clearDataIfReplace(mode);

        const categoryResult = this._importCategories(data.data.categories, categoryIdMapping);
        result.stats.categories_imported = categoryResult.imported;
        result.stats.categories_skipped = categoryResult.skipped;

        const repoResult = this._importRepos(data.data.repos, categoryIdMapping, repoIdMapping);
        result.stats.repos_imported = repoResult.imported;
        result.stats.repos_skipped = repoResult.skipped;

        result.stats.sync_states_restored = this._importSyncStates(data.data.sync_state, repoIdMapping);
        result.stats.version_history_restored = this._importVersionHistoryFromRepos(data.data.repos, repoIdMapping);
      });

      restoreTransaction();

      result.message = mode === 'replace'
        ? 'Data replaced successfully'
        : 'Data merged successfully';
    } catch (error) {
      result.success = false;
      result.message = 'Restore failed';
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  },
};
