import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

interface FileSystemEntry {
    name: string;
    path: string;
    isDirectory: boolean;
}

interface ListDirectoryResult {
    path: string;
    entries: FileSystemEntry[];
    parent: string | null;
    error?: string;
}

export async function listDirectories(dirPath?: string): Promise<ListDirectoryResult> {
    // Default to home directory if no path provided
    const targetPath = dirPath ? path.resolve(dirPath) : os.homedir();

    try {
        // Check if path exists and is a directory
        const stats = await fs.stat(targetPath);
        if (!stats.isDirectory()) {
            return {
                path: targetPath,
                entries: [],
                parent: path.dirname(targetPath),
                error: 'Not a directory',
            };
        }

        const entries = await fs.readdir(targetPath, { withFileTypes: true });

        const directories: FileSystemEntry[] = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => ({
                name: entry.name,
                path: path.join(targetPath, entry.name),
                isDirectory: true,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        // Calculate parent path
        const parent = path.dirname(targetPath);
        const isRoot = parent === targetPath;

        return {
            path: targetPath,
            entries: directories,
            parent: isRoot ? null : parent,
        };
    } catch (error) {
        return {
            path: targetPath,
            entries: [],
            parent: path.dirname(targetPath),
            error: (error as Error).message,
        };
    }
}

export const filesystemService = {
    listDirectories,
};
