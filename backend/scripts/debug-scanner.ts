
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Copying logic from service.ts to ensure identical behavior
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

function detectProjectType(projectPath: string): string | null {
    try {
        const files = fs.readdirSync(projectPath);
        for (const file of files) {
            if (PROJECT_TYPE_INDICATORS[file]) {
                return PROJECT_TYPE_INDICATORS[file];
            }
        }
        return 'unknown';
    } catch (e) {
        return null;
    }
}

function analyzePath(targetPath: string) {
    console.log(`\n--- Analyzing: ${targetPath} ---`);

    if (!fs.existsSync(targetPath)) {
        console.log("Path does not exist.");
        return;
    }

    try {
        const entries = fs.readdirSync(targetPath, { withFileTypes: true });
        console.log(`Found ${entries.length} entries.`);

        const dotFolders = ['.gemini', '.agent', '.agents', '.antigravity', '.android'];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            // Only examine dotFolders we are interested in, plus a few normal ones
            if (!dotFolders.includes(entry.name) && !entry.name.startsWith('yt-')) continue;

            const fullPath = path.join(targetPath, entry.name);
            const isIgnored = IGNORED_FOLDERS.has(entry.name);
            const hasGit = fs.existsSync(path.join(fullPath, '.git'));
            const projectType = detectProjectType(fullPath);

            console.log(`\nDirectory: ${entry.name}`);
            console.log(`  Ignored: ${isIgnored}`);
            console.log(`  Has .git: ${hasGit}`);
            console.log(`  Project Type: ${projectType}`);

            if (projectType !== 'unknown') {
                console.log(`  -> Triggered by: unknown (need to check files)`);
                const files = fs.readdirSync(fullPath);
                const triggers = files.filter(f => PROJECT_TYPE_INDICATORS[f]);
                console.log(`  -> Indicator Files: ${triggers.join(', ')}`);
            }

            // Simulated Logic
            const isProject = (projectType !== 'unknown' || hasGit);
            console.log(`  -> Scanner Decision: ${isProject ? "TREATED AS PROJECT (Stop Recursion)" : "RECURSE"}`);
        }
    } catch (e) {
        console.error("Error error:", e);
    }
}

const homeDir = os.homedir();
// Analyze Home to see why .gemini etc are treated as projects
analyzePath(homeDir);

// Analyze .gemini to see what's inside
analyzePath(path.join(homeDir, '.gemini'));
