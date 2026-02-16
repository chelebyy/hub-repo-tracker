import { db } from '../../shared/db/index.js';
import { githubClient, CommitInfo, ReleaseInfo, TagInfo } from './github-client.js';
import { repoRepository } from '../repos/repository.js';
import { logger } from '../../shared/logger.js';
import pLimit from 'p-limit';
import { randomUUID } from 'node:crypto';

export interface SyncResult {
  repoId: number;
  fullName: string;
  success: boolean;
  error?: string;
  hasUpdates: boolean;
  commit?: CommitInfo | null;
  release?: ReleaseInfo | null;
  tag?: TagInfo | null;
}

export interface SyncProgress {
  jobId: string;
  total: number;
  completed: number;
  failed: number;
  results: SyncResult[];
  inProgress: boolean;
}

interface CurrentSyncState {
  last_commit_sha?: string;
  last_release_tag?: string;
  last_tag?: string;
  acknowledged_release?: string;
  release_notification_active?: number;
}

interface VersionUpdate {
  type: 'release' | 'tag' | 'commit';
  value: string;
  date: string | null;
  notes?: string | null;
  isNew: boolean;
}

// In-memory sync progress tracking
let syncProgress: SyncProgress | null = null;

// Normalize version string for comparison (remove 'v' prefix)
function normalizeVersion(version: string | null): string | null {
  if (!version) return null;
  return version.startsWith('v') ? version.slice(1) : version;
}

// Detect version updates with 3-tier priority: release > tag > commit
function detectVersionUpdate(
  current: CurrentSyncState | undefined,
  newRelease: ReleaseInfo | null,
  newTag: TagInfo | null,
  newCommit: CommitInfo | null
): VersionUpdate | null {
  // Priority 1: Release
  if (newRelease) {
    const normalizedRelease = normalizeVersion(newRelease.tag);
    const normalizedAcknowledged = normalizeVersion(current?.acknowledged_release ?? null);

    // Check if this is a new release (not acknowledged)
    if (normalizedRelease !== normalizedAcknowledged) {
      return {
        type: 'release',
        value: newRelease.tag,
        date: newRelease.date,
        notes: newRelease.notes,
        isNew: true,
      };
    }
  }

  // Priority 2: Tag (only if no release or release was acknowledged)
  if (newTag && !newRelease) {
    const normalizedTag = normalizeVersion(newTag.tag);
    const normalizedAcknowledged = normalizeVersion(current?.acknowledged_release ?? null);

    if (normalizedTag !== normalizedAcknowledged && newTag.tag !== current?.last_tag) {
      return {
        type: 'tag',
        value: newTag.tag,
        date: newTag.date,
        isNew: true,
      };
    }
  }

  // Priority 3: Commit (only if no release/tag changes)
  if (newCommit && newCommit.sha !== current?.last_commit_sha) {
    return {
      type: 'commit',
      value: newCommit.sha.slice(0, 7),
      date: newCommit.date,
      isNew: !current?.last_commit_sha ? false : true, // First sync is not "new"
    };
  }

  return null;
}

