import type { Repo, Category, RepoPreview, Owner, DashboardStats, FolderScanResult, BackupPreview, RestoreResult, RestoreMode, ListDirectoryResult } from '@/types'

const API_BASE = '/api'

interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    total: number
    with_updates: number
    favorites: number
  }
}

interface RequestOptions extends RequestInit {
  signal?: AbortSignal
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {}

  // Only set Content-Type when sending a body
  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal: options?.signal,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string>),
    },
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    const message = errorBody?.error?.message || errorBody?.message || `HTTP ${res.status}`
    throw new Error(message)
  }

  // Handle empty responses (204 No Content or empty body)
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text)
}

export const api = {
  // Repos
  getRepos: (categoryId?: number, signal?: AbortSignal) => {
    const url = categoryId ? `/repos?category=${categoryId}` : '/repos'
    return request<ApiResponse<Repo[]>>(url, { signal })
  },

  getRepo: (id: number) => request<ApiResponse<Repo>>(`/repos/${id}`),

  addRepo: (url: string, categoryId?: number, notes?: string, localPath?: string, installedVersion?: string) =>
    request<ApiResponse<Repo>>('/repos', {
      method: 'POST',
      body: JSON.stringify({ url, category_id: categoryId, notes, local_path: localPath, installed_version: installedVersion }),
    }),

  updateRepo: (id: number, data: { notes?: string; category_id?: number | null; installed_version?: string | null; local_path?: string | null }) =>
    request<ApiResponse<Repo>>(`/repos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateInstalledVersion: (id: number, version: string | null) =>
    request<ApiResponse<Repo>>(`/repos/${id}/installed-version`, {
      method: 'PATCH',
      body: JSON.stringify({ installed_version: version }),
    }),

  detectVersion: (path: string) =>
    request<ApiResponse<{ version: string | null; projectType: string }>>('/repos/detect-version', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),

  deleteRepo: (id: number) =>
    request<void>(`/repos/${id}`, { method: 'DELETE' }),

  toggleFavorite: (id: number) =>
    request<ApiResponse<Repo>>(`/repos/${id}/favorite`, { method: 'PATCH' }),

  acknowledgeUpdate: (id: number, version: string) =>
    request<ApiResponse<Repo>>(`/repos/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ version }),
    }),

  previewRepo: (url: string) =>
    request<ApiResponse<RepoPreview>>('/repos/preview', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  // Categories
  getCategories: (signal?: AbortSignal) => request<ApiResponse<Category[]>>('/categories', { signal }),

  getOwners: (signal?: AbortSignal) => request<ApiResponse<Owner[]>>('/owners', { signal }),

  createCategory: (data: { name: string; color?: string; type?: 'custom' | 'owner' }) =>
    request<ApiResponse<Category>>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: number, data: { name?: string; color?: string }) =>
    request<ApiResponse<Category>>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: number) =>
    request<void>(`/categories/${id}`, { method: 'DELETE' }),

  // Sync
  syncAll: () => request<void>('/sync', { method: 'POST' }),

  // Dashboard
  getDashboard: () => request<DashboardStats>('/dashboard'),

  // Import from folder
  scanProjects: (path?: string) => {
    const url = path ? `/import/scan?path=${encodeURIComponent(path)}` : '/import/scan'
    return request<ApiResponse<FolderScanResult>>(url)
  },

  // System
  validatePath: (path: string) =>
    request<{ valid: boolean | null; isDirectory?: boolean; resolvedPath?: string; error?: string; message?: string }>(
      '/system/validate-path',
      {
        method: 'POST',
        body: JSON.stringify({ path }),
      }
    ),

  // Backup
  exportJson: async () => {
    const res = await fetch(`${API_BASE}/backup/export/json`)
    if (!res.ok) throw new Error('Export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hub-repo-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  },

  exportSqlite: async () => {
    const res = await fetch(`${API_BASE}/backup/export/sqlite`)
    if (!res.ok) throw new Error('Export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hub-repo-tracker-backup-${new Date().toISOString().split('T')[0]}.db`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  },

  previewBackup: async (file: File): Promise<BackupPreview> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/backup/preview`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const error = await res.json().catch(() => null)
      throw new Error(error?.message || 'Preview failed')
    }
    const text = await res.text()
    return JSON.parse(text)
  },

  importBackup: async (file: File, mode: RestoreMode): Promise<RestoreResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', mode)
    const res = await fetch(`${API_BASE}/backup/import`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const error = await res.json().catch(() => null)
      throw new Error(error?.message || 'Import failed')
    }
    const text = await res.text()
    return JSON.parse(text)
  },

  // Filesystem
  listDirectories: (path?: string) => {
    const url = path ? `/filesystem/list?path=${encodeURIComponent(path)}` : '/filesystem/list'
    return request<ApiResponse<ListDirectoryResult>>(url)
  },
}
