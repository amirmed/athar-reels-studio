import { isSafeRemoteDownloadUrl, validateSafeDownloadUrlAsync } from '../src/utils/securityUtils';
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
export declare function isSafeUserPath(targetPath: string): boolean;
