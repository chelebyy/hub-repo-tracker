/**
 * Manifest Parser Utility
 * Parses package manifests (package.json, go.mod, Cargo.toml, pyproject.toml)
 * to extract GitHub repository information.
 */

export interface ParsedManifest {
  owner: string;
  repo: string;
  url: string;
  source: 'package.json' | 'go.mod' | 'Cargo.toml' | 'pyproject.toml';
}

// Regex for GitHub URLs - handles both https and git@ formats
const GITHUB_URL_REGEX = /github\.com[:/]([^/]+)\/([^/.]+)/;

/**
 * Normalizes a repository URL to a standard format
 * - Removes git+ prefix
 * - Removes .git suffix
 * - Handles github:owner/repo shorthand
 * - Converts git@github.com:owner/repo to https URL
 */
function normalizeGitHubUrl(input: string): string | null {
  if (!input) return null;

  let url = input.trim();

  // Handle "github:owner/repo" shorthand
  if (url.startsWith('github:')) {
    const parts = url.slice(7).split('/');
    if (parts.length >= 2) {
      return `https://github.com/${parts[0]}/${parts[1]}`;
    }
    return null;
  }

  // Handle "owner/repo" shorthand (without protocol)
  if (!url.includes('://') && !url.includes('@') && url.split('/').length === 2) {
    return `https://github.com/${url}`;
  }

  // Remove git+ prefix
  url = url.replace(/^git\+/, '');

  // Convert git@github.com:owner/repo to https URL
  if (url.startsWith('git@github.com:')) {
    const path = url.slice(15); // Remove 'git@github.com:'
    const cleanPath = path.replace(/\.git$/, '');
    return `https://github.com/${cleanPath}`;
  }

  // Remove .git suffix
  url = url.replace(/\.git$/, '');

  return url;
}

/**
 * Extracts owner/repo from a repository string or object
 */
function parseRepositoryField(
  repo: string | { url?: string; type?: string } | undefined
): { owner: string; repo: string; url: string } | null {
  if (!repo) return null;

  let rawUrl = '';

  if (typeof repo === 'string') {
    rawUrl = repo;
  } else if (typeof repo === 'object' && repo.url) {
    rawUrl = repo.url;
  }

  if (!rawUrl) return null;

  const normalizedUrl = normalizeGitHubUrl(rawUrl);
  if (!normalizedUrl) return null;

  const match = GITHUB_URL_REGEX.exec(normalizedUrl);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
    url: `https://github.com/${match[1]}/${match[2]}`,
  };
}

/**
 * Parses package.json content to extract repository information
 * @param content - Raw package.json file content
 * @returns ParsedManifest or null if no valid GitHub URL found
 */
export function parsePackageJson(content: string): ParsedManifest | null {
  try {
    const json = JSON.parse(content);
    const result = parseRepositoryField(json.repository);
    if (!result) return null;

    return {
      ...result,
      source: 'package.json',
    };
  } catch {
    return null;
  }
}

/**
 * Parses go.mod content to extract repository information
 * Looks for: module github.com/owner/repo
 * @param content - Raw go.mod file content
 * @returns ParsedManifest or null if no valid GitHub URL found
 */
export function parseGoMod(content: string): ParsedManifest | null {
  // Look for: module github.com/owner/repo
  const match = /^\s*module\s+(github\.com\/[^/\s]+\/[^/\s]+)/m.exec(content);
  if (!match) return null;

  const fullPath = match[1]; // github.com/owner/repo
  const parts = fullPath.split('/');

  if (parts.length < 3) return null;

  const owner = parts[1];
  const repoName = parts[2];

  // Remove version suffix like /v2 from URL
  const cleanPath = fullPath.replace(/\/v\d+$/, '');

  return {
    owner,
    repo: repoName,
    url: `https://${cleanPath}`,
    source: 'go.mod',
  };
}

/**
 * Parses Cargo.toml (Rust) content to extract repository information
 * Looks for: [package] repository = "..."
 * @param content - Raw Cargo.toml file content
 * @returns ParsedManifest or null if no valid GitHub URL found
 */
export function parseCargoToml(content: string): ParsedManifest | null {
  // Look for: repository = "..." (typically in [package] section)
  const match = /repository\s*=\s*"([^"]+)"/.exec(content);
  if (!match) return null;

  const result = parseRepositoryField(match[1]);
  if (!result) return null;

  return {
    ...result,
    source: 'Cargo.toml',
  };
}

/**
 * Parses pyproject.toml (Python) content to extract repository information
 * Tries [tool.poetry] repository first, then [project.urls] Repository
 * @param content - Raw pyproject.toml file content
 * @returns ParsedManifest or null if no valid GitHub URL found
 */
export function parsePyprojectToml(content: string): ParsedManifest | null {
  // Try [tool.poetry] repository = "..." first
  // eslint-disable-next-line no-useless-escape
  let match = /\[tool\.poetry\][^\[]*repository\s*=\s*"([^"]+)"/s.exec(content);
  if (match) {
    const result = parseRepositoryField(match[1]);
    if (result) {
      return {
        ...result,
        source: 'pyproject.toml',
      };
    }
  }

  // Try [project.urls] Repository = "..."
  // eslint-disable-next-line no-useless-escape
  match = /\[project\.urls\][^\[]*Repository\s*=\s*"([^"]+)"/is.exec(content);
  if (match) {
    const result = parseRepositoryField(match[1]);
    if (result) {
      return {
        ...result,
        source: 'pyproject.toml',
      };
    }
  }

  // Fallback: simple repository = "..." anywhere in file
  match = /repository\s*=\s*"([^"]+)"/i.exec(content);
  if (match) {
    const result = parseRepositoryField(match[1]);
    if (result) {
      return {
        ...result,
        source: 'pyproject.toml',
      };
    }
  }

  return null;
}

/**
 * Generic manifest file parser - determines parser based on filename
 * @param filename - Name of the manifest file (e.g., "package.json", "go.mod")
 * @param content - Raw file content
 * @returns ParsedManifest or null if file type not supported or no valid GitHub URL found
 */
export function parseManifestFile(
  filename: string,
  content: string
): ParsedManifest | null {
  const lowerFilename = filename.toLowerCase();

  switch (lowerFilename) {
    case 'package.json':
      return parsePackageJson(content);
    case 'go.mod':
      return parseGoMod(content);
    case 'cargo.toml':
      return parseCargoToml(content);
    case 'pyproject.toml':
      return parsePyprojectToml(content);
    default:
      return null;
  }
}
