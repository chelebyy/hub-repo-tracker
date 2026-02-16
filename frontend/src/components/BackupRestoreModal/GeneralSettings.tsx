import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/hooks/useSettings'
import { AlertCircle, CheckCircle2, Key } from 'lucide-react'

interface Props {
    onSuccess: (msg: string) => void
    onError: (msg: string) => void
}

export function GeneralSettings({ onSuccess, onError }: Props) {
    const { settings, updateSettings, loading } = useSettings()
    const [token, setToken] = useState('')

    useEffect(() => {
        if (settings.github_token) {
            setToken(settings.github_token)
        }
    }, [settings])

    const handleSave = async () => {
        if (!token) {
            onError('Token cannot be empty')
            return
        }

        const success = await updateSettings({ github_token: token })
        if (success) {
            onSuccess('Settings saved successfully')
        } else {
            onError('Failed to save settings')
        }
    }

    if (loading) return <div className="p-4 text-center">Loading settings...</div>

    const isEnvSet = settings.has_env_token === 'true'

    return (
        <div className="space-y-6 py-4">
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="token" className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        GitHub Personal Access Token
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="token"
                            type="password"
                            placeholder="ghp_xxxxxxxxxxxx"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            disabled={isEnvSet}
                        />
                        <Button onClick={handleSave} disabled={isEnvSet}>Save</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        A token is required to fetch repository data from GitHub API.
                        You can create one in <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline">GitHub Settings</a>.
                    </p>
                </div>

                {isEnvSet ? (
                    <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20 flex gap-3 text-blue-700 dark:text-blue-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold leading-none">Environment Active</p>
                            <p className="text-xs">
                                A GITHUB_TOKEN is already set in your `.env` file or environment.
                                The manual input is disabled to prevent conflicts.
                            </p>
                        </div>
                    </div>
                ) : !settings.github_token ? (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex gap-3 text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold leading-none">Token Missing</p>
                            <p className="text-xs">
                                GitHub API features are currently limited. Please provide a token above.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 flex gap-3 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold leading-none">Token Active</p>
                            <p className="text-xs text-green-700 dark:text-green-500">
                                Your token is stored securely in the local database and ready to use.
                            </p>
                        </div>
                    </div>
                )
                }
            </div>

            <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Security Note</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    The token is stored in your local `data/repos.db` file.
                    For maximum security, ensure you only use tokens with the minimum required scopes
                    (public_repo or repo for private ones).
                </p>
            </div>
        </div>
    )
}
