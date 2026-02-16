import { useState } from 'react'
import { Settings, Download, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BackupSection } from './BackupSection'
import { RestoreSection } from './RestoreSection'
import { useToast } from '@/hooks/use-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  onRestoreComplete: () => void
}

type Tab = 'backup' | 'restore'

export function BackupRestoreModal({ isOpen, onClose, onRestoreComplete }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('backup')
  const { toast } = useToast()

  const handleSuccess = (message: string) => {
    toast({
      title: 'Success',
      description: message,
    })
  }

  const handleError = (message: string) => {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
    })
  }

  const handleRestoreComplete = () => {
    onRestoreComplete()
    onClose()
  }

  const handleClose = () => {
    setActiveTab('backup') // Reset to backup tab on close
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Backup & Restore
          </DialogTitle>
          <DialogDescription>
            Back up your data or restore from a previous backup.
          </DialogDescription>
        </DialogHeader>

        {/* Custom Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('backup')}
          >
            <Download className="w-4 h-4" />
            Backup
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'restore'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('restore')}
          >
            <Upload className="w-4 h-4" />
            Restore
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === 'backup' ? (
            <BackupSection onSuccess={handleSuccess} onError={handleError} />
          ) : (
            <RestoreSection
              onSuccess={handleSuccess}
              onError={handleError}
              onRestoreComplete={handleRestoreComplete}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
