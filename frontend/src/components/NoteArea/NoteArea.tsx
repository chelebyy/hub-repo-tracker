import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Save, X } from 'lucide-react'

interface Props {
  notes: string | null
  onSave: (notes: string) => void
}

export function NoteArea({ notes: initialNotes, onSave }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    setNotes(initialNotes || '')
  }, [initialNotes])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  const handleSave = async () => {
    if (notes === initialNotes) {
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      await onSave(notes)
      setEditing(false)
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setNotes(initialNotes || '')
    setEditing(false)
  }

  // Auto-save on blur with debounce
  const handleBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      if (notes !== initialNotes && notes.trim()) {
        handleSave()
      }
    }, 500)
  }

  const hasNotes = initialNotes && initialNotes.trim().length > 0

  return (
    <div className="mt-3">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${hasNotes
              ? 'text-accent hover:text-accent-hover'
              : 'text-text-secondary hover:text-text-primary'
            }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{hasNotes ? 'View notes' : 'Add notes'}</span>
        </button>
      ) : (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">Notes</span>
            <div className="flex items-center gap-1">
              {editing && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-1 text-success hover:bg-success/10 rounded"
                    title="Save"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-1 text-text-secondary hover:text-text-primary rounded"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setExpanded(false)
                  setEditing(false)
                }}
                className="p-1 text-text-secondary hover:text-text-primary rounded"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {editing ? (
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleBlur}
              placeholder="Add your notes here..."
              className="w-full min-h-[60px] px-2 py-1.5 text-sm bg-bg-primary border border-bg-hover rounded resize-none focus:outline-none focus:border-accent"
              disabled={saving}
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setEditing(true)
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={hasNotes ? 'Edit notes' : 'Add notes'}
              className={`px-2 py-1.5 text-sm rounded border cursor-pointer transition-colors ${hasNotes
                  ? 'bg-bg-primary border-bg-hover hover:border-accent'
                  : 'bg-bg-primary/50 border-dashed border-bg-hover hover:border-accent text-text-secondary italic'
                }`}
            >
              {hasNotes ? (
                <p className="whitespace-pre-wrap">{initialNotes}</p>
              ) : (
                'Click to add notes...'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
