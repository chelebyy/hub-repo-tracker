import { useState, useEffect, useCallback } from 'react'
import type { Repo, FilterState, SortField } from '@/types'
import { api } from '@/services/api'

export function useRepos(categoryId?: number) {
  const [repos, setRepos] = useState<Repo[]>([])
  const [meta, setMeta] = useState<{ total: number; with_updates: number; favorites: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRepos = useCallback(async (options?: { signal?: AbortSignal; silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true)
      }
      setError(null)
      const response = await api.getRepos(categoryId, options?.signal)
      setRepos(response.data)
      setMeta(response.meta || null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to fetch repos')
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    const controller = new AbortController()
    fetchRepos({ signal: controller.signal })
    return () => controller.abort()
  }, [fetchRepos])

  const addRepo = async (url: string, catId?: number, notes?: string, localPath?: string, installedVersion?: string) => {
    try {
      const response = await api.addRepo(url, catId, notes, localPath, installedVersion)
      setRepos((prev) => [...prev, response.data])
      await fetchRepos({ silent: true })
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repo')
      throw err
    }
  }

  const updateRepo = async (id: number, data: { notes?: string; category_id?: number | null; installed_version?: string | null; local_path?: string | null }) => {
    try {
      const response = await api.updateRepo(id, data)
      setRepos((prev) => prev.map((r) => (r.id === id ? response.data : r)))
      await fetchRepos({ silent: true })
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update repo')
      throw err
    }
  }

  const deleteRepo = async (id: number) => {
    try {
      await api.deleteRepo(id)
      setRepos((prev) => prev.filter((r) => r.id !== id))
      await fetchRepos({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete repo')
      throw err
    }
  }

  const toggleFavorite = async (id: number) => {
    try {
      const response = await api.toggleFavorite(id)
      setRepos((prev) => prev.map((r) => (r.id === id ? response.data : r)))
      await fetchRepos({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite')
      throw err
    }
  }

  const syncAll = async () => {
    try {
      await api.syncAll()
      await fetchRepos({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync')
      throw err
    }
  }

  const acknowledgeRepo = async (id: number, version: string) => {
    try {
      const response = await api.acknowledgeUpdate(id, version)
      setRepos((prev) => prev.map((r) => (r.id === id ? response.data : r)))
      await fetchRepos({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge update')
      throw err
    }
  }

  return { repos, meta, loading, error, addRepo, updateRepo, deleteRepo, toggleFavorite, syncAll, acknowledgeRepo, refetch: fetchRepos }
}

export function useFilter(repos: Repo[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sort: 'name',
    showUpdatesOnly: false,
    showFavoritesOnly: false,
    categoryId: null,
  })

  const filtered = repos.filter((repo) => {
    if (filters.showUpdatesOnly && !repo.sync_state?.has_updates) return false
    if (filters.showFavoritesOnly && !repo.is_favorite) return false

    if (filters.search) {
      const term = filters.search.toLowerCase()
      return (
        repo.name.toLowerCase().includes(term) ||
        repo.full_name.toLowerCase().includes(term) ||
        (repo.description?.toLowerCase().includes(term) ?? false)
      )
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case 'name': {
        return a.full_name.localeCompare(b.full_name)
      }
      case 'last_sync': {
        const aSync = a.sync_state?.last_sync_at || ''
        const bSync = b.sync_state?.last_sync_at || ''
        return bSync.localeCompare(aSync)
      }
      case 'has_updates': {
        const aUpdate = a.sync_state?.has_updates ? 1 : 0
        const bUpdate = b.sync_state?.has_updates ? 1 : 0
        return bUpdate - aUpdate
      }
      case 'favorite': {
        const aFav = a.is_favorite ? 1 : 0
        const bFav = b.is_favorite ? 1 : 0
        return bFav - aFav
      }
      default: {
        return 0
      }
    }
  })

  const setSearch = (search: string) => setFilters((p) => ({ ...p, search }))
  const setSort = (sort: SortField) => setFilters((p) => ({ ...p, sort }))
  const toggleUpdatesOnly = () =>
    setFilters((p) => ({ ...p, showUpdatesOnly: !p.showUpdatesOnly }))
  const toggleFavoritesOnly = () =>
    setFilters((p) => ({ ...p, showFavoritesOnly: !p.showFavoritesOnly }))

  return {
    filtered: sorted,
    filters,
    setSearch,
    setSort,
    toggleUpdatesOnly,
    toggleFavoritesOnly,
  }
}
