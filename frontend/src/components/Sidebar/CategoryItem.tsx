import type { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  category: Category
  count: number
  isSelected: boolean
  onClick: () => void
}

export function CategoryItem({ category, count, isSelected, onClick }: Props) {
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
      <span
        className="w-3 h-3 rounded-full shrink-0 border border-border"
        style={{ backgroundColor: category.color }}
      />
      <span className="truncate flex-1 text-left">{category.name}</span>
      {count > 0 && (
        <span className={cn(
          "ml-auto text-xs",
          isSelected ? "text-primary/80" : "text-muted-foreground"
        )}>{count}</span>
      )}
    </Button>
  )
}
