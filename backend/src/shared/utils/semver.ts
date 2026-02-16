import semver from 'semver';

/**
 * Removes 'v' prefix from version string
 */
export function normalizeVersion(version: string | null | undefined): string | null {
  if (!version) return null;
  return version.startsWith('v') ? version.slice(1) : version;
}

/**
 * Compare two semantic versions
 * Returns:
 * - 'major' - latest has major version update
 * - 'minor' - latest has minor version update
 * - 'patch' - latest has patch version update
 * - 'none' - versions are equal
 * - 'ahead' - installed is ahead of latest
 * - 'unknown' - cannot compare (invalid versions)
 */
export function compareVersions(
  installed: string | null | undefined,
  latest: string | null | undefined
): 'major' | 'minor' | 'patch' | 'none' | 'ahead' | 'unknown' {
  const normalizedInstalled = normalizeVersion(installed);
  const normalizedLatest = normalizeVersion(latest);

  // If either is missing, cannot compare
  if (!normalizedInstalled || !normalizedLatest) {
    return 'unknown';
  }

  // Try to coerce versions (handles versions like "1.0" -> "1.0.0")
  const installedSemver = semver.coerce(normalizedInstalled);
  const latestSemver = semver.coerce(normalizedLatest);

  if (!installedSemver || !latestSemver) {
    return 'unknown';
  }

  const diff = semver.diff(installedSemver, latestSemver);

  if (!diff) {
    return 'none';
  }

  // Installed is ahead of latest
  if (semver.gt(installedSemver, latestSemver)) {
    return 'ahead';
  }

  // Latest is ahead - determine the type of update
  if (diff.startsWith('major')) {
    return 'major';
  }
  if (diff.startsWith('minor')) {
    return 'minor';
  }
  if (diff.startsWith('patch')) {
    return 'patch';
  }

  return 'unknown';
}

/**
 * Check if there is an available update
 */
export function hasUpdateAvailable(
  installed: string | null | undefined,
  latest: string | null | undefined
): boolean {
  const comparison = compareVersions(installed, latest);
  return ['major', 'minor', 'patch'].includes(comparison);
}
