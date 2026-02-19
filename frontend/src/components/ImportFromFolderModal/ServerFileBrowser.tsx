
import { useEffect, useReducer } from 'react'
import { Folder, ArrowUp, ChevronRight, Loader2, HardDrive } from 'lucide-react'
import { api } from '@/services/api'
import type { FileSystemEntry } from '@/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ServerFileBrowserProps {
    readonly onSelect: (path: string) => void
    readonly onCancel: () => void
}

type State = {
    currentPath: string
    entries: FileSystemEntry[]
    parentPath: string | null
    isLoading: boolean
    error: string | null
}

type Action =
    | { type: 'SET_PATH'; payload: string }
    | { type: 'LOAD_START' }
    | { type: 'LOAD_SUCCESS'; payload: { path: string; entries: FileSystemEntry[]; parentPath: string | null } }
    | { type: 'LOAD_FAILURE'; payload: string }

const initialState: State = {
    currentPath: '',
    entries: [],
    parentPath: null,
    isLoading: true,
    error: null
}

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_PATH':
            return { ...state, currentPath: action.payload }
        case 'LOAD_START':
            return { ...state, isLoading: true, error: null }
        case 'LOAD_SUCCESS':
            return {
                ...state,
                isLoading: false,
                currentPath: action.payload.path,
                entries: action.payload.entries,
                parentPath: action.payload.parentPath
            }
        case 'LOAD_FAILURE':
            return { ...state, isLoading: false, error: action.payload }
        default:
            return state
    }
}

export default function ServerFileBrowser({ onSelect, onCancel }: ServerFileBrowserProps) {
    const [state, dispatch] = useReducer(reducer, initialState)
    const { currentPath, entries, parentPath, isLoading, error } = state

    useEffect(() => {
        loadDirectory(currentPath)
    }, [currentPath])

    const loadDirectory = async (path: string) => {
        dispatch({ type: 'LOAD_START' })
        try {
            const res = await api.listDirectories(path)
            if (res.success) {
                dispatch({
                    type: 'LOAD_SUCCESS',
                    payload: {
                        path: res.data.path,
                        entries: res.data.entries,
                        parentPath: res.data.parent
                    }
                })
            }
        } catch (err) {
            dispatch({
                type: 'LOAD_FAILURE',
                payload: err instanceof Error ? err.message : 'Failed to list directories'
            })
        }
    }

    const handleNavigate = (path: string) => {
        dispatch({ type: 'SET_PATH', payload: path })
    }

    const handleUp = () => {
        if (parentPath) {
            dispatch({ type: 'SET_PATH', payload: parentPath })
        }
    }

    // Split path for breadcrumbs (handling generic separators)
    const renderBreadcrumbs = () => {
        if (!currentPath) return null
        // Normalize path separators for display
        const parts = currentPath.split(/[/\\]/).filter(Boolean)

        return (
            <div className="flex items-center text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
                <HardDrive className="w-4 h-4 mr-1 shrink-0" />
                {parts.map((part, index) => (
                    <div key={`${part}-${index}`} className="flex items-center">
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
