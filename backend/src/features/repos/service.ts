import { repoRepository } from './repository.js';
import type { CreateRepoDto, UpdateRepoDto, RepoQuery, RepoWithSync, PreviewRepoResponse, OwnerStats, UpdateInstalledVersionDto, VersionComparison } from './types.js';
import { createError } from '../../shared/middleware/error.js';
import { Octokit } from 'octokit';
import { config } from '../../shared/config/index.js';
import { syncService } from '../sync/service.js';
import { compareVersions, hasUpdateAvailable } from '../../shared/utils/semver.js';

const octokit = new Octokit({ auth: config.github.token });

// Parse GitHub URL to extract owner and name
// Supports: https://github.com/owner/repo, owner/repo, www.github.com/owner/repo
function parseGitHubUrl(url: string): { owner: string; name: string; full_name: string } {
  const match = url.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+)\/([\w.-]+)|^([\w-]+)\/([\w.-]+)$/);
  if (!match) {
    throw createError(400, 'INVALID_URL', 'Invalid GitHub repository URL. Use format: owner/repo or https://github.com/owner/repo');
  }

  // Full URL format (groups 1, 2) or short format (groups 3, 4)
  const owner = match[1] || match[3];
  const name = (match[2] || match[4]).replace(/\.git$/, '');

  return {
    owner,
    name,
    full_name: `${owner}/${name}`,
  };
}

export const repoService = {
  list(query: RepoQuery): { repos: RepoWithSync[]; meta: { total: number; with_updates: number; favorites: number } } {
    const repos = repoRepository.findAll(query);
    const stats = repoRepository.getStats();

    return {
      repos,
      meta: {
        total: stats.total,
        with_updates: stats.withUpdates,
        favorites: stats.favorites,
      },
    };
  },

  getById(id: number): RepoWithSync {
    const repo = repoRepository.findById(id);
    if (!repo) {
      throw createError(404, 'NOT_FOUND', 'Repository not found');
    }
    return repo;
  },

  create(data: CreateRepoDto): RepoWithSync {
    const parsed = parseGitHubUrl(data.url);

    // Check if repo already exists
    const existing = repoRepository.findByFullName(parsed.full_name);
    if (existing) {
      throw createError(409, 'DUPLICATE', 'Repository already exists');
    }

    const repo = repoRepository.create({
      ...data,
      ...parsed,
    });

    // Trigger background sync for the new repo
    void syncService.syncRepo(repo.id).catch(err => {
      console.error(`[RepoService] Failed to sync new repo ${repo.full_name}:`, err);
    });

    return this.getById(repo.id);
  },

  update(id: number, data: UpdateRepoDto): RepoWithSync {
    const existing = repoRepository.findById(id);
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Repository not found');
    }

    repoRepository.update(id, data);
    return this.getById(id);
  },

  toggleFavorite(id: number): RepoWithSync {
    const existing = repoRepository.findById(id);
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Repository not found');
    }

    repoRepository.toggleFavorite(id);
    return this.getById(id);
  },

  delete(id: number): void {
    const existing = repoRepository.findById(id);
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Repository not found');
    }

    repoRepository.delete(id);
  },

  async preview(url: string): Promise<PreviewRepoResponse> {
    const parsed = parseGitHubUrl(url);

    try {
      const response = await octokit.rest.repos.get({
        owner: parsed.owner,
        repo: parsed.name,
      });

      // Fetch latest release or tag for suggested version
      let suggestedVersion: string | null = null;
      let versionSource: 'release' | 'tag' | null = null;

      try {
        const release = await octokit.rest.repos.getLatestRelease({
          owner: parsed.owner,
          repo: parsed.name,
        });
        suggestedVersion = release.data.tag_name;
        versionSource = 'release';
      } catch {
        // No release found, try tags
        try {
          const tags = await octokit.rest.repos.listTags({
            owner: parsed.owner,
            repo: parsed.name,
            per_page: 1,
          });
          if (tags.data.length > 0) {
            suggestedVersion = tags.data[0].name;
            versionSource = 'tag';
          }
        } catch {
          // No tags found either, leave as null
        }
      }

      return {
        owner: parsed.owner,
        name: parsed.name,
        full_name: parsed.full_name,
        description: response.data.description,
        stars: response.data.stargazers_count,
        avatar_url: response.data.owner.avatar_url,
        suggested_version: suggestedVersion,
        version_source: versionSource,
      };
    } catch {
      throw createError(404, 'NOT_FOUND', 'Repository not found on GitHub');
    }
  },

  getOwners(): OwnerStats[] {
    return repoRepository.getOwners();
  },

  acknowledgeRelease(id: number, version: string): RepoWithSync {
    const existing = repoRepository.findById(id);
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Repository not found');
    }

    const success = repoRepository.acknowledgeUpdates(id, version);
    if (!success) {
      throw createError(400, 'ACKNOWLEDGE_FAILED', 'Failed to acknowledge release');
    }

    return this.getById(id);
  },

  updateInstalledVersion(id: number, data: UpdateInstalledVersionDto): RepoWithSync {
    const existing = repoRepository.findById(id);
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Repository not found');
    }

    repoRepository.updateInstalledVersion(id, data.installed_version);
    return this.getById(id);
  },

  getVersionComparison(id: number): VersionComparison {
    const repo = repoRepository.findById(id);
    if (!repo) {
      throw createError(404, 'NOT_FOUND', 'Repository not found');
    }

    // Determine latest version (prefer release tag over regular tag)
    const latestVersion = repo.sync_state?.last_release_tag || repo.sync_state?.last_tag || null;

    const comparison = compareVersions(repo.installed_version, latestVersion);

    return {
      installed_version: repo.installed_version,
      latest_version: latestVersion,
      comparison,
      has_update: hasUpdateAvailable(repo.installed_version, latestVersion),
    };
  },
};
