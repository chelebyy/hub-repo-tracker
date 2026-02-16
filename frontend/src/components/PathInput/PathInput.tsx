import { useState, useEffect, useRef } from 'react'
import { ClipboardPaste, CheckCircle, XCircle, Circle, Loader2, FolderOpen } from 'lucide-react'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'unknown'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  showFolderPicker?: boolean
}

// OS detection for smart placeholder
function getSmartPlaceholder(): string {
  const platform = navigator.platform.toLowerCase()
  if (platform.includes('win')) {
    return 'C:\\Users\\username\\Projects\\my-repo'
  }
  if (platform.includes('mac')) {
    return '/Users/username/Projects/my-repo'
  }
  return '/home/username/projects/my-repo'
}

export function PathInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  showFolderPicker = true,
}: Props) {
  const [validation, setValidation] = useState<ValidationState>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced path validation
  useEffect(() => {
    if (!value.trim()) {
      setValidation('idle')
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setValidation('validating')

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await api.validatePath(value.trim())

        if (result.valid === true) {
          setValidation('valid')
        } else if (result.valid === false) {
          setValidation('invalid')
        } else {
          setValidation('unknown')
        }
      } catch {
        setValidation('unknown')
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onChange(text)
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  const handleFolderPicker = async () => {
    if (!('showDirectoryPicker' in globalThis)) {
      alert('Your browser does not support folder selection. Please use Chrome, Edge, or Opera.')
      return
    }

    try {
      const handle = await showDirectoryPicker()
      if (value.trim()) {
        onChange(value.trim() + '/' + handle.name)
      } else {
        onChange(handle.name)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Folder selection failed:', err)
      }
    }
  }

  const getValidationIcon = () => {
    switch (validation) {
      case 'validating':
        return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'unknown':
        return <Circle className="w-4 h-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const getBorderColor = () => {
    switch (validation) {
      case 'valid':
        return 'border-green-500 focus-visible:ring-green-500/30'
      case 'invalid':
        return 'border-red-500 focus-visible:ring-red-500/30'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-1">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || getSmartPlaceholder()}
            className={cn('pr-20', getBorderColor())}
            disabled={disabled}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePaste}
              disabled={disabled}
              title="Paste from clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
            </Button>
            {getValidationIcon()}
          </div>
        </div>
        {showFolderPicker && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={disabled}
            onClick={handleFolderPicker}
            title="Select folder (returns folder name only)"
          >
            <FolderOpen className="w-4 h-4" />
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {validation === 'unknown'
          ? 'Path validation unavailable in this environment'
          : 'Paste path from clipboard or use folder picker (returns folder name only due to browser security)'}
      </p>
    </div>
  )
}
