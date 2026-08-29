/**
 * Parse an IPv4 address from any standard notation (decimal integer, hex, octal, shorthand, dotted quad)
 * Returns a 32-bit unsigned integer or null if invalid IPv4.
 */
export function parseIPv4ToNumber(host) {
    const trimmed = host.trim();
    if (!trimmed)
        return null;
    // 1. Single integer/hex/octal representation (e.g. "2130706433", "0x7f000001", "017700000001")
    if (/^(0x[0-9a-fA-F]+|0[0-7]+|\d+)$/.test(trimmed)) {
        const val = Number(trimmed);
        if (Number.isSafeInteger(val) && val >= 0 && val <= 0xffffffff) {
            return val >>> 0;
        }
        return null;
    }
    // 2. Dotted notation (1 to 4 parts, e.g. "127.0.0.1", "127.1", "10.0.1", etc.)
    const parts = trimmed.split('.');
    if (parts.length >= 1 && parts.length <= 4) {
        const nums = [];
        for (const p of parts) {
            if (!/^(0x[0-9a-fA-F]+|0[0-7]+|\d+)$/.test(p)) {
                return null;
            }
            const num = Number(p);
            if (!Number.isSafeInteger(num) || num < 0)
                return null;
            nums.push(num);
        }
        if (parts.length === 4) {
            if (nums.some((n) => n > 255))
                return null;
            return (((nums[0] << 24) >>> 0) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
        }
        else if (parts.length === 3) {
            if (nums[0] > 255 || nums[1] > 255 || nums[2] > 0xffff)
                return null;
            return (((nums[0] << 24) >>> 0) | (nums[1] << 16) | nums[2]) >>> 0;
        }
        else if (parts.length === 2) {
            if (nums[0] > 255 || nums[1] > 0xffffff)
                return null;
            return (((nums[0] << 24) >>> 0) | nums[1]) >>> 0;
        }
        else if (parts.length === 1) {
            if (nums[0] > 0xffffffff)
                return null;
            return nums[0] >>> 0;
        }
    }
    return null;
}
/**
 * Check if a 32-bit IPv4 address falls into any private, loopback, link-local, or reserved range.
 */
export function isPrivateOrReservedIPv4Number(ipNum) {
    const octet1 = (ipNum >>> 24) & 0xff;
    const octet2 = (ipNum >>> 16) & 0xff;
    const octet3 = (ipNum >>> 8) & 0xff;
    // 0.0.0.0/8 (Current network)
    if (octet1 === 0)
        return true;
    // 10.0.0.0/8 (Private network)
    if (octet1 === 10)
        return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (octet1 === 100 && octet2 >= 64 && octet2 <= 127)
        return true;
    // 127.0.0.0/8 (Loopback)
    if (octet1 === 127)
        return true;
    // 169.254.0.0/16 (Link Local / Cloud Metadata)
    if (octet1 === 169 && octet2 === 254)
        return true;
    // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31)
        return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (octet1 === 192 && octet2 === 0 && octet3 === 0)
        return true;
    // 192.0.2.0/24 (TEST-NET-1)
    if (octet1 === 192 && octet2 === 0 && octet3 === 2)
        return true;
    // 192.88.99.0/24 (6to4 Relay Anycast)
    if (octet1 === 192 && octet2 === 88 && octet3 === 99)
        return true;
    // 192.168.0.0/16 (Private network)
    if (octet1 === 192 && octet2 === 168)
        return true;
    // 198.18.0.0/15 (Benchmarking)
    if (octet1 === 198 && (octet2 === 18 || octet2 === 19))
        return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (octet1 === 198 && octet2 === 51 && octet3 === 100)
        return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (octet1 === 203 && octet2 === 0 && octet3 === 113)
        return true;
    // 224.0.0.0/4 (Multicast)
    if (octet1 >= 224 && octet1 <= 239)
        return true;
    // 240.0.0.0/4 (Reserved for future use & Broadcast)
    if (octet1 >= 240)
        return true;
    // 255.255.255.255 (Limited Broadcast)
    if (ipNum === 0xffffffff)
        return true;
    return false;
}
/**
 * Check if an IPv6 address string falls into loopback, unique-local, link-local,
 * documentation, 6to4, or IPv4-mapped private ranges.
 */
export function isPrivateOrReservedIPv6(rawIpv6) {
    const lower = rawIpv6.toLowerCase().replace(/^\[|\]$/g, '').trim();
    if (!lower)
        return true;
    // 1. Check embedded IPv4 at the end (e.g. ::ffff:127.0.0.1, ::192.168.1.1, ::127.0.0.1)
    const lastColon = lower.lastIndexOf(':');
    if (lastColon !== -1) {
        const potentialIpv4 = lower.substring(lastColon + 1);
        if (/^\d+\.\d+\.\d+\.\d+$/.test(potentialIpv4)) {
            const parsed = parseIPv4ToNumber(potentialIpv4);
            if (parsed !== null && isPrivateOrReservedIPv4Number(parsed)) {
                return true;
            }
        }
    }
    // 2. Loopback and unspecified
    if (lower === '::1' || lower === '::' || /^0*(:0*)*:0*1$/.test(lower) || /^0*(:0*)*:0*$/.test(lower)) {
        return true;
    }
    // 3. IPv4-compatible (::/96, e.g. ::7f00:1, ::127.0.0.1)
    if (lower.startsWith('::')) {
        const rest = lower.slice(2);
        if (!rest || rest === '1')
            return true;
        const parts = rest.split(':').filter(Boolean);
        if (parts.length <= 2) {
            if (parts.length === 2) {
                const p1 = parseInt(parts[0], 16);
                const p2 = parseInt(parts[1], 16);
                if (!isNaN(p1) && !isNaN(p2)) {
                    const ipNum = (((p1 << 16) | p2) >>> 0);
                    if (isPrivateOrReservedIPv4Number(ipNum))
                        return true;
                }
            }
            else if (parts.length === 1) {
                const p1 = parseInt(parts[0], 16);
                if (!isNaN(p1) && isPrivateOrReservedIPv4Number(p1))
                    return true;
            }
            return true; // Deprecated IPv4-compatible addresses are blocked
        }
    }
    // 4. IPv4-mapped (::ffff:0:0/96, e.g. ::ffff:127.0.0.1, ::ffff:7f00:1)
    if (lower.startsWith('::ffff:') || lower.startsWith('0:0:0:0:0:ffff:') || lower.startsWith('::ffff:0:')) {
        const parts = lower.split(':').filter(Boolean);
        if (parts.length >= 2) {
            const p1 = parseInt(parts[parts.length - 2], 16);
            const p2 = parseInt(parts[parts.length - 1], 16);
            if (!isNaN(p1) && !isNaN(p2)) {
                const ipNum = (((p1 << 16) | p2) >>> 0);
                if (isPrivateOrReservedIPv4Number(ipNum))
                    return true;
            }
        }
        return true;
    }
    // 5. NAT64 prefix (64:ff9b::/96)
    if (lower.startsWith('64:ff9b::') || lower.startsWith('64:ff9b:1::')) {
        return true;
    }
    // 6. Unique local addresses (fc00::/7 - fc.. and fd..)
    if (/^f[cd][0-9a-f]{2}:/i.test(lower) || lower.startsWith('fc') || lower.startsWith('fd')) {
        return true;
    }
    // 7. Link-local unicast (fe80::/10 - fe8.., fe9.., fea.., feb..)
    if (/^fe[89ab][0-9a-f]:/i.test(lower) || lower.startsWith('fe80:') || lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
        return true;
    }
    // 8. Documentation (2001:db8::/32)
    if (lower.startsWith('2001:db8:') || lower.startsWith('2001:0db8:')) {
        return true;
    }
    // 9. 6to4 prefix (2002::/16) - 2002:WWXX:YYZZ::
    if (lower.startsWith('2002:')) {
        const parts = lower.split(':');
        if (parts.length >= 3) {
            const hex1 = parseInt(parts[1], 16);
            const hex2 = parseInt(parts[2], 16);
            if (!isNaN(hex1) && !isNaN(hex2)) {
                const ipNum = (((hex1 << 16) | hex2) >>> 0);
                if (isPrivateOrReservedIPv4Number(ipNum))
                    return true;
            }
        }
        return true;
    }
    return false;
}
/**
 * SSRF & Remote URL Security Validator (Synchronous)
 * Validates download URLs to prevent SSRF against loopback, LAN, link-local, cloud metadata, and all IP notations.
 */
export function isSafeRemoteDownloadUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string')
        return false;
    try {
        const parsed = new URL(urlStr);
        // Enforce HTTPS protocol only
        if (parsed.protocol !== 'https:') {
            return false;
        }
        let hostname = parsed.hostname.toLowerCase().trim();
        if (!hostname)
            return false;
        // Remove IPv6 brackets if present
        if (hostname.startsWith('[') && hostname.endsWith(']')) {
            hostname = hostname.slice(1, -1);
        }
        // Block loopback, localhost, and metadata hosts
        if (hostname === 'localhost' ||
            hostname.endsWith('.localhost') ||
            hostname === 'metadata.google.internal' ||
            hostname.endsWith('.local') ||
            hostname.endsWith('.internal') ||
            hostname.endsWith('.lan')) {
            return false;
        }
        // Check if hostname is an IPv4 representation (e.g. 127.0.0.1, 2130706433, 0x7f000001, 127.1)
        const ipv4Num = parseIPv4ToNumber(hostname);
        if (ipv4Num !== null) {
            if (isPrivateOrReservedIPv4Number(ipv4Num)) {
                return false;
            }
        }
        // Check if hostname is IPv6 or contains IPv6 colons (e.g. ::ffff:127.0.0.1, ::1, fe80::1)
        if (hostname.includes(':')) {
            if (isPrivateOrReservedIPv6(hostname)) {
                return false;
            }
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Asynchronous SSRF & DNS Rebinding Validator
 * Validates the URL and resolves its host against DNS to ensure it doesn't resolve to internal IP ranges.
 */
export async function validateSafeDownloadUrlAsync(urlStr, dnsLookupFn) {
    if (!isSafeRemoteDownloadUrl(urlStr))
        return false;
    try {
        const parsed = new URL(urlStr);
        let host = parsed.hostname.toLowerCase().trim();
        if (host.startsWith('[') && host.endsWith(']')) {
            host = host.slice(1, -1);
        }
        // If host is already a verified raw IP, no DNS lookup needed
        if (parseIPv4ToNumber(host) !== null || host.includes(':')) {
            return true;
        }
        if (dnsLookupFn) {
            const ips = await dnsLookupFn(host);
            if (!ips || ips.length === 0)
                return false;
            for (const ip of ips) {
                const parsedV4 = parseIPv4ToNumber(ip);
                if (parsedV4 !== null) {
                    if (isPrivateOrReservedIPv4Number(parsedV4))
                        return false;
                }
                else if (ip.includes(':')) {
                    if (isPrivateOrReservedIPv6(ip))
                        return false;
                }
            }
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * List of prohibited sensitive directory patterns (defense-in-depth)
 */
export const SENSITIVE_PATH_PATTERNS = [
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
export function isPathInsideAllowedRoots(targetPath, allowedRoots, isWindows = typeof process !== 'undefined' ? process.platform === 'win32' : false) {
    if (!targetPath || typeof targetPath !== 'string' || !allowedRoots || allowedRoots.length === 0) {
        return false;
    }
    try {
        const cleanTarget = targetPath.trim();
        if (!cleanTarget)
            return false;
        // Reject NULL byte injection
        if (cleanTarget.includes('\0'))
            return false;
        for (const pattern of SENSITIVE_PATH_PATTERNS) {
            if (pattern.test(cleanTarget)) {
                return false;
            }
        }
        const normalizedTarget = cleanTarget.replace(/\\/g, '/').replace(/\/+/g, '/');
        const targetLower = isWindows ? normalizedTarget.toLowerCase() : normalizedTarget;
        return allowedRoots.some((root) => {
            if (!root || typeof root !== 'string')
                return false;
            const normalizedRoot = root.trim().replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
            if (!normalizedRoot)
                return false;
            const rootLower = isWindows ? normalizedRoot.toLowerCase() : normalizedRoot;
            const rootWithSlash = rootLower + '/';
            return targetLower === rootLower || targetLower.startsWith(rootWithSlash);
        });
    }
    catch {
        return false;
    }
}
