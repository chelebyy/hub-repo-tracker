import { useState, useEffect, useRef } from 'react'
import { Loader2, Check, Star, ScanSearch } from 'lucide-react'
import { api } from '@/services/api'
import type { Category, RepoPreview } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PathInput } from '@/components/PathInput'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string, categoryId?: number, notes?: string, localPath?: string, installedVersion?: string) => Promise<void>
  categories: Category[]
}

export function AddRepoModal({ isOpen, onClose, onSubmit, categories }: Props) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<RepoPreview | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [notes, setNotes] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [installedVersion, setInstalledVersion] = useState('')
  const [detectingVersion, setDetectingVersion] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<any>(null)
  const localPathDebounceRef = useRef<any>(null)

  useEffect(() => {
    if (isOpen) {
      setUrl('')
      setError(null)
      setPreview(null)
      setSelectedCategoryId(undefined)
      setNotes('')
      setLocalPath('')
      setInstalledVersion('')
      // Small delay to allow Dialog animation to start before focusing
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Auto-detect version when localPath changes
  useEffect(() => {
    if (localPathDebounceRef.current) {
      clearTimeout(localPathDebounceRef.current)
    }

    const trimmedPath = localPath.trim()
    if (!trimmedPath) {
      setInstalledVersion('')
      return
    }

    localPathDebounceRef.current = setTimeout(async () => {
      setDetectingVersion(true)
      try {
        const response = await api.detectVersion(trimmedPath)
        if (response.data.version) {
          setInstalledVersion(response.data.version)
        }
      } catch (err) {
        // Silently fail - version detection is optional
        console.log('Could not detect version:', err)
      } finally {
        setDetectingVersion(false)
      }
    }, 800)

    return () => {
      if (localPathDebounceRef.current) {
        clearTimeout(localPathDebounceRef.current)
      }
    }
  }, [localPath])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const trimmedUrl = url.trim()

    // Empty URL - clear everything
    if (!trimmedUrl) {
      setPreview(null)
      setPreviewing(false)
      setError(null)
      return
    }

    const isValidUrl = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/.test(trimmedUrl)

    if (isValidUrl) {
      setPreviewing(true)
      setError(null)
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await api.previewRepo(trimmedUrl)
          setPreview(response.data)
          // Auto-fill installed_version with suggested_version if no local_path
          if (response.data.suggested_version && !localPath.trim()) {
            setInstalledVersion(response.data.suggested_version)
          }
        } catch (err) {
          setPreview(null)
          setError(err instanceof Error ? err.message : 'Failed to fetch preview')
        } finally {
          setPreviewing(false)
        }
      }, 500)
    } else {
      // Invalid URL format - show validation error
      setPreview(null)
      setPreviewing(false)
      setError('Invalid URL format. Use: https://github.com/owner/repo')
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [url, localPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preview) return

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit(
        url.trim(),
        selectedCategoryId,
        notes || undefined,
        localPath.trim() || undefined,
        installedVersion.trim() || undefined
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Repository</DialogTitle>
          <DialogDescription>
            Enter a GitHub repository URL to add it to your tracker.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">GitHub Repository URL</Label>
            <div className="relative">
              <Input
                id="url"
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="pr-10"
                disabled={submitting}
              />
              {previewing && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              )}
              {preview && !previewing && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          </div>

          {/* Preview Card */}
          {preview && (
            <Card className="bg-muted/50 border-muted">
              <CardContent className="p-4 flex items-start gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={preview.avatar_url} alt={preview.owner} />
                  <AvatarFallback>{(preview.owner || '?').substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {preview.full_name}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                      <Star className="w-3 h-3 fill-current" />
                      {preview.stars.toLocaleString()}
                    </div>
                  </div>
                  {preview.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {preview.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Select
              value={selectedCategoryId?.toString() || "null"}
              onValueChange={(val) => setSelectedCategoryId(val === "null" ? undefined : Number(val))}
              disabled={submitting}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes about this repo..."
              className="resize-none min-h-[80px]"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="local-path">Local Path (optional)</Label>
            <PathInput
              value={localPath}
              onChange={setLocalPath}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installed-version">Installed Version (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="installed-version"
                value={installedVersion}
                onChange={(e) => setInstalledVersion(e.target.value)}
                placeholder="e.g., 1.2.3"
                className="flex-1"
                disabled={submitting}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={async () => {
                  if (!localPath.trim()) return
                  setDetectingVersion(true)
                  try {
                    const response = await api.detectVersion(localPath.trim())
                    if (response.data.version) {
                      setInstalledVersion(response.data.version)
                    }
                  } catch (err) {
                    console.error('Failed to detect version:', err)
                  } finally {
                    setDetectingVersion(false)
                  }
                }}
                disabled={detectingVersion || !localPath.trim()}
                title="Auto-detect from local path"
              >
                <ScanSearch className={cn("w-4 h-4", detectingVersion && "animate-pulse")} />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Auto-detected from local path when available
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || previewing || !preview}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Repository'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
