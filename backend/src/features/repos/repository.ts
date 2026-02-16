import { db } from '../../shared/db/index.js';
import type { Repo, SyncState, CreateRepoDto, UpdateRepoDto, RepoQuery, RepoWithSync, CategoryInfo, OwnerStats } from './types.js';

function mapRepo(row: unknown): Repo {
  return row as Repo;
}

function mapSyncState(row: unknown): SyncState | null {
  return row ? (row as SyncState) : null;
}

function mapCategoryInfo(row: Record<string, unknown>): CategoryInfo | null {
  if (!row.category_id) return null;
  return {
    id: row.category_id as number,
    name: row.category_name as string,
    color: row.category_color as string,
  };
}

export const repoRepository = {
  findAll(query: RepoQuery = {}): RepoWithSync[] {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (query.favorite !== undefined) {
      conditions.push('r.is_favorite = ?');
      params.push(query.favorite ? 1 : 0);
    }

    if (query.has_updates !== undefined) {
      conditions.push('s.has_updates = ?');
      params.push(query.has_updates ? 1 : 0);
    }

    if (query.category !== undefined) {
      conditions.push('r.category_id = ?');
      params.push(query.category);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const sortMap: Record<string, string> = {
      name: 'r.full_name',
      last_sync: 's.last_sync_at',
      created: 'r.created_at',
    };

    const sortBy = sortMap[query.sort || 'created'];
    const order = query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const sql = `
      SELECT r.*, s.*,
        c.id as category_id, c.name as category_name, c.color as category_color
      FROM repos r
      LEFT JOIN sync_state s ON r.id = s.repo_id
      LEFT JOIN categories c ON r.category_id = c.id
      ${whereClause}
      ORDER BY r.is_favorite DESC, ${sortBy} ${order}
    `;

    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];

    return rows.map(row => ({
      id: row.id as number,
      github_id: row.github_id as string | null,
      owner: row.owner as string,
      name: row.name as string,
      full_name: row.full_name as string,
      url: row.url as string,
      description: row.description as string | null,
      notes: row.notes as string | null,
      category_id: row.category_id as number | null,
      installed_version: row.installed_version as string | null,
      local_path: row.local_path as string | null,
      category: mapCategoryInfo(row),
      is_favorite: row.is_favorite as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      sync_state: mapSyncState({
        repo_id: row.repo_id,
        last_commit_sha: row.last_commit_sha,
        last_commit_date: row.last_commit_date,
        last_commit_message: row.last_commit_message,
        last_commit_author: row.last_commit_author,
        last_release_tag: row.last_release_tag,
        last_release_date: row.last_release_date,
        last_release_notes: row.last_release_notes,
        last_tag: row.last_tag,
        last_tag_date: row.last_tag_date,
        acknowledged_release: row.acknowledged_release,
        release_notification_active: row.release_notification_active,
        last_sync_at: row.last_sync_at,
        has_updates: row.has_updates,
      }),
    }));
  },

  findById(id: number): RepoWithSync | null {
    const sql = `
      SELECT r.*, s.*,
        c.id as category_id, c.name as category_name, c.color as category_color
      FROM repos r
      LEFT JOIN sync_state s ON r.id = s.repo_id
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = ?
    `;

    const row = db.prepare(sql).get(id) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      id: row.id as number,
      github_id: row.github_id as string | null,
      owner: row.owner as string,
      name: row.name as string,
      full_name: row.full_name as string,
      url: row.url as string,
      description: row.description as string | null,
      notes: row.notes as string | null,
      category_id: row.category_id as number | null,
      installed_version: row.installed_version as string | null,
      local_path: row.local_path as string | null,
      category: mapCategoryInfo(row),
      is_favorite: row.is_favorite as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      sync_state: mapSyncState({
        repo_id: row.repo_id,
        last_commit_sha: row.last_commit_sha,
        last_commit_date: row.last_commit_date,
        last_commit_message: row.last_commit_message,
        last_commit_author: row.last_commit_author,
        last_release_tag: row.last_release_tag,
        last_release_date: row.last_release_date,
        last_release_notes: row.last_release_notes,
        last_tag: row.last_tag,
        last_tag_date: row.last_tag_date,
        acknowledged_release: row.acknowledged_release,
        release_notification_active: row.release_notification_active,
        last_sync_at: row.last_sync_at,
        has_updates: row.has_updates,
      }),
    };
  },

  findByFullName(fullName: string): Repo | null {
    const row = db.prepare('SELECT * FROM repos WHERE full_name = ?').get(fullName);
    return row ? mapRepo(row) : null;
  },

  create(data: CreateRepoDto & { owner: string; name: string; full_name: string; github_id?: string }): Repo {
    const stmt = db.prepare(`
      INSERT INTO repos (github_id, owner, name, full_name, url, description, notes, category_id, local_path, installed_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.github_id || null,
      data.owner,
      data.name,
      data.full_name,
      data.url,
      data.description || null,
      data.notes || null,
      data.category_id || null,
      data.local_path || null,
      data.installed_version || null
    );

    return this.findById(result.lastInsertRowid as number) as unknown as Repo;
  },

  update(id: number, data: UpdateRepoDto): Repo | null {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(data.category_id);
    }

    if (data.local_path !== undefined) {
      fields.push('local_path = ?');
      values.push(data.local_path);
    }

    if (fields.length === 0) return null;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = db.prepare(`UPDATE repos SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id) as unknown as Repo;
  },

  toggleFavorite(id: number): boolean {
    const stmt = db.prepare(`
      UPDATE repos SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  },

  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM repos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  getStats(): { total: number; withUpdates: number; favorites: number } {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN s.has_updates = 1 THEN 1 ELSE 0 END) as with_updates,
        SUM(CASE WHEN r.is_favorite = 1 THEN 1 ELSE 0 END) as favorites
      FROM repos r
      LEFT JOIN sync_state s ON r.id = s.repo_id
    `).get() as { total: number; with_updates: number; favorites: number };

    return {
      total: stats.total || 0,
      withUpdates: stats.with_updates || 0,
      favorites: stats.favorites || 0,
    };
  },

  getOwners(): OwnerStats[] {
    const rows = db.prepare(`
      SELECT owner, COUNT(*) as repo_count
      FROM repos
      GROUP BY owner
      ORDER BY repo_count DESC, owner ASC
    `).all() as { owner: string; repo_count: number }[];

    return rows;
  },

  acknowledgeUpdates(repoId: number, version: string): boolean {
    // Update sync_state
    const syncStmt = db.prepare(`
      UPDATE sync_state
      SET acknowledged_release = ?,
          release_notification_active = 0,
          has_updates = 0
      WHERE repo_id = ?
    `);
    const syncResult = syncStmt.run(version, repoId);

    // Update version_history
    const historyStmt = db.prepare(`
      UPDATE version_history
      SET acknowledged_at = datetime('now')
      WHERE repo_id = ? AND version_value = ? AND acknowledged_at IS NULL
    `);
    historyStmt.run(repoId, version);

    return syncResult.changes > 0;
  },

  updateInstalledVersion(id: number, version: string | null): Repo | null {
    const stmt = db.prepare(`
      UPDATE repos SET installed_version = ?, updated_at = datetime('now') WHERE id = ?
    `);
    const result = stmt.run(version, id);

    if (result.changes === 0) return null;
    return this.findById(id) as unknown as Repo;
  },
};
