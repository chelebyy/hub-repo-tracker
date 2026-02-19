import { useState, useEffect } from 'react'
import { FolderSearch, Github, Plus, Loader2, FileCode, Package, FolderOpen, FileJson, Braces, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ScannedProject, ManifestSource } from '@/types'
import { cn } from '@/lib/utils'
import { useDirectoryScanner } from '@/hooks/useDirectoryScanner'
import ServerFileBrowser from './ServerFileBrowser'

interface Props {
  isOpen: boolean
  onClose: () => void
  onImport: (url: string, categoryId?: number, notes?: string, localPath?: string) => Promise<void>
}

const projectTypeIcons: Record<string, string> = {
  node: 'Node',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  unknown: '?',
}

const projectTypeColors: Record<string, string> = {
  node: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  python: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  go: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  rust: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  unknown: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
}

const detectionSourceConfig: Record<ManifestSource, { icon: typeof Github; label: string; color: string }> = {
  git: { icon: Github, label: 'Git', color: 'text-gray-500' },
  'package.json': { icon: FileJson, label: 'package.json', color: 'text-green-500' },
  'go.mod': { icon: FileCode, label: 'go.mod', color: 'text-cyan-500' },
  'Cargo.toml': { icon: Braces, label: 'Cargo.toml', color: 'text-orange-500' },
  'pyproject.toml': { icon: FileCode, label: 'pyproject.toml', color: 'text-blue-500' },
}

export function ImportFromFolderModal({ isOpen, onClose, onImport }: Props) {
  const { scanDirectory, scanServerPath, scanResults, status, isSupported, reset } = useDirectoryScanner()
  const [importing, setImporting] = useState<string | null>(null)
  const [imported, setImported] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<'client' | 'server'>('server')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setImported(new Set())
      setMode('server')
      reset()
    }
  }, [isOpen, reset])

  const handleImport = async (project: ScannedProject) => {
    if (!project.githubRepo) return

    setImporting(project.path)
    try {
      await onImport(project.githubRepo.url, undefined, undefined, project.path)
      setImported(prev => new Set([...prev, project.path]))
    } catch (err) {
      console.error('Failed to import:', err)
    } finally {
      setImporting(null)
    }
  }

  const githubProjects = scanResults.filter(p => p.githubRepo)
  const nonGithubProjects = scanResults.filter(p => !p.githubRepo)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderSearch className="w-5 h-5" />
            Import from Folder
          </DialogTitle>
          <DialogDescription>
            Select a folder on your computer to scan for GitHub repositories.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4 border-b">
          <Button
            variant={mode === 'server' ? 'default' : 'ghost'}
            className="rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => setMode('server')}
          >
            Server Browser
          </Button>
          <Button
            variant={mode === 'client' ? 'default' : 'ghost'}
            className="rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => setMode('client')}
          >
            Local Browser (Restricted)
          </Button>
        </div>

        <div className="py-4">
          {mode === 'server' && scanResults.length === 0 && !status.scanning && !status.error && (
            <ServerFileBrowser
              onSelect={scanServerPath}
              onCancel={onClose}
            />
          )}

          {mode === 'client' && !isSupported && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
              Your browser does not support local folder scanning. Please use Chrome, Edge, or Opera.
            </div>
          )}

          {status.error && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
              {status.error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (mode === 'client') {
                    scanDirectory()
                  } else {
                    reset()
                  }
                }}
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          )}

          {mode === 'client' && scanResults.length === 0 && !status.scanning && !status.error && (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                Select a folder to recursively scan for projects
              </p>
              <Button onClick={scanDirectory} className="gap-2" disabled={!isSupported}>
                <FolderOpen className="w-4 h-4" />
                Select Folder
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Browser will ask for permission to view files.
              </p>
            </div>
          )}

          {status.scanning && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Scanning projects...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Found {status.projectsFound} projects so far...
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[400px] mx-auto opacity-50">
                {status.currentPath}
              </p>
            </div>
          )}

          {scanResults.length > 0 && !status.scanning && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Found {githubProjects.length} GitHub repos in {scanResults.length} projects
                </p>
                <Button variant="outline" size="sm" onClick={reset} className="gap-2">
                  <FolderSearch className="w-4 h-4" />
                  Scan Another Folder
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {githubProjects.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      GitHub Repositories
                    </h4>
                    {githubProjects.map((project) => (
                      <div
                        key={project.path}
                        className={cn(
                          "p-3 rounded-lg border bg-card/50 transition-colors",
                          imported.has(project.path) && "opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {project.name}
                              </span>
                              {project.projectType && project.projectType !== 'unknown' && (
                                <Badge
                                  variant="outline"
                                  className={cn('text-[10px] px-1.5 py-0 h-4', projectTypeColors[project.projectType])}
                                >
                                  {projectTypeIcons[project.projectType]}
                                </Badge>
                              )}
                              {project.version && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                                >
                                  <Tag className="w-2.5 h-2.5 mr-0.5" />
                                  {project.version}
                                </Badge>
                              )}
                              {project.detectionSource && project.detectionSource !== 'git' && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4 cursor-help bg-amber-500/15 border-amber-500/30"
                                      >
                                        {(() => {
                                          const config = detectionSourceConfig[project.detectionSource!]
                                          if (!config) return null
                                          const Icon = config.icon
                                          return <Icon className={cn("w-3 h-3", config.color)} />
                                        })()}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Detected via {detectionSourceConfig[project.detectionSource!]?.label}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {project.githubRepo?.owner}/{project.githubRepo?.repo}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 truncate">
                              {project.path}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={imported.has(project.path) ? "outline" : "default"}
                            className="gap-1 shrink-0 ml-2"
                            onClick={() => handleImport(project)}
                            disabled={importing !== null || imported.has(project.path)}
                          >
                            {importing === project.path ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : imported.has(project.path) ? (
                              <>
                                <Package className="w-3 h-3" />
                                Imported
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                Import
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {nonGithubProjects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileCode className="w-4 h-4" />
                      Other Projects ({nonGithubProjects.length})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      These projects don't have GitHub remotes configured
                    </p>
                    {nonGithubProjects.slice(0, 5).map((project) => (
                      <div
                        key={project.path}
                        className="p-2 rounded-lg border bg-muted/30 opacity-60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate">{project.name}</span>
                          {project.projectType && project.projectType !== 'unknown' && (
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1.5 py-0 h-4', projectTypeColors[project.projectType])}
                            >
                              {projectTypeIcons[project.projectType]}
                            </Badge>
                          )}
                          {project.version && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                            >
                              <Tag className="w-2.5 h-2.5 mr-0.5" />
                              {project.version}
                            </Badge>
                          )}
                          {project.detectionSource && project.detectionSource !== 'git' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 cursor-help bg-amber-500/15 border-amber-500/30"
                                  >
                                    {(() => {
                                      const config = detectionSourceConfig[project.detectionSource!]
                                      if (!config) return null
                                      const Icon = config.icon
                                      return <Icon className={cn("w-3 h-3", config.color)} />
                                    })()}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Detected via {detectionSourceConfig[project.detectionSource!]?.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    ))}
                    {nonGithubProjects.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{nonGithubProjects.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

