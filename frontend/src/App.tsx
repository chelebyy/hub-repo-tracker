import { useState, useMemo } from 'react'
import { RepoList } from '@/components/RepoList'
import { AddRepoModal } from '@/components/AddRepoModal'
import { FilterBar } from '@/components/FilterBar'
import { SyncButton } from '@/components/SyncButton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { Sidebar } from '@/components/Sidebar'
import { useRepos, useFilter } from '@/hooks/useRepos'
import { useCategories } from '@/hooks/useCategories'
import { CategoryManagerModal } from '@/components/CategoryManager/CategoryManagerModal'
import { ImportFromFolderModal } from '@/components/ImportFromFolderModal/ImportFromFolderModal'
import { BackupRestoreModal } from '@/components/BackupRestoreModal'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon, Plus, PanelLeftOpen, FolderOpen, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

function AppContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [backupModalOpen, setBackupModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  const { toast } = useToast()

  const { repos, meta, loading, error, addRepo, updateRepo, deleteRepo, toggleFavorite, syncAll, acknowledgeRepo, refetch: refreshRepos } = useRepos(selectedCategoryId || undefined)
  const { categories, refresh: refreshCategories } = useCategories()
  const { filtered, filters, setSearch, setSort, toggleUpdatesOnly, toggleFavoritesOnly } =
    useFilter(repos)

  const handleUpdateRepo = async (id: number, data: { notes?: string; category_id?: number | null; installed_version?: string | null; local_path?: string | null }) => {
    try {
      await updateRepo(id, data)
      if (data.category_id !== undefined) {
        refreshCategories()
      }
      toast({
        title: "Repository updated",
        description: "Your changes have been saved successfully.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update repository details.",
      })
    }
  }

  const handleDeleteRepo = async (id: number) => {
    try {
      await deleteRepo(id)
      toast({
        title: "Repository deleted",
        description: "Repository has been removed from your list.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete repository.",
      })
    }
  }

  const handleAddRepo = async (url: string, categoryId?: number, notes?: string, localPath?: string, installedVersion?: string) => {
    try {
      await addRepo(url, categoryId, notes, localPath, installedVersion)
      setModalOpen(false)
      toast({
        title: "Repository added",
        description: "Successfully added new repository to track.",
      })
    } catch (err) {
      // Error handled in modal usually, but if it bubbles up
      toast({
        variant: "destructive",
        title: "Failed to add",
        description: err instanceof Error ? err.message : "Unkown error",
      })
      throw err // Re-throw to let modal handle it if needed
    }
  }

  const handleSyncAll = async () => {
    try {
      await syncAll()
      toast({
        title: "Sync completed",
        description: "All repositories have been synced with GitHub.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not sync repositories.",
      })
    }
  }

  const handleAcknowledge = async (id: number, version: string) => {
    try {
      await acknowledgeRepo(id, version)
      toast({
        title: "Version acknowledged",
        description: "Notification dismissed. You won't be reminded about this version again.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to acknowledge",
        description: "Could not dismiss the notification.",
      })
    }
  }

  // Calculate repo counts per category
  const repoCounts = useMemo(() => {
    const counts = new Map<string | number, number>()
    repos.forEach(repo => {
      if (repo.category_id) {
        counts.set(repo.category_id, (counts.get(repo.category_id) || 0) + 1)
      }
    })
    return counts
  }, [repos])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background font-sans antialiased text-foreground overflow-x-hidden">
        <header className={cn(
          "sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
          sidebarOpen ? "lg:pl-72" : "lg:pl-0"
        )}>
          <div className="container flex h-14 items-center justify-between px-4 sm:px-8 max-w-full">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="hidden lg:flex text-muted-foreground hover:text-foreground"
                  title="Open Sidebar"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-xl font-bold tracking-tight">Hub Repo Tracker</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBackupModalOpen(true)}
                title="Backup & Settings"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Backup & Settings</span>
              </Button>
              <SyncButton onSync={handleSyncAll} />
              <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Repo</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </header>

        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          repoCounts={repoCounts}
          totalRepos={repos.length}
          onOpenCategoryManager={() => setCategoryModalOpen(true)}
          stats={meta}
        />

        <main className={cn(
          "flex-1 p-4 sm:p-8 pt-6 transition-all duration-300",
          sidebarOpen ? "lg:pl-72" : "lg:pl-0"
        )}>
          <FilterBar
            filters={filters}
            onSearchChange={setSearch}
            onSortChange={setSort}
            onToggleUpdates={toggleUpdatesOnly}
            onToggleFavorites={toggleFavoritesOnly}
          />

          {error && (
            <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSkeleton count={8} />
          ) : (
            <RepoList
              repos={filtered}
              categories={categories}
              onDelete={handleDeleteRepo}
              onToggleFavorite={toggleFavorite}
              onUpdateRepo={handleUpdateRepo}
              onAcknowledge={handleAcknowledge}
            />
          )}
        </main>

        <AddRepoModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddRepo}
          categories={categories}
        />

        <CategoryManagerModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          categories={categories}
          onUpdate={refreshCategories}
        />

        <ImportFromFolderModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleAddRepo}
        />

        <BackupRestoreModal
          isOpen={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
          onRestoreComplete={() => {
            refreshRepos()
            refreshCategories()
          }}
        />
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
