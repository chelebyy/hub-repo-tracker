import * as fs from 'node:fs';
import * as path from 'node:path';
import { config } from '../../shared/config/index.js';
import type { ScannedProject, FolderScanResult, VersionDetectResult } from './types.js';

const GITHUB_URL_REGEX = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i;

const PROJECT_TYPE_INDICATORS: Record<string, string> = {
  'package.json': 'node',
  'pnpm-lock.yaml': 'node',
  'yarn.lock': 'node',
  'package-lock.json': 'node',
  'pyproject.toml': 'python',
  'setup.py': 'python',
  'requirements.txt': 'python',
  'Pipfile': 'python',
  'go.mod': 'go',
  'Cargo.toml': 'rust',
};

function detectProjectType(projectPath: string): 'node' | 'python' | 'go' | 'rust' | 'unknown' | null {
  try {
    const files = fs.readdirSync(projectPath);

    for (const file of files) {
      const detectedType = PROJECT_TYPE_INDICATORS[file];
      if (detectedType) {
        return detectedType as 'node' | 'python' | 'go' | 'rust';
      }
    }

    return 'unknown';
  } catch {
    return null;
  }
}

// Version extraction functions
function extractNodeVersion(projectPath: string): string | null {
  const pkgPath = path.join(projectPath, 'package.json');
  try {
    const content = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version || null;
  } catch {
    return null;
  }
}

function extractPythonVersion(projectPath: string): string | null {
  const pyprojectPath = path.join(projectPath, 'pyproject.toml');
  try {
    const content = fs.readFileSync(pyprojectPath, 'utf-8');

    // Try to find version in [project] section
    const projectMatch = content.match(/^\[project\][\s\S]*?^version\s*=\s*["']([^"']+)["']/m);
    if (projectMatch) return projectMatch[1];

    // Try to find version in [tool.poetry] section
    const poetryMatch = content.match(/^\[tool\.poetry\][\s\S]*?^version\s*=\s*["']([^"']+)["']/m);
    if (poetryMatch) return poetryMatch[1];

    return null;
  } catch {
    return null;
  }
}

function extractRustVersion(projectPath: string): string | null {
  const cargoPath = path.join(projectPath, 'Cargo.toml');
  try {
    const content = fs.readFileSync(cargoPath, 'utf-8');

    // Find version in [package] section
    const match = content.match(/^\[package\][\s\S]*?^version\s*=\s*["']([^"']+)["']/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function extractGoVersion(projectPath: string): string | null {
  const goModPath = path.join(projectPath, 'go.mod');
  try {
    const content = fs.readFileSync(goModPath, 'utf-8');

    // Go modules don't have a version field, but we can try to find a version tag
    // in git tags or use the go version requirement
    const goVersionMatch = content.match(/^go\s+(\d+(?:\.\d+)?)/m);
    return goVersionMatch ? `go${goVersionMatch[1]}` : null;
  } catch {
    return null;
  }
}

function extractVersion(projectPath: string, projectType: string | null): string | null {
  switch (projectType) {
    case 'node':
      return extractNodeVersion(projectPath);
    case 'python':
      return extractPythonVersion(projectPath);
    case 'rust':
      return extractRustVersion(projectPath);
    case 'go':
      return extractGoVersion(projectPath);
    default:
      return null;
  }
}

function parseGitConfig(gitConfigPath: string): { owner: string; repo: string; url: string } | null {
  try {
    const content = fs.readFileSync(gitConfigPath, 'utf-8');

    const remoteOriginMatch = content.match(/\[remote\s+"origin"\]([\s\S]*?)(?=\[|$)/);
    if (!remoteOriginMatch) {
      return null;
    }

    const remoteSection = remoteOriginMatch[1];
    const urlMatch = remoteSection.match(/^\s*url\s*=\s*(.+)$/m);
    if (!urlMatch) {
      return null;
    }

    const gitUrl = urlMatch[1].trim();
    const githubMatch = gitUrl.match(GITHUB_URL_REGEX);

    if (!githubMatch) {
      return null;
    }

    const owner = githubMatch[1];
    const repo = githubMatch[2].replace(/\.git$/, '');

    return {
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}`,
    };
  } catch {
    return null;
  }
}

// Ignore patterns for performance
const IGNORED_FOLDERS = new Set([
  'node_modules',
  '.git',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'out',
  'coverage',
  '__pycache__',
]);

function scanDirectory(basePath: string, depth = 0, maxDepth = 3): ScannedProject[] {
  if (depth > maxDepth) {
    return [];
  }

  const projects: ScannedProject[] = [];

  try {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORED_FOLDERS.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(basePath, entry.name);

      // Check if this directory ITSELF is a project
      const gitConfigPath = path.join(fullPath, '.git', 'config');
      let githubRepo: ScannedProject['githubRepo'] = null;
      let hasGitConfig = false;

      if (fs.existsSync(gitConfigPath)) {
        hasGitConfig = true;
        githubRepo = parseGitConfig(gitConfigPath);
      }

      const projectType = detectProjectType(fullPath);

      // If it's a known project type OR has git config, add it
      if (projectType !== 'unknown' || hasGitConfig) {
        const version = extractVersion(fullPath, projectType);
        projects.push({
          path: fullPath,
          name: entry.name,
          gitConfigPath: hasGitConfig ? gitConfigPath : null,
          githubRepo,
          projectType,
          version,
        });

        // Optimization: If we found a project, we typically don't search INSIDE it 
        // for other projects (unless it's a monorepo root, but for now let's stop here to be safe/fast)
        // If user needs monorepo support, we can adjust this policy later.
        continue;
      }

      // If not a project, recurse deeper
      const subProjects = scanDirectory(fullPath, depth + 1, maxDepth);
      projects.push(...subProjects);
    }
  } catch (error) {
    console.error(`Error scanning directory ${basePath}:`, error);
  }

  return projects;
}

export function scanProjectsFolder(manualPath?: string): FolderScanResult {
  const projectsPath = manualPath || config.projects.path;

  // Resolve to absolute path
  const absolutePath = path.resolve(projectsPath);

  // Check if directory exists
  if (!fs.existsSync(absolutePath)) {
    console.log(`[ImportService] Projects path does not exist: ${absolutePath}`);
    return {
      projects: [],
      scannedAt: new Date().toISOString(),
      totalFound: 0,
    };
  }

  console.log(`[ImportService] Scanning projects folder: ${absolutePath}`);
  const projects = scanDirectory(absolutePath);
  console.log(`[ImportService] Found ${projects.length} projects`);

  return {
    projects,
    scannedAt: new Date().toISOString(),
    totalFound: projects.length,
  };
}

export function detectVersionFromPath(projectPath: string): VersionDetectResult {
  const absolutePath = path.resolve(projectPath);

  if (!fs.existsSync(absolutePath)) {
    return { version: null, projectType: 'unknown' };
  }

  const projectType = detectProjectType(absolutePath) || 'unknown';
  const version = extractVersion(absolutePath, projectType);

  return { version, projectType };
}

export const importService = {
  scanProjectsFolder,
  detectVersionFromPath,
};
