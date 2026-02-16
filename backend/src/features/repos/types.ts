// Repository entity from database
export interface Repo {
  id: number;
  github_id: string | null;
  owner: string;
  name: string;
  full_name: string;
  url: string;
  description: string | null;
  notes: string | null;
  category_id: number | null;
  installed_version: string | null;
  local_path: string | null;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

// Sync state from database
export interface SyncState {
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

// Category info joined with repo
export interface CategoryInfo {
  id: number;
  name: string;
  color: string;
}

// Combined view for API responses
export interface RepoWithSync extends Repo {
  sync_state: SyncState | null;
  category?: CategoryInfo | null;
}

// DTOs
export interface CreateRepoDto {
  url: string;
  description?: string;
  category_id?: number;
  notes?: string;
  local_path?: string;
  installed_version?: string;
}

export interface UpdateRepoDto {
  description?: string;
  notes?: string | null;
  category_id?: number | null;
  local_path?: string | null;
}

export interface RepoQuery {
  favorite?: boolean;
  has_updates?: boolean;
  category?: number;
  sort?: 'name' | 'last_sync' | 'created';
  order?: 'asc' | 'desc';
}

// Preview types
export interface PreviewRepoDto {
  url: string;
}

export interface PreviewRepoResponse {
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  avatar_url: string;
  suggested_version: string | null;
  version_source: 'release' | 'tag' | null;
}

// Owner stats
export interface OwnerStats {
  owner: string;
  repo_count: number;
}

// Version info for UI display
export interface VersionInfo {
  type: 'release' | 'tag' | 'commit';
  value: string;
  date: string | null;
  notes?: string | null;
}

// Acknowledge DTO
export interface AcknowledgeDto {
  version: string;
}

// Installed version DTO
export interface UpdateInstalledVersionDto {
  installed_version: string | null;
}

// Version comparison result
export interface VersionComparison {
  installed_version: string | null;
  latest_version: string | null;
  comparison: 'major' | 'minor' | 'patch' | 'none' | 'ahead' | 'unknown';
  has_update: boolean;
}
