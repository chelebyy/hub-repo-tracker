import { useState, useCallback } from 'react';
import type { ScannedProject, ManifestSource } from '@/types';
import { parseGitConfig } from '@/utils/git-config-parser';
import { parseManifestFile, type ParsedManifest } from '@/utils/manifest-parser';

interface ScanStatus {
    scanning: boolean;
    totalScanned: number;
    projectsFound: number;
    currentPath: string;
    error: string | null;
}

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

// Manifest files to check for GitHub repo info (in priority order)
const MANIFEST_FILES = ['package.json', 'go.mod', 'Cargo.toml', 'pyproject.toml'] as const;

// Skip these common heavy directories
const IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    '.idea',
    '.vscode',
    'dist',
    'build',
    'coverage',
    'target', // rust
    '__pycache__',
    'venv',
    '.venv',
    'env'
]);

async function getGitConfig(handle: FileSystemDirectoryHandle): Promise<ReturnType<typeof parseGitConfig>> {
    try {
        const gitDir = await handle.getDirectoryHandle('.git');
        const configFile = await gitDir.getFileHandle('config');
        const file = await configFile.getFile();
        const text = await file.text();
        return parseGitConfig(text);
    } catch {
        return null;
    }
}

async function getManifestInfo(
    handle: FileSystemDirectoryHandle
): Promise<{ manifest: ParsedManifest; source: ManifestSource } | null> {
    for (const filename of MANIFEST_FILES) {
        try {
            const fileHandle = await handle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            const content = await file.text();
            const manifest = parseManifestFile(filename, content);
            if (manifest) {
                return {
                    manifest,
                    source: manifest.source,
                };
            }
        } catch {
            // File doesn't exist or can't be read, try next
            continue;
        }
    }
    return null;
}

async function detectProjectType(handle: FileSystemDirectoryHandle): Promise<ScannedProject['projectType']> {
    for await (const [name, entry] of handle.entries()) {
        if (entry.kind === 'file' && PROJECT_TYPE_INDICATORS[name]) {
            return PROJECT_TYPE_INDICATORS[name] as ScannedProject['projectType'];
        }
    }
    return 'unknown';
}

export function useDirectoryScanner() {
    const [status, setStatus] = useState<ScanStatus>({
        scanning: false,
        totalScanned: 0,
        projectsFound: 0,
        currentPath: '',
        error: null,
    });

    const [scanResults, setScanResults] = useState<ScannedProject[]>([]);

    const scanDirectory = useCallback(async () => {
        // Check globalThis instead of window for better compatibility
        if (!('showDirectoryPicker' in globalThis)) {
            setStatus(prev => ({ ...prev, error: 'Your browser does not support scanning local folders. Please use Chrome, Edge, or Opera.' }));
            return;
        }

        try {
            const dirHandle = await showDirectoryPicker();

            setStatus({
                scanning: true,
                totalScanned: 0,
                projectsFound: 0,
                currentPath: dirHandle.name,
                error: null,
            });
            setScanResults([]);

            const projects: ScannedProject[] = [];

            // Recursive scan function
            const scanRecursive = async (handle: FileSystemDirectoryHandle, path: string, depth = 0) => {
                // Limit depth to avoid infinite loops or extremely long scans
                if (depth > 4) return;

                setStatus(prev => ({ ...prev, currentPath: path, totalScanned: prev.totalScanned + 1 }));

                let isProject = false;
                let githubRepo: ScannedProject['githubRepo'] = null;
                let detectionSource: ManifestSource | null = null;

                try {
                    const projectType = await detectProjectType(handle);

                    // Priority 1: Try .git/config first
                    const gitConfig = await getGitConfig(handle);
                    if (gitConfig) {
                        githubRepo = gitConfig;
                        detectionSource = 'git';
                        isProject = true;
                    }

                    // Priority 2-5: Try manifest files as fallback
                    if (!githubRepo) {
                        const manifestInfo = await getManifestInfo(handle);
                        if (manifestInfo) {
                            githubRepo = {
                                owner: manifestInfo.manifest.owner,
                                repo: manifestInfo.manifest.repo,
                                url: manifestInfo.manifest.url,
                            };
                            detectionSource = manifestInfo.source;
                            isProject = true;
                        }
                    }

                    // Mark as project if we have project type indicators even without git info
                    if (!isProject && projectType !== 'unknown') {
                        isProject = true;
                    }

                    if (isProject) {
                        const newProject: ScannedProject = {
                            name: handle.name,
                            path: path,
                            projectType,
                            githubRepo,
                            gitConfigPath: gitConfig ? 'detected' : null,
                            detectionSource,
                            version: null, // Version detection happens server-side
                        };

                        projects.push(newProject);
                        setStatus(prev => ({ ...prev, projectsFound: prev.projectsFound + 1 }));

                        // If it's a project, do we go deeper?
                        // Usually monorepos might have sub-projects. Let's allow 1 more level if it's a root project
                        if (depth > 1) return;
                    }

                    // Recurse into subdirectories
                    for await (const [name, entry] of handle.entries()) {
                        if (entry.kind === 'directory' && !IGNORED_DIRS.has(name) && !name.startsWith('.')) {
                            await scanRecursive(entry as FileSystemDirectoryHandle, `${path}/${name}`, depth + 1);
                        }
                    }

                } catch (err) {
                    console.warn(`Skipping dir ${path}:`, err);
                }
            };

            await scanRecursive(dirHandle, dirHandle.name);

            setScanResults(projects);

        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                // User cancelled
                setStatus(prev => ({ ...prev, scanning: false }));
                return;
            }
            console.error('Scan failed:', err);
            setStatus(prev => ({ ...prev, error: 'Failed to scan directory. Please try a different folder.' }));
        } finally {
            setStatus(prev => ({ ...prev, scanning: false }));
        }
    }, []);

    return {
        scanDirectory,
        scanResults,
        status,
        isSupported: 'showDirectoryPicker' in globalThis
    };
}
