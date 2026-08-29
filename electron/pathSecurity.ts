import { app } from 'electron';
import path from 'path';
import { isSafeRemoteDownloadUrl, validateSafeDownloadUrlAsync, SENSITIVE_PATH_PATTERNS } from '../src/utils/securityUtils';
export { isSafeRemoteDownloadUrl, validateSafeDownloadUrlAsync };

/**
 * Path validation helper against Path Traversal & Unauthorized Access vulnerabilities.
 * Strictly restricts filesystem read/write operations to immutable, authorized
 * application data and standard user media/documents folders.
 *
 * Security guarantees:
 * 1. Hardcoded, immutable allowed roots only (no dynamic additions from untrusted settings).
 * 2. `home` root is strictly excluded to protect root-level user profile, credential, and browser data files.
 * 3. Case-insensitive canonical path comparison and directory boundary enforcement.
 * 4. Explicit blocking of sensitive credential and system directory patterns.
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

    // Strictly fixed, immutable whitelist of authorized folders
    const allowedRoots = [
      appData,
      app.getPath('userData'),
      app.getPath('temp'),
      app.getPath('videos'),
      app.getPath('pictures'),
      app.getPath('documents'),
      app.getPath('downloads'),
      app.getPath('desktop'),
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
