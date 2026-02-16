import { Search, Filter, ArrowUpDown } from 'lucide-react'
import type { FilterState, SortField } from '@/types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Props {
  filters: FilterState
  onSearchChange: (value: string) => void
  onSortChange: (value: SortField) => void
  onToggleUpdates: () => void
  onToggleFavorites: () => void
}

export function FilterBar({
  filters,
  onSearchChange,
  onSortChange,
  onToggleUpdates,
  onToggleFavorites,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
      <div className="relative flex-1 w-full min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search repositories..."
          className="pl-9 bg-card"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <Select
          value={filters.sort}
          onValueChange={(val) => onSortChange(val as SortField)}
        >
          <SelectTrigger className="w-[140px] bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="last_sync">Last Sync</SelectItem>
            <SelectItem value="has_updates">Has Updates</SelectItem>
            <SelectItem value="favorite">Favorites</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Button
          variant={filters.showUpdatesOnly ? "default" : "outline"}
          size="sm"
          onClick={onToggleUpdates}
          className="whitespace-nowrap"
        >
          Updates Only
        </Button>
        <Button
          variant={filters.showFavoritesOnly ? "default" : "outline"}
          size="sm"
          onClick={onToggleFavorites}
          className="whitespace-nowrap"
        >
          Favorites
        </Button>
      </div>
    </div>
  )
}
