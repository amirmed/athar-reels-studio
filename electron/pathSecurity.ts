import { app } from 'electron';
import path from 'path';
import fs from 'fs';
export { isSafeRemoteDownloadUrl } from '../src/utils/securityUtils';

/**
 * Path validation helper against Path Traversal vulnerabilities
 * Ensures that any filesystem read/write operation is strictly restricted
 * to authorized user directories or explicitly configured project folders.
 */
export function isSafeUserPath(targetPath: string): boolean {
  if (!targetPath || typeof targetPath !== 'string') return false;
  try {
    const normalized = path.resolve(targetPath);
    const normalizedLower = process.platform === 'win32' ? normalized.toLowerCase() : normalized;
    const appData = path.join(app.getPath('userData'), 'IslamicReelsStudio');

    const allowedRoots = [
      appData,
      app.getPath('userData'),
      app.getPath('temp'),
      app.getPath('videos'),
      app.getPath('pictures'),
      app.getPath('documents'),
      app.getPath('downloads'),
      app.getPath('desktop'),
      app.getPath('home'),
    ];

    try {
      const settingsFile = path.join(appData, 'settings.json');
      if (fs.existsSync(settingsFile)) {
        const parsed = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        if (parsed?.projectsPath && typeof parsed.projectsPath === 'string') {
          allowedRoots.push(parsed.projectsPath);
        }
      }
    } catch {
      // Ignore settings read error
    }

    return allowedRoots.some((root) => {
      const resolvedRoot = path.resolve(root);
      const rootLower = process.platform === 'win32' ? resolvedRoot.toLowerCase() : resolvedRoot;
      const rootWithSep = rootLower.endsWith(path.sep) ? rootLower : rootLower + path.sep;
      return normalizedLower === rootLower || normalizedLower.startsWith(rootWithSep);
    });
  } catch {
    return false;
  }
}
