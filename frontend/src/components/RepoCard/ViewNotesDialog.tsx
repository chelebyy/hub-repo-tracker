import { StickyNote, Pencil } from 'lucide-react'
import type { Repo } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ViewNotesDialogProps {
  repo: Repo
  onClose: () => void
  onEditNotes: () => void
}

export default function ViewNotesDialog({ repo, onClose, onEditNotes }: ViewNotesDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="w-5 h-5 text-primary" />
            Notes for {repo.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 mt-2">
          <div className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border/50">
            {repo.notes}
          </div>
        </div>

        <DialogFooter className="mt-4 sm:justify-between">
          <div className="text-xs text-muted-foreground self-center">
            {repo.notes?.length || 0} characters
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              onClose()
              onEditNotes()
            }}>
              <Pencil className="w-3 h-3 mr-2" />
              Edit Notes
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
