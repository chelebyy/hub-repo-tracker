import { FastifyInstance } from 'fastify';
import { db } from '../../shared/db/index.js';

interface DashboardQuery {
  sort?: 'name' | 'last_commit' | 'last_release' | 'has_updates';
  order?: 'asc' | 'desc';
  filter?: 'all' | 'favorites' | 'updates';
}

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/dashboard - Aggregated dashboard view
  app.get('/api/dashboard', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          sort: { type: 'string', enum: ['name', 'last_commit', 'last_release', 'has_updates'] },
          order: { type: 'string', enum: ['asc', 'desc'] },
          filter: { type: 'string', enum: ['all', 'favorites', 'updates'] },
        },
      },
    },
  }, async (request) => {
    const query = request.query as DashboardQuery;

    // Build sort clause
    const sortMap: Record<string, string> = {
      name: 'r.full_name',
      last_commit: 's.last_commit_date',
      last_release: 's.last_release_date',
      has_updates: 's.has_updates',
    };

    const sortBy = sortMap[query.sort || 'last_commit'] || 'r.full_name';
    const order = query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build filter clause
    let filterClause = '';
    if (query.filter === 'favorites') {
      filterClause = 'WHERE r.is_favorite = 1';
    } else if (query.filter === 'updates') {
      filterClause = 'WHERE s.has_updates = 1';
    }

    // Fetch repos with sync state
    const repos = db.prepare(`
      SELECT
        r.id,
        r.owner,
        r.name,
        r.full_name,
        r.url,
        r.description,
        r.is_favorite,
        r.created_at,
        s.last_commit_sha,
        s.last_commit_date,
        s.last_commit_message,
        s.last_commit_author,
        s.last_release_tag,
        s.last_release_date,
        s.last_sync_at,
        s.has_updates
      FROM repos r
      LEFT JOIN sync_state s ON r.id = s.repo_id
      ${filterClause}
      ORDER BY r.is_favorite DESC, ${sortBy} ${order}
    `).all() as Record<string, unknown>[];

    // Calculate statistics
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_repos,
        SUM(CASE WHEN r.is_favorite = 1 THEN 1 ELSE 0 END) as favorites,
        SUM(CASE WHEN s.has_updates = 1 THEN 1 ELSE 0 END) as with_updates,
        SUM(CASE WHEN s.last_sync_at IS NULL THEN 1 ELSE 0 END) as never_synced,
        MAX(s.last_sync_at) as last_sync
      FROM repos r
      LEFT JOIN sync_state s ON r.id = s.repo_id
    `).get() as {
      total_repos: number;
      favorites: number;
      with_updates: number;
      never_synced: number;
      last_sync: string | null;
    };

    // Group repos by owner
    const byOwner: Record<string, typeof repos> = {};
    for (const repo of repos) {
      const owner = repo.owner as string;
      if (!byOwner[owner]) {
        byOwner[owner] = [];
      }
      byOwner[owner].push({
        ...repo,
        is_favorite: Boolean(repo.is_favorite),
        has_updates: Boolean(repo.has_updates),
      });
    }

    return {
      success: true,
      data: {
        repos: repos.map(r => ({
          id: r.id,
          owner: r.owner,
          name: r.name,
          full_name: r.full_name,
          url: r.url,
          description: r.description,
          is_favorite: Boolean(r.is_favorite),
          has_updates: Boolean(r.has_updates),
          last_commit: r.last_commit_sha ? {
            sha: r.last_commit_sha,
            date: r.last_commit_date,
            message: r.last_commit_message,
            author: r.last_commit_author,
          } : null,
          last_release: r.last_release_tag ? {
            tag: r.last_release_tag,
            date: r.last_release_date,
          } : null,
          last_sync_at: r.last_sync_at,
        })),
        byOwner,
        stats: {
          totalRepos: stats.total_repos || 0,
          favorites: stats.favorites || 0,
          withUpdates: stats.with_updates || 0,
          neverSynced: stats.never_synced || 0,
          lastSync: stats.last_sync,
        },
      },
    };
  });
}
