import { useState } from 'react'
import { Folder, Menu, Settings, PanelLeftClose } from 'lucide-react'
import { CategoryItem } from './CategoryItem'

import type { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onToggle: () => void
  categories: Category[]

  selectedCategoryId: number | null

  onSelectCategory: (id: number | null) => void

  repoCounts: Map<string | number, number>
  totalRepos: number
  onOpenCategoryManager: () => void
  stats?: { total: number; with_updates: number; favorites: number } | null
}

export function Sidebar({
  isOpen,
  onToggle,
  categories,

  selectedCategoryId,

  onSelectCategory,

  repoCounts,
  totalRepos,
  onOpenCategoryManager,
  stats,
}: Props) {

  const [mobileOpen, setMobileOpen] = useState(false)

  const customCategories = categories.filter(c => c.type === 'custom')

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      {stats && (
        <div className="px-4 py-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Repos</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">With Updates</span>
            <span className="font-semibold text-primary">{stats.with_updates}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Favorites</span>
            <span className="font-semibold text-yellow-500">{stats.favorites}</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold tracking-tight">Categories</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onOpenCategoryManager}
          title="Manage Categories"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => {
              onSelectCategory(null)
              setMobileOpen(false)
            }}
            className={cn(
              "w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium transition-all duration-200",
              !selectedCategoryId
                ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Folder className="w-4 h-4" />
            <span className="flex-1 text-left">All Repositories</span>
            <span className="text-xs text-muted-foreground">
              {totalRepos}
            </span>
          </Button>

          {customCategories.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Categories
              </div>
              <div className="space-y-1 mt-1">
                {customCategories.map(category => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    count={repoCounts.get(category.id) || 0}
                    isSelected={selectedCategoryId === category.id}
                    onClick={() => {
                      onSelectCategory(category.id)
                      setMobileOpen(false)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="lg:hidden fixed bottom-4 right-4 z-40 rounded-full h-12 w-12 shadow-lg"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="px-4 py-3 border-b border-border text-left">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-53px)]">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar Toggle removed, moved to App header */}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-[65px] h-[calc(100vh-65px)] bg-card border-r border-border transition-all duration-300 z-10",
          isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden"
        )}
      >
        <div className="h-full relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="absolute right-2 top-2 z-10 h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
          <div className="pt-8 h-full">
            <SidebarContent />
          </div>
        </div>
      </aside>
    </>
  )
}
