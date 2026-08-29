/**
 * SSRF & Remote URL Security Validator
 * Validates download URLs to prevent SSRF against loopback, LAN, link-local, and cloud metadata endpoints.
 */
export function isSafeRemoteDownloadUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    // Enforce HTTPS protocol only
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase().trim();
    if (!hostname) return false;

    // Block loopback, localhost, and metadata hosts
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal'
    ) {
      return false;
    }

    // IPv4 private/reserved ranges check
    const ipv4Match = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(hostname);
    if (ipv4Match) {
      const octet1 = parseInt(ipv4Match[1], 10);
      const octet2 = parseInt(ipv4Match[2], 10);
      if (
        octet1 === 0 || // 0.0.0.0/8
        octet1 === 10 || // 10.0.0.0/8
        octet1 === 127 || // 127.0.0.0/8
        (octet1 === 172 && octet2 >= 16 && octet2 <= 31) || // 172.16.0.0/12
        (octet1 === 192 && octet2 === 168) || // 192.168.0.0/16
        (octet1 === 169 && octet2 === 254) // 169.254.0.0/16 (Link Local / Cloud Metadata)
      ) {
        return false;
      }
    }

    // IPv6 private/reserved ranges (fc00::/7, fe80::/10, etc.)
    if (hostname.includes(':')) {
      const cleanIpv6 = hostname.replace(/^\[|\]$/g, '');
      if (
        cleanIpv6 === '::1' ||
        cleanIpv6.startsWith('fe80:') ||
        cleanIpv6.startsWith('fc') ||
        cleanIpv6.startsWith('fd')
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * List of prohibited sensitive directory patterns (defense-in-depth)
 */
export const SENSITIVE_PATH_PATTERNS: RegExp[] = [
  /[/\\]\.ssh([/\\]|$)/i,
  /[/\\]\.aws([/\\]|$)/i,
  /[/\\]\.gnupg([/\\]|$)/i,
  /[/\\]\.config([/\\]|$)/i,
  /[/\\]\.git([/\\]|$)/i,
  /[/\\]AppData[/\\]Local[/\\]Google[/\\]Chrome/i,
  /[/\\]AppData[/\\]Roaming[/\\]Mozilla/i,
  /[/\\]Windows[/\\]System32/i,
  /[/\\]etc[/\\]shadow/i,
  /[/\\]etc[/\\]passwd/i,
];

/**
 * Validates whether a target path strictly resolves inside one of the given allowed root directories,
 * preventing path traversal (e.g. `../`), root escapes, and access to sensitive folders.
 */
export function isPathInsideAllowedRoots(
  targetPath: string,
  allowedRoots: string[],
  isWindows: boolean = typeof process !== 'undefined' ? process.platform === 'win32' : false
): boolean {
  if (!targetPath || typeof targetPath !== 'string' || !allowedRoots || allowedRoots.length === 0) {
    return false;
  }

  try {
    const cleanTarget = targetPath.trim();
    if (!cleanTarget) return false;

    // Reject NULL byte injection
    if (cleanTarget.includes('\0')) return false;

    for (const pattern of SENSITIVE_PATH_PATTERNS) {
      if (pattern.test(cleanTarget)) {
        return false;
      }
    }

    const normalizedTarget = cleanTarget.replace(/\\/g, '/').replace(/\/+/g, '/');
    const targetLower = isWindows ? normalizedTarget.toLowerCase() : normalizedTarget;

    return allowedRoots.some((root) => {
      if (!root || typeof root !== 'string') return false;
      const normalizedRoot = root.trim().replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
      if (!normalizedRoot) return false;
      const rootLower = isWindows ? normalizedRoot.toLowerCase() : normalizedRoot;
      const rootWithSlash = rootLower + '/';

      return targetLower === rootLower || targetLower.startsWith(rootWithSlash);
    });
  } catch {
    return false;
  }
}

