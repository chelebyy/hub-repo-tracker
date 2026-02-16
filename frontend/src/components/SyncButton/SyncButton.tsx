import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onSync: () => Promise<void>
}

export function SyncButton({ onSync }: Props) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleSync}
      disabled={syncing}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync All'}
    </Button>
  )
}