function saveSyncState(
  repoId: number,
  commit: CommitInfo | null,
  release: ReleaseInfo | null,
  tag: TagInfo | null,
  versionUpdate: VersionUpdate | null
): void {
  const shouldNotify = versionUpdate?.isNew && (versionUpdate.type === 'release' || versionUpdate.type === 'tag');

  const stmt = db.prepare(`
    INSERT INTO sync_state (
      repo_id, last_commit_sha, last_commit_date, last_commit_message, last_commit_author,
      last_release_tag, last_release_date, last_release_notes,
      last_tag, last_tag_date,
      release_notification_active,
      last_sync_at, has_updates
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    ON CONFLICT(repo_id) DO UPDATE SET
      last_commit_sha = excluded.last_commit_sha,
      last_commit_date = excluded.last_commit_date,
      last_commit_message = excluded.last_commit_message,
      last_commit_author = excluded.last_commit_author,
      last_release_tag = excluded.last_release_tag,
      last_release_date = excluded.last_release_date,
      last_release_notes = excluded.last_release_notes,
      last_tag = excluded.last_tag,
      last_tag_date = excluded.last_tag_date,
      release_notification_active = CASE
        WHEN excluded.release_notification_active = 1 THEN 1
        ELSE release_notification_active
      END,
      last_sync_at = excluded.last_sync_at,
      has_updates = excluded.has_updates
  `);

  stmt.run(
    repoId,
    commit?.sha || null,
    commit?.date || null,
    commit?.message || null,
    commit?.author || null,
    release?.tag || null,
    release?.date || null,
    release?.notes || null,
    tag?.tag || null,
    tag?.date || null,
    shouldNotify ? 1 : 0,
    versionUpdate?.isNew ? 1 : 0
  );

  // Record version history for releases and tags
  if (versionUpdate?.isNew && (versionUpdate.type === 'release' || versionUpdate.type === 'tag')) {
    const historyStmt = db.prepare(`
      INSERT INTO version_history (repo_id, version_type, version_value, release_notes, detected_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    historyStmt.run(repoId, versionUpdate.type, versionUpdate.value, versionUpdate.notes || null);
  }
}

function checkForUpdates(
  repoId: number,
  newCommit: CommitInfo | null,
  newRelease: ReleaseInfo | null,
  newTag: TagInfo | null
): { hasUpdates: boolean; current: CurrentSyncState | undefined } {
  const current = db.prepare('SELECT * FROM sync_state WHERE repo_id = ?').get(repoId) as CurrentSyncState | undefined;

  if (!current) return { hasUpdates: true, current: undefined };

  // Check if commit changed
  if (newCommit && newCommit.sha !== current.last_commit_sha) {
    return { hasUpdates: true, current };
  }

  // Check if release changed
  if (newRelease && newRelease.tag !== current.last_release_tag) {
    return { hasUpdates: true, current };
  }

  // Check if tag changed
  if (newTag && newTag.tag !== current.last_tag) {
    return { hasUpdates: true, current };
  }

  return { hasUpdates: false, current };
}

export const syncService = {
  getProgress(): SyncProgress | null {
    return syncProgress;
  },

  async syncRepo(repoId: number): Promise<SyncResult> {
    const repo = repoRepository.findById(repoId);

    if (!repo) {
      logger.warn({ repoId }, 'Sync failed: repository not found');
      return {
        repoId,
        fullName: 'unknown',
        success: false,
        error: 'Repository not found',
        hasUpdates: false,
      };
    }

    logger.info({ repoId, repoName: repo.full_name }, 'Sync started for repo');

    try {
      const data = await githubClient.fetchRepoData(repo.owner, repo.name);
      const { hasUpdates, current } = checkForUpdates(repoId, data.commits, data.releases, data.tags);

      const versionUpdate = detectVersionUpdate(current, data.releases, data.tags, data.commits);

      saveSyncState(repoId, data.commits, data.releases, data.tags, versionUpdate);

      const updateType = versionUpdate?.type;
      logger.info(
        {
          repoId,
          repoName: repo.full_name,
          hasUpdates,
          updateType: updateType || null,
          commitSha: data.commits?.sha?.slice(0, 7),
          releaseTag: data.releases?.tag,
        },
        'Sync completed'
      );

      return {
        repoId,
        fullName: repo.full_name,
        success: true,
        hasUpdates,
        commit: data.commits,
        release: data.releases,
        tag: data.tags,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ repoId, repoName: repo.full_name, error: message }, 'Sync failed');
      return {
        repoId,
        fullName: repo.full_name,
        success: false,
        error: message,
        hasUpdates: false,
      };
    }
  },

  async syncAll(): Promise<SyncProgress> {
    const repos = repoRepository.findAll();
    const jobId = randomUUID();

    logger.info({ jobId, totalRepos: repos.length }, 'Starting sync for all repositories');

    syncProgress = {
      jobId,
      total: repos.length,
      completed: 0,
      failed: 0,
      results: [],
      inProgress: true,
    };

    // Parallel processing with concurrency limit (3) for rate limit protection
    const limit = pLimit(3);

    const tasks = repos.map((repo) =>
      limit(async () => {
        const result = await this.syncRepo(repo.id);

        // Update progress atomically after each sync completes
        if (syncProgress) {
          syncProgress.results.push(result);
          if (result.success) {
            syncProgress.completed++;
          } else {
            syncProgress.failed++;
          }
        }

        return result;
      })
    );

    await Promise.all(tasks);

    syncProgress.inProgress = false;

    logger.info(
      {
        jobId,
        completed: syncProgress.completed,
        failed: syncProgress.failed,
        total: syncProgress.total,
      },
      'Sync completed for all repositories'
    );

    return syncProgress;
  },

  getRateLimitStatus(): { remaining: number; resetAt: Date } {
    return githubClient.getRateLimitStatus();
  },
};
