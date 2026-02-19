import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import type { Category, Owner } from '@/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      const response = await api.getCategories(signal)
      setCategories(response.data)
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOwners = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await api.getOwners(signal)
      setOwners(response.data)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to load owners:', err)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal)
    fetchOwners(controller.signal)
    return () => controller.abort()
  }, [fetchCategories, fetchOwners])

  const createCategory = async (name: string, color?: string) => {
    try {
      const response = await api.createCategory({ name, color })
      setCategories(prev => [...prev, response.data])
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
      throw err
    }
  }

  const updateCategory = async (id: number, data: { name?: string; color?: string }) => {
    try {
      const response = await api.updateCategory(id, data)
      setCategories(prev => prev.map(c => c.id === id ? response.data : c))
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category')
      throw err
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      await api.deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
      throw err
    }
  }

  return {
    categories,
    owners,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh: () => Promise.all([fetchCategories(), fetchOwners()]),
  }
}
