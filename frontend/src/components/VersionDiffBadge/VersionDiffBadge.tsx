import { ArrowUp, Minus, Check, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  comparison: 'major' | 'minor' | 'patch' | 'none' | 'ahead' | 'unknown'
  installedVersion: string | null
  latestVersion: string | null
  className?: string
}

const config = {
  major: {
    icon: ArrowUp,
    bgClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    label: 'Major',
  },
  minor: {
    icon: ArrowUp,
    bgClass: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    label: 'Minor',
  },
  patch: {
    icon: ArrowUp,
    bgClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    label: 'Patch',
  },
  none: {
    icon: Check,
    bgClass: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
    label: 'Current',
  },
  ahead: {
    icon: Minus,
    bgClass: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
    label: 'Ahead',
  },
  unknown: {
    icon: HelpCircle,
    bgClass: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
    label: 'Unknown',
  },
}

export function VersionDiffBadge({ comparison, installedVersion, latestVersion, className }: Props) {
  const { icon: Icon, bgClass } = config[comparison]

  if (!installedVersion && !latestVersion) {
    return null
  }

  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] font-semibold px-2 py-0.5 gap-1', bgClass, className)}
    >
      <Icon className="w-2.5 h-2.5" />
      {installedVersion || 'none'}
      {comparison !== 'none' && comparison !== 'unknown' && (
        <>
          <span className="text-muted-foreground">→</span>
          {latestVersion}
        </>
      )}
    </Badge>
  )
}
