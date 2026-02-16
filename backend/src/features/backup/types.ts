import type { Repo } from '../repos/types.js';

// Backup data structure for JSON export
export interface BackupData {
  version: string;
  exported_at: string;
  data: {
    repos: BackupRepo[];
    categories: BackupCategory[];
    sync_state: BackupSyncState[];
    settings: BackupSettings;
  };
  meta: {
    total_repos: number;
    total_categories: number;
  };
}

// Repo with version history for backup
export interface BackupRepo extends Omit<Repo, 'id'> {
  id: number;
  version_history?: BackupVersionHistory[];
}

// Category for backup
export interface BackupCategory {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string | null;
  owner_name: string | null;
  created_at: string;
}

// Sync state for backup
export interface BackupSyncState {
  repo_id: number;
  last_commit_sha: string | null;
  last_commit_date: string | null;
  last_commit_message: string | null;
  last_commit_author: string | null;
  last_release_tag: string | null;
  last_release_date: string | null;
  last_release_notes: string | null;
  last_tag: string | null;
  last_tag_date: string | null;
  acknowledged_release: string | null;
  release_notification_active: number;
  last_sync_at: string | null;
  has_updates: number;
}

// Version history for backup
export interface BackupVersionHistory {
  id: number;
  repo_id: number;
  version_type: string;
  version_value: string;
  release_notes: string | null;
  detected_at: string;
  acknowledged_at: string | null;
}

// Settings for backup
export interface BackupSettings {
  theme?: string;
}

// Restore options
export interface RestoreOptions {
  mode: 'merge' | 'replace';
}

// Restore result
export interface RestoreResult {
  success: boolean;
  message: string;
  stats: {
    repos_imported: number;
    repos_skipped: number;
    categories_imported: number;
    categories_skipped: number;
    sync_states_restored: number;
    version_history_restored: number;
  };
  errors: string[];
}
