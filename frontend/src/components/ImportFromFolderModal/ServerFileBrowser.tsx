
import { useState, useEffect } from 'react'
import { Folder, ArrowUp, ChevronRight, Loader2, HardDrive } from 'lucide-react'
import { api } from '@/services/api'
import type { FileSystemEntry } from '@/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ServerFileBrowserProps {
    onSelect: (path: string) => void
    onCancel: () => void
}

export default function ServerFileBrowser({ onSelect, onCancel }: ServerFileBrowserProps) {
    const [currentPath, setCurrentPath] = useState<string>('')
    const [entries, setEntries] = useState<FileSystemEntry[]>([])
    const [parentPath, setParentPath] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadDirectory(currentPath)
    }, [currentPath])

    const loadDirectory = async (path: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await api.listDirectories(path)
            if (res.success) {
                setEntries(res.data.entries)
                setCurrentPath(res.data.path)
                setParentPath(res.data.parent)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to list directories')
        } finally {
            setIsLoading(false)
        }
    }

    const handleNavigate = (path: string) => {
        setCurrentPath(path)
    }

    const handleUp = () => {
        if (parentPath) {
            setCurrentPath(parentPath)
        }
    }

    // Split path for breadcrumbs (handling generic separators)
    const renderBreadcrumbs = () => {
        if (!currentPath) return null
        // Normalize path separators for display
        const parts = currentPath.split(/[/\\]/).filter(p => p)

        return (
            <div className="flex items-center text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
                <HardDrive className="w-4 h-4 mr-1 shrink-0" />
                {parts.map((part, index) => (
                    <div key={index} className="flex items-center">
                        <ChevronRight className="w-4 h-4 mx-0.5 shrink-0 opacity-50" />
                        <span className={cn(
                            "truncate max-w-[150px]",
                            index === parts.length - 1 && "font-medium text-foreground"
                        )}>
                            {part}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[400px] gap-4">
            {/* Header / Navigation */}
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleUp}
                    disabled={!parentPath || isLoading}
                    title="Go Up"
                >
                    <ArrowUp className="w-4 h-4" />
                </Button>

                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    {renderBreadcrumbs()}
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 border rounded-md relative overflow-hidden">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : null}

                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
                        <p className="font-medium">Error loading directory</p>
                        <p className="text-sm opacity-80 mt-1">{error}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => loadDirectory(currentPath)}>
                            Retry
                        </Button>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="p-2 grid gap-1">
                            {entries.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No folders found in this directory
                                </div>
                            ) : (
                                entries.map((entry) => (
                                    <button
                                        key={entry.path}
                                        onClick={() => handleNavigate(entry.path)}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left transition-colors focus:bg-accent focus:outline-none"
                                    >
                                        <Folder className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" />
                                        <span className="text-sm truncate">{entry.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Footer / Actions */}
            <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-muted-foreground truncate max-w-[60%]">
                    Selected: <span className="font-mono">{currentPath}</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSelect(currentPath)} disabled={!currentPath}>
                        Select This Folder
                    </Button>
                </div>
            </div>
        </div>
    )
}
