import { useState } from 'react'
import { Loader2, FileJson, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'

interface Props {
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function BackupSection({ onSuccess, onError }: Props) {
  const [exportingJson, setExportingJson] = useState(false)
  const [exportingSqlite, setExportingSqlite] = useState(false)

  const handleExportJson = async () => {
    setExportingJson(true)
    try {
      await api.exportJson()
      onSuccess('JSON backup file downloaded successfully')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'JSON export failed')
    } finally {
      setExportingJson(false)
    }
  }

  const handleExportSqlite = async () => {
    setExportingSqlite(true)
    try {
      await api.exportSqlite()
      onSuccess('SQLite backup file downloaded successfully')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'SQLite export failed')
    } finally {
      setExportingSqlite(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Back up your repository and category data. Backup files can be used to restore later.
      </div>

      <div className="grid gap-3">
        <Button
          variant="outline"
          className="justify-start h-auto py-3"
          onClick={handleExportJson}
          disabled={exportingJson || exportingSqlite}
        >
          {exportingJson ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <FileJson className="w-5 h-5 mr-3 text-blue-500" />
          )}
          <div className="text-left">
            <div className="font-medium">Download as JSON</div>
            <div className="text-xs text-muted-foreground">Human-readable format</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="justify-start h-auto py-3"
          onClick={handleExportSqlite}
          disabled={exportingJson || exportingSqlite}
        >
          {exportingSqlite ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <Database className="w-5 h-5 mr-3 text-green-500" />
          )}
          <div className="text-left">
            <div className="font-medium">Download as SQLite</div>
            <div className="text-xs text-muted-foreground">Full database backup</div>
          </div>
        </Button>
      </div>
    </div>
  )
}
