import { useState, useEffect } from 'react'

export interface Settings {
    github_token?: string
    has_env_token?: string
    [key: string]: string | undefined
}

export function useSettings() {
    const [settings, setSettings] = useState<Settings>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/settings')
            if (!response.ok) throw new Error('Failed to fetch settings')
            const data = await response.json()
            setSettings(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const updateSettings = async (newSettings: Record<string, string>) => {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSettings),
            })
            if (!response.ok) throw new Error('Failed to update settings')
            await fetchSettings() // Refresh
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            return false
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    return { settings, loading, error, updateSettings, refresh: fetchSettings }
}
