import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { isSafeRemoteDownloadUrl, validateSafeDownloadUrlAsync, SENSITIVE_PATH_PATTERNS } from '../src/utils/securityUtils';
export { isSafeRemoteDownloadUrl, validateSafeDownloadUrlAsync };

const TRUSTED_DIRS_FILE = 'trusted_export_dirs.json';
const trustedUserDirs: string[] = [];

/**
 * Register a user-selected directory as trusted.
 * Only called from native system dialogs where the user explicitly chose the path.
 */
export function registerTrustedDirectory(dirPath: string): boolean {
  if (!dirPath || typeof dirPath !== 'string') return false;
  try {
    const resolved = path.resolve(dirPath);
    if (SENSITIVE_PATH_PATTERNS.some((rx) => rx.test(resolved))) return false;
    if (!trustedUserDirs.includes(resolved)) {
      trustedUserDirs.push(resolved);
    }
    const storePath = path.join(app.getPath('userData'), TRUSTED_DIRS_FILE);
    fs.writeFileSync(storePath, JSON.stringify(trustedUserDirs), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Load persisted trusted directories from userData on app initialization.
 */
export function loadTrustedDirectories(): void {
  try {
    const storePath = path.join(app.getPath('userData'), TRUSTED_DIRS_FILE);
    if (!fs.existsSync(storePath)) return;
    const saved = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    if (!Array.isArray(saved)) return;
    for (const d of saved) {
      if (typeof d !== 'string') continue;
      const resolved = path.resolve(d);
      if (
        !SENSITIVE_PATH_PATTERNS.some((rx) => rx.test(resolved)) &&
        !trustedUserDirs.includes(resolved)
      ) {
        trustedUserDirs.push(resolved);
      }
    }
  } catch {
    /* Corrupted file: ignore and continue with empty list */
  }
}

/**
 * Path validation helper against Path Traversal & Unauthorized Access vulnerabilities.
 * Restricts filesystem read/write operations to authorized application data,
 * standard user media/documents folders, and user-selected trusted directories.
 */
export function isSafeUserPath(targetPath: string): boolean {
  if (!targetPath || typeof targetPath !== 'string') return false;
  try {
    const normalized = path.resolve(targetPath);
    const normalizedLower = process.platform === 'win32' ? normalized.toLowerCase() : normalized;

    // Defense-in-depth: block explicit sensitive credential and system directory patterns
    for (const pattern of SENSITIVE_PATH_PATTERNS) {
      if (pattern.test(normalized)) {
        return false;
      }
    }

    const appData = path.join(app.getPath('userData'), 'IslamicReelsStudio');

    // Authorized folders + explicitly trusted directories from user dialogs
    const allowedRoots = [
      appData,
      app.getPath('userData'),
      app.getPath('temp'),
      app.getPath('videos'),
      app.getPath('pictures'),
      app.getPath('documents'),
      app.getPath('downloads'),
      app.getPath('desktop'),
      ...trustedUserDirs,
    ];

    return allowedRoots.some((root) => {
      if (!root || typeof root !== 'string') return false;
      const resolvedRoot = path.resolve(root);
      const rootLower = process.platform === 'win32' ? resolvedRoot.toLowerCase() : resolvedRoot;
      const rootWithSep = rootLower.endsWith(path.sep) ? rootLower : rootLower + path.sep;
      return normalizedLower === rootLower || normalizedLower.startsWith(rootWithSep);
    });
  } catch {
    return false;
  }
}
