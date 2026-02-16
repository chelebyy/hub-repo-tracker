export interface ScannedProject {
  path: string;
  name: string;
  gitConfigPath: string | null;
  githubRepo: {
    owner: string;
    repo: string;
    url: string;
  } | null;
  projectType: 'node' | 'python' | 'go' | 'rust' | 'unknown' | null;
  version: string | null;
}

export interface VersionDetectResult {
  version: string | null;
  projectType: 'node' | 'python' | 'go' | 'rust' | 'unknown';
}

export interface FolderScanResult {
  projects: ScannedProject[];
  scannedAt: string;
  totalFound: number;
}
