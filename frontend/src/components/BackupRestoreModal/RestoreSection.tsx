import { useState, useRef } from 'react'
import { Upload, Loader2, AlertTriangle, CheckCircle, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/services/api'
import type { BackupPreview, RestoreMode } from '@/types'

interface Props {
  onSuccess: (message: string) => void
  onError: (message: string) => void
  onRestoreComplete: () => void
}

export function RestoreSection({ onSuccess, onError, onRestoreComplete }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<BackupPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<RestoreMode>('merge')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setPreview(null)
    setPreviewError(null)
    setLoading(true)

    try {
      const result = await api.previewBackup(selectedFile)
      setPreview(result)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Cannot read file')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!file) return

    setLoading(true)
    try {
      const result = await api.importBackup(file, mode)
      onSuccess(
        `Restore completed: ${result.imported_repos} repos, ${result.imported_categories} categories added` +
        (result.skipped_repos > 0 ? `, ${result.skipped_repos} repos skipped` : '')
      )
      onRestoreComplete()
      // Reset state
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Restore failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setPreviewError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Restore from a previously created backup file. You can use JSON or SQLite files.
      </div>

      {/* File Input */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Select backup file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.db,.sqlite,.sqlite3"
          onChange={handleFileSelect}
          className="hidden"
          disabled={loading}
        />
        {loading && !preview ? (
          <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
        ) : (
          <FileUp className="w-8 h-8 mx-auto text-muted-foreground" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Click to select a file
        </p>
        <p className="text-xs text-muted-foreground">
          JSON (.json) or SQLite (.db, .sqlite)
        </p>
      </div>

      {/* Preview Error */}
      {previewError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {previewError}
        </div>
      )}

      {/* Preview Result */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            File read successfully
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 rounded-md bg-muted/50">
            <div>
              <div className="text-2xl font-bold">{preview.total_repos}</div>
              <div className="text-xs text-muted-foreground">Repository</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{preview.total_categories}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-muted-foreground">
                Created: {preview.exported_at ? new Date(preview.exported_at).toLocaleString() : 'Unknown'}
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Restore mode</Label>
            <Select
              value={mode}
              onValueChange={(v: RestoreMode) => setMode(v)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge" textValue="Merge">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Merge</span>
                    <span className="text-xs text-muted-foreground">Keep existing data, add new entries</span>
                  </div>
                </SelectItem>
                <SelectItem value="replace" textValue="Replace">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Replace</span>
                    <span className="text-xs text-muted-foreground">Delete existing data, restore from backup</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {mode === 'merge'
                ? 'Existing data is preserved, only new repos are added. Duplicate repos will be skipped.'
                : 'All existing repos and categories will be deleted, backup data will be loaded.'}
            </p>
          </div>

          {/* Warning for replace mode */}
          {mode === 'replace' && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> This action cannot be undone. All existing repos and categories will be deleted.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={loading}
              variant={mode === 'replace' ? 'destructive' : 'default'}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Restore
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
