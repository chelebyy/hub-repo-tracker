import type { Repo, Category } from '@/types'
import { RepoCard } from '@/components/RepoCard'

interface Props {
  readonly repos: Repo[]
  readonly categories: Category[]
  readonly onDelete: (id: number) => Promise<void>
  readonly onToggleFavorite: (id: number) => Promise<void>
  readonly onUpdateRepo: (id: number, data: { notes?: string; category_id?: number | null; installed_version?: string | null; local_path?: string | null }) => Promise<void>
  readonly onAcknowledge: (id: number, version: string) => Promise<void>
}

export function RepoList({ repos, categories, onDelete, onToggleFavorite, onUpdateRepo, onAcknowledge }: Props) {
  if (repos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No repositories tracked yet.</p>
        <p className="text-text-secondary text-sm mt-1">
          Click "Add Repo" to start tracking a GitHub repository.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-w-0 overflow-hidden">
      {repos.map((repo) => (
        <RepoCard
          key={repo.id}
          repo={repo}
          categories={categories}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onUpdateRepo={onUpdateRepo}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  )
}
