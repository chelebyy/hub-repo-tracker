export type ManifestSource = 'git' | 'package.json' | 'go.mod' | 'Cargo.toml' | 'pyproject.toml'

export interface SyncState {
  repo_id: number
  last_commit_sha: string | null
  last_commit_date: string | null
  last_commit_message: string | null
  last_commit_author: string | null
  last_release_tag: string | null
  last_release_date: string | null
  last_release_notes: string | null
  last_tag: string | null
  last_tag_date: string | null
  acknowledged_release: string | null
  release_notification_active: boolean
  last_sync_at: string | null
  has_updates: boolean
}

export interface VersionInfo {
  type: 'release' | 'tag' | 'commit'
  value: string
  date: string | null
  notes?: string | null
  isAcknowledged: boolean
  notificationActive: boolean
}

export interface Category {
  id: number
  name: string
  type: 'custom' | 'owner'
  color: string
  icon: string | null
  owner_name: string | null
  created_at: string
}

export interface Repo {
  id: number
  github_id: string
  owner: string
  name: string
  full_name: string
  url: string
  description: string | null
  notes: string | null
  category_id: number | null
  category?: Category
  is_favorite: boolean
  created_at: string
  updated_at: string
  sync_state?: SyncState
  installed_version: string | null
  local_path: string | null
}

export interface ScannedProject {
  path: string
  name: string
  gitConfigPath: string | null
  githubRepo: {
    owner: string
    repo: string
    url: string
  } | null
  projectType: 'node' | 'python' | 'go' | 'rust' | 'unknown' | null
  detectionSource: ManifestSource | null
  version: string | null
}

export interface FolderScanResult {
  projects: ScannedProject[]
  scannedAt: string
  totalFound: number
}

export interface VersionComparison {
  installed_version: string | null
  latest_version: string | null
  comparison: 'major' | 'minor' | 'patch' | 'none' | 'ahead' | 'unknown'
  has_update: boolean
}

export interface RepoPreview {
  owner: string
  name: string
  full_name: string
  description: string | null
  stars: number
  avatar_url: string
  suggested_version: string | null
  version_source: 'release' | 'tag' | null
}

export interface Owner {
  name: string
  avatar_url: string
  repo_count: number
}

export interface DashboardStats {
  total_repos: number
  repos_with_updates: number
  last_sync_at: string | null
}

export type SortField = 'name' | 'last_sync' | 'has_updates' | 'favorite'

export interface FilterState {
  search: string
  sort: SortField
  showUpdatesOnly: boolean
  showFavoritesOnly: boolean
  categoryId: number | null
}

export interface BackupPreview {
  total_repos: number
  total_categories: number
  exported_at: string
  version?: string
}

export interface RestoreResult {
  imported_repos: number
  imported_categories: number
  skipped_repos: number
  merged: boolean
}

export type RestoreMode = 'merge' | 'replace'

export interface FileSystemEntry {
  name: string
  path: string
  isDirectory: boolean
}

export interface ListDirectoryResult {
  path: string
  entries: FileSystemEntry[]
  parent: string | null
  error?: string
}
