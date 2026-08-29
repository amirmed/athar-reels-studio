/**
 * Parse an IPv4 address from any standard notation (decimal integer, hex, octal, shorthand, dotted quad)
 * Returns a 32-bit unsigned integer or null if invalid IPv4.
 */
export declare function parseIPv4ToNumber(host: string): number | null;
/**
 * Check if a 32-bit IPv4 address falls into any private, loopback, link-local, or reserved range.
 */
export declare function isPrivateOrReservedIPv4Number(ipNum: number): boolean;
/**
 * Check if an IPv6 address string falls into loopback, unique-local, link-local,
 * documentation, 6to4, or IPv4-mapped private ranges.
 */
export declare function isPrivateOrReservedIPv6(rawIpv6: string): boolean;
/**
 * SSRF & Remote URL Security Validator (Synchronous)
 * Validates download URLs to prevent SSRF against loopback, LAN, link-local, cloud metadata, and all IP notations.
 */
export declare function isSafeRemoteDownloadUrl(urlStr: string): boolean;
/**
 * Asynchronous SSRF & DNS Rebinding Validator
 * Validates the URL and resolves its host against DNS to ensure it doesn't resolve to internal IP ranges.
 */
export declare function validateSafeDownloadUrlAsync(urlStr: string, dnsLookupFn?: (host: string) => Promise<string[]>): Promise<boolean>;
/**
 * List of prohibited sensitive directory patterns (defense-in-depth)
 */
export declare const SENSITIVE_PATH_PATTERNS: RegExp[];
/**
 * Validates whether a target path strictly resolves inside one of the given allowed root directories,
 * preventing path traversal (e.g. `../`), root escapes, and access to sensitive folders.
 */
export declare function isPathInsideAllowedRoots(targetPath: string, allowedRoots: string[], isWindows?: boolean): boolean;
