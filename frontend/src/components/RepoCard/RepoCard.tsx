import { useState } from 'react'
import {
  Star,
  Trash2,
  GitCommit,
  Clock,
  Pencil,
  CheckCircle2,
  Tag,
  StickyNote,
  Package,
  FolderOpen,
} from 'lucide-react'
import type { Repo, Category } from '@/types'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import EditRepoDialog from './EditRepoDialog'
import ViewNotesDialog from './ViewNotesDialog'

interface Props {
  repo: Repo
  categories: Category[]
  onDelete: (id: number) => Promise<void>
  onToggleFavorite: (id: number) => Promise<void>
  onUpdateRepo: (id: number, data: { notes?: string; category_id?: number | null; installed_version?: string | null; local_path?: string | null }) => Promise<void>
  onAcknowledge: (id: number, version: string) => Promise<void>
}

// Get version info for display
function getVersionInfo(repo: Repo): { type: 'release' | 'tag' | 'commit'; value: string; notes?: string | null } | null {
  const sync = repo.sync_state
  if (!sync) return null

  // Priority: release > tag
  if (sync.last_release_tag) {
    return {
      type: 'release',
      value: sync.last_release_tag,
      notes: sync.last_release_notes,
    }
  }

  if (sync.last_tag) {
    return {
      type: 'tag',
      value: sync.last_tag,
    }
  }

  return null
}

export function RepoCard({ repo, categories, onDelete, onToggleFavorite, onUpdateRepo, onAcknowledge }: Readonly<Props>) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [viewingNotes, setViewingNotes] = useState(false)

  const versionInfo = getVersionInfo(repo)
  const hasNotification = repo.sync_state?.release_notification_active

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete ${repo.full_name}?`)) return
    setDeleting(true)
    await onDelete(repo.id)
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    await onToggleFavorite(repo.id)
  }

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!versionInfo) return
    setAcknowledging(true)
    try {
      await onAcknowledge(repo.id, versionInfo.value)
    } finally {
      setAcknowledging(false)
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <Card className="group h-full flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-muted/60">
        {/* Notification indicator */}
        {hasNotification && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
        )}

        {/* Decorative gradient corner */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all duration-500" />

        <CardHeader className="p-4 pb-2 relative z-10 space-y-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-bold leading-tight">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline transition-colors truncate block text-foreground"
                  title={repo.full_name}
                >
                  {repo.name}
                </a>
              </CardTitle>
              <CardDescription className="text-xs truncate block mt-0.5">
                {repo.owner}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 shrink-0 transition-colors",
                repo.is_favorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"
              )}
              onClick={handleToggleFavorite}
            >
              <Star className={cn("h-3.5 w-3.5", repo.is_favorite && "fill-current")} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 py-2 flex-1 flex flex-col">
          {repo.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed opacity-90 min-h-[2.4em] mb-4">
              {repo.description}
            </p>
          )}

          {/* Version Badge */}
          {hasNotification && versionInfo && (
            <div className="mb-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 cursor-pointer",
                        versionInfo.type === 'release'
                          ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30"
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                      )}
                      variant="outline"
                    >
                      <Tag className="w-2.5 h-2.5 mr-1" />
                      {versionInfo.value}
                    </Badge>
                  </TooltipTrigger>
                  {versionInfo.notes && (
                    <TooltipContent className="max-w-[250px] text-xs">
                      <p className="whitespace-pre-wrap">{versionInfo.notes.slice(0, 200)}{versionInfo.notes.length > 200 ? '...' : ''}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Installed Version Badge */}
          {repo.installed_version && (
            <div className="mb-3 flex items-center gap-2">
              <Badge
                className="text-[10px] font-semibold px-2 py-0.5 bg-muted/50 text-muted-foreground border-border/50"
                variant="outline"
              >
                <Package className="w-2.5 h-2.5 mr-1" />
                {repo.installed_version}
              </Badge>
            </div>
          )}

          {/* Local Path Badge */}
          {repo.local_path && (
            <div className="mb-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-default max-w-full"
                      variant="outline"
                    >
                      <FolderOpen className="w-2.5 h-2.5 mr-1 shrink-0" />
                      <span className="truncate">{repo.local_path}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] text-xs">
                    <p className="break-all">{repo.local_path}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <GitCommit className="w-3 h-3 text-primary/70 shrink-0" />
                <span className="truncate font-mono text-[10px]">{repo.sync_state?.last_commit_sha?.slice(0, 7) || '-'}</span>
              </div>
              {repo.sync_state?.has_updates && !hasNotification && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-500 font-bold uppercase tracking-tighter text-[10px]">
                  <span className="w-1.5 h-1.5 bg-current rounded-full" />
                  <span>Update</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-primary/70 shrink-0" />
              <span className="text-[10px]">{formatDate(repo.sync_state?.last_sync_at)}</span>
            </div>
          </div>

          {repo.notes && (
            <button
              className="mt-2 bg-muted/30 p-1.5 rounded-md border border-border/30 hover:bg-muted/50 transition-colors cursor-pointer group/notes-area relative flex flex-col gap-0.5 w-full text-left"
              onClick={() => setViewingNotes(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setViewingNotes(true)
                }
              }}
              title="View full notes"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground/70 font-medium text-[9px] uppercase tracking-wider mb-0.5">
                <StickyNote className="w-2.5 h-2.5" />
                <span>Notes</span>
              </div>
              <p className="text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-2 leading-tight">
                {repo.notes}
              </p>
            </button>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-2 border-t bg-muted/20 mt-auto">
          <div className="flex items-center justify-between w-full group/notes h-6">
            <div className="flex items-center gap-2">
              {repo.category ? (
                <Badge
                  variant="outline"
                  className="text-[10px] truncate max-w-[100px] border-none px-1.5 py-0 h-5"
                  style={{
                    backgroundColor: `${repo.category.color}15`,
                    color: repo.category.color,
                    boxShadow: `0 0 0 1px ${repo.category.color}30`
                  }}
                >
                  {repo.category.name}
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground/60 italic">No category</span>
              )}

              {/* Acknowledge Button */}
              {hasNotification && versionInfo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-[10px] text-green-600 hover:text-green-700 hover:bg-green-500/10"
                  onClick={handleAcknowledge}
                  disabled={acknowledging}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-accent"
                onClick={() => setEditing(true)}
                title="Edit Repo"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {editing && (
        <EditRepoDialog
          repo={repo}
          categories={categories}
          onClose={() => setEditing(false)}
          onSave={onUpdateRepo}
        />
      )}

      {viewingNotes && (
        <ViewNotesDialog
          repo={repo}
          onClose={() => setViewingNotes(false)}
          onEditNotes={() => setEditing(true)}
        />
      )}
    </>
  )
}
