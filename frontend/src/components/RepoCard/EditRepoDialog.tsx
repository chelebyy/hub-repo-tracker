import { useReducer } from 'react'
import { ScanSearch } from 'lucide-react'
import type { Repo, Category } from '@/types'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PathInput } from '@/components/PathInput'

interface EditRepoDialogProps {
  repo: Repo
  categories: Category[]
  onClose: () => void
  onSave: (id: number, data: { notes?: string; category_id?: number | null; installed_version?: string | null; local_path?: string | null }) => Promise<void>
}

interface EditFormState {
  notes: string
  categoryId: number | null
  installedVersion: string
  localPath: string
  saving: boolean
  detectingVersion: boolean
}

type EditFormAction =
  | { type: 'SET_FIELD'; field: 'notes' | 'installedVersion' | 'localPath'; value: string }
  | { type: 'SET_CATEGORY'; value: number | null }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'SET_DETECTING'; value: boolean }

function editFormReducer(state: EditFormState, action: EditFormAction): EditFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_CATEGORY':
      return { ...state, categoryId: action.value }
    case 'SET_SAVING':
      return { ...state, saving: action.value }
    case 'SET_DETECTING':
      return { ...state, detectingVersion: action.value }
  }
}

export default function EditRepoDialog({ repo, categories, onClose, onSave }: Readonly<EditRepoDialogProps>) {
  const initialState: EditFormState = {
    notes: repo.notes || '',
    categoryId: repo.category_id || null,
    installedVersion: repo.installed_version || '',
    localPath: repo.local_path || '',
    saving: false,
    detectingVersion: false,
  }

  const [state, dispatch] = useReducer(editFormReducer, initialState)

  const handleDetectVersion = async () => {
    if (!state.localPath.trim()) return

    dispatch({ type: 'SET_DETECTING', value: true })
    try {
      const response = await api.detectVersion(state.localPath.trim())
      if (response.data.version) {
        dispatch({ type: 'SET_FIELD', field: 'installedVersion', value: response.data.version })
      }
    } catch (err) {
      console.error('Failed to detect version:', err)
    } finally {
      dispatch({ type: 'SET_DETECTING', value: false })
    }
  }

  const handleSave = async () => {
    dispatch({ type: 'SET_SAVING', value: true })
    try {
      await onSave(repo.id, {
        notes: state.notes,
        category_id: state.categoryId,
        installed_version: state.installedVersion || null,
        local_path: state.localPath.trim() || null,
      })
      onClose()
    } finally {
      dispatch({ type: 'SET_SAVING', value: false })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Repository</DialogTitle>
          <DialogDescription className="truncate">
            {repo.full_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={state.categoryId?.toString() || "null"}
              onValueChange={(val) => dispatch({ type: 'SET_CATEGORY', value: val === "null" ? null : Number(val) })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No Category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={state.notes}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'notes', value: e.target.value })}
              placeholder="Add notes about this repository..."
              className="h-32"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installed-version">Installed Version</Label>
            <div className="flex gap-2">
              <Input
                id="installed-version"
                value={state.installedVersion}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'installedVersion', value: e.target.value })}
                placeholder="e.g., 1.2.3"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDetectVersion}
                disabled={state.detectingVersion || !state.localPath.trim()}
                title="Auto-detect from local path"
              >
                <ScanSearch className={cn("w-4 h-4", state.detectingVersion && "animate-pulse")} />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Track which version you have installed locally. Click the scan button to auto-detect from local path.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="local-path">Local Path</Label>
            <PathInput
              value={state.localPath}
              onChange={(value) => dispatch({ type: 'SET_FIELD', field: 'localPath', value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={state.saving}>
            {state.saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
