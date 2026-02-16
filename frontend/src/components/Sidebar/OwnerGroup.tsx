import type { Owner } from '@/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Props {
  owner: Owner
  isSelected: boolean
  onClick: () => void
}

export function OwnerGroup({ owner, isSelected, onClick }: Props) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-start gap-2 px-3 py-2 h-auto font-normal",
        isSelected
          ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Avatar className="h-5 w-5">
        <AvatarImage
          src={owner.avatar_url || `https://github.com/${owner.name}.png?size=24`}
          alt={owner.name}
        />
        <AvatarFallback className="text-[9px]">
          {(owner.name || 'U').substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="truncate flex-1 text-left">{owner.name || 'Unknown User'}</span>
      <span className={cn(
        "ml-auto text-xs",
        isSelected ? "text-primary/80" : "text-muted-foreground"
      )}>{owner.repo_count}</span>
    </Button>
  )
}
