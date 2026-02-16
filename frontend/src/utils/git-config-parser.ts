export interface GitConfig {
    remote: {
        origin: {
            url: string;
            fetch: string;
        };
    };
}

// Match GitHub URLs: https, ssh, and git protocols
// Anchored to prevent ReDoS and partial matches
const GITHUB_URL_REGEX = /^(?:https?:\/\/|git@|git:\/\/)github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/i;

export function parseGitConfig(content: string): { owner: string; repo: string; url: string } | null {
    try {
        const remoteOriginMatch = /\[remote\s+"origin"\]([\s\S]*?)(?=\[|$)/.exec(content);
        if (!remoteOriginMatch) {
            return null;
        }

        const remoteSection = remoteOriginMatch[1];
        const urlMatch = /^\s*url\s*=\s*(.+)$/m.exec(remoteSection);
        if (!urlMatch) {
            return null;
        }

        const gitUrl = urlMatch[1].trim();
        const githubMatch = GITHUB_URL_REGEX.exec(gitUrl);

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
