import { Octokit } from 'octokit';
import { config } from '../../shared/config/index.js';
import { logger } from '../../shared/logger.js';

export interface CommitInfo {
  sha: string;
  date: string;
  message: string;
  author: string;
}

export interface ReleaseInfo {
  tag: string;
  date: string;
  notes: string | null;
}

export interface TagInfo {
  tag: string;
  date: string;
}

export interface RepoGitHubData {
  commits: CommitInfo | null;
  releases: ReleaseInfo | null;
  tags: TagInfo | null;
}

// Create Octokit instance with auth
const octokit = new Octokit({
  auth: config.github.token,
});

// Rate limit tracking
let rateLimitRemaining = 5000;
let rateLimitReset = 0;

// Exponential backoff with jitter
async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const err = error as { status?: number; message?: string };

      // Don't retry on 4xx errors (except 429)
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
        logger.error({ status: err.status, message: err.message }, 'GitHub API error');
        throw error;
      }

      // Log retry attempt
      if (attempt < maxRetries - 1) {
        logger.warn({ attempt: attempt + 1, status: err.status }, 'GitHub API request failed, retrying');
      }

      // Calculate delay with exponential backoff + jitter
      const delay = baseDelay * Math.pow(2, attempt) + (attempt * 137 + 37);

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error({ error: lastError?.message }, 'GitHub API request failed after retries');
  throw lastError;
}

export const githubClient = {
  async getLatestCommit(owner: string, repo: string, etag?: string): Promise<{ data: CommitInfo | null; etag?: string }> {
    return withBackoff(async () => {
      const headers: Record<string, string> = {};
      if (etag) {
        headers['If-None-Match'] = etag;
      }

      const response = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 1,
        headers,
      });

      // Update rate limit tracking
      if (response.headers) {
        rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'] || '5000', 10);
        rateLimitReset = parseInt(response.headers['x-ratelimit-reset'] || '0', 10);

        // Warn if rate limit is low (< 100)
        if (rateLimitRemaining < 100) {
          logger.warn({ remaining: rateLimitRemaining, resetAt: new Date(rateLimitReset * 1000) }, 'GitHub API rate limit low');
        }
      }

      if (!response.data || response.data.length === 0) {
        return { data: null };
      }

      const commit = response.data[0];
      return {
        data: {
          sha: commit.sha,
          date: commit.commit.author?.date || '',
          message: commit.commit.message?.split('\n')[0] || '',
          author: commit.commit.author?.name || commit.author?.login || '',
        },
        etag: response.headers.etag,
      };
    });
  },

  async getLatestRelease(owner: string, repo: string, etag?: string): Promise<{ data: ReleaseInfo | null; etag?: string }> {
    return withBackoff(async () => {
      const headers: Record<string, string> = {};
      if (etag) {
        headers['If-None-Match'] = etag;
      }

      try {
        const response = await octokit.rest.repos.getLatestRelease({
          owner,
          repo,
          headers,
        });

        // Update rate limit tracking
        if (response.headers) {
          rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'] || '5000', 10);
          rateLimitReset = parseInt(response.headers['x-ratelimit-reset'] || '0', 10);

          if (rateLimitRemaining < 100) {
            logger.warn({ remaining: rateLimitRemaining, resetAt: new Date(rateLimitReset * 1000) }, 'GitHub API rate limit low');
          }
        }

        return {
          data: {
            tag: response.data.tag_name,
            date: response.data.published_at || response.data.created_at,
            notes: response.data.body ?? null,
          },
          etag: response.headers.etag,
        };
      } catch (error: unknown) {
        const err = error as { status?: number };
        // 404 means no releases
        if (err.status === 404) {
          return { data: null };
        }
        throw error;
      }
    });
  },

  async getLatestTag(owner: string, repo: string): Promise<{ data: TagInfo | null; etag?: string }> {
    return withBackoff(async () => {
      try {
        const response = await octokit.rest.repos.listTags({
          owner,
          repo,
          per_page: 1,
        });

        if (!response.data || response.data.length === 0) {
          return { data: null };
        }

        const tag = response.data[0];
        return {
          data: {
            tag: tag.name,
            date: new Date().toISOString(),
          },
          etag: response.headers.etag,
        };
      } catch (error: unknown) {
        const err = error as { status?: number };
        if (err.status === 404) {
          return { data: null };
        }
        throw error;
      }
    });
  },

  async fetchRepoData(owner: string, repo: string): Promise<RepoGitHubData> {
    const [commits, releases, tags] = await Promise.all([
      this.getLatestCommit(owner, repo),
      this.getLatestRelease(owner, repo),
      this.getLatestTag(owner, repo),
    ]);

    return {
      commits: commits.data,
      releases: releases.data,
      tags: tags.data,
    };
  },

  getRateLimitStatus(): { remaining: number; resetAt: Date } {
    return {
      remaining: rateLimitRemaining,
      resetAt: new Date(rateLimitReset * 1000),
    };
  },
};
