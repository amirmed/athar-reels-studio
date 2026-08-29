import { describe, it, expect } from 'vitest';
import {
  isSafeRemoteDownloadUrl,
  validateSafeDownloadUrlAsync,
  parseIPv4ToNumber,
  isPathInsideAllowedRoots,
} from '../utils/securityUtils';

describe('Security Hardening & Protection Suite', () => {
  describe('SSRF & Remote URL Security (isSafeRemoteDownloadUrl & validateSafeDownloadUrlAsync)', () => {
    it('strictly requires HTTPS and blocks HTTP and arbitrary schemes', () => {
      expect(isSafeRemoteDownloadUrl('http://example.com/audio.mp3')).toBe(false);
      expect(isSafeRemoteDownloadUrl('ftp://example.com/file')).toBe(false);
      expect(isSafeRemoteDownloadUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeRemoteDownloadUrl('gopher://127.0.0.1:70/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('data:image/png;base64,abc')).toBe(false);
      expect(isSafeRemoteDownloadUrl('javascript:alert(1)')).toBe(false);
    });

    it('blocks localhost, loopback, and local domain variants', () => {
      expect(isSafeRemoteDownloadUrl('https://localhost/api')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://app.localhost:8080/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://127.0.0.1/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://127.0.0.2:3000/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://0.0.0.0/')).toBe(false);
    });

    it('blocks decimal, hex, octal, and shorthand IPv4 loopback & private bypass attempts', () => {
      // 2130706433 = 127.0.0.1 in decimal integer
      expect(parseIPv4ToNumber('2130706433')).toBe(0x7f000001);
      expect(parseIPv4ToNumber('0x7f000001')).toBe(0x7f000001);
      expect(parseIPv4ToNumber('127.0.0.1')).toBe(0x7f000001);
      expect(isSafeRemoteDownloadUrl('https://2130706433/')).toBe(false);
      // 0x7f000001 = 127.0.0.1 in hex
      expect(isSafeRemoteDownloadUrl('https://0x7f000001/')).toBe(false);
      // 127.1 = 127.0.0.1 shorthand
      expect(isSafeRemoteDownloadUrl('https://127.1/')).toBe(false);
      // 2886729729 = 172.16.0.1 in decimal integer
      expect(isSafeRemoteDownloadUrl('https://2886729729/')).toBe(false);
      // 3232235521 = 192.168.0.1 in decimal integer
      expect(isSafeRemoteDownloadUrl('https://3232235521/')).toBe(false);
      // 167772161 = 10.0.0.1 in decimal integer
      expect(isSafeRemoteDownloadUrl('https://167772161/')).toBe(false);
      // 2852039166 = 169.254.169.254 in decimal integer
      expect(isSafeRemoteDownloadUrl('https://2852039166/')).toBe(false);
    });

    it('blocks IPv4-mapped and IPv4-compatible IPv6 private & loopback addresses', () => {
      expect(isSafeRemoteDownloadUrl('https://[::ffff:127.0.0.1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[::ffff:10.0.0.1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[::ffff:192.168.1.1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[::ffff:169.254.169.254]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[::ffff:7f00:1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[::127.0.0.1]/')).toBe(false);
    });

    it('blocks private IPv4 addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
      expect(isSafeRemoteDownloadUrl('https://10.0.0.1/audio.mp3')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://10.255.255.255/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://172.16.0.1/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://172.25.10.1/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://172.31.255.255/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://192.168.0.1/test')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://192.168.1.100:8443/')).toBe(false);
    });

    it('blocks cloud metadata endpoints and link-local addresses (169.254.169.254)', () => {
      expect(isSafeRemoteDownloadUrl('https://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://169.254.1.1/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://metadata.google.internal/computeMetadata/v1/')).toBe(false);
    });

    it('blocks IPv6 loopback, link-local, and unique-local addresses', () => {
      expect(isSafeRemoteDownloadUrl('https://[::1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[fe80::1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[fc00::1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[fd12:3456:789a::1]/')).toBe(false);
    });

    it('validates and blocks DNS rebinding attacks via validateSafeDownloadUrlAsync', async () => {
      // Mock DNS resolving public-looking hostname to 127.0.0.1
      const mockRebindingDns = async (host: string) => {
        if (host === 'evil-rebinding.com') return ['127.0.0.1'];
        if (host === 'evil-metadata.com') return ['169.254.169.254'];
        if (host === 'evil-ipv6.com') return ['::ffff:127.0.0.1'];
        return ['93.184.216.34']; // example.com legitimate IP
      };

      expect(await validateSafeDownloadUrlAsync('https://evil-rebinding.com/audio.mp3', mockRebindingDns)).toBe(false);
      expect(await validateSafeDownloadUrlAsync('https://evil-metadata.com/secret', mockRebindingDns)).toBe(false);
      expect(await validateSafeDownloadUrlAsync('https://evil-ipv6.com/data', mockRebindingDns)).toBe(false);
      expect(await validateSafeDownloadUrlAsync('https://example.com/safe.mp3', mockRebindingDns)).toBe(true);
    });

    it('allows valid public HTTPS endpoints', () => {
      expect(isSafeRemoteDownloadUrl('https://verses.quran.com/AbdulBaset/Murattal/mp3/001001.mp3')).toBe(true);
      expect(isSafeRemoteDownloadUrl('https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg')).toBe(true);
      expect(isSafeRemoteDownloadUrl('https://api.quran.com/api/v4/chapters')).toBe(true);
      expect(isSafeRemoteDownloadUrl('https://atar-studio.com/assets/video.mp4')).toBe(true);
    });
  });

  describe('Path Traversal & Credential Isolation (isPathInsideAllowedRoots)', () => {
    const safeRoots = [
      'C:/Users/TestUser/AppData/Roaming/IslamicReelsStudio',
      'C:/Users/TestUser/Videos',
      'C:/Users/TestUser/Documents',
      'C:/Users/TestUser/Desktop',
    ];

    it('allows valid paths strictly inside authorized folders', () => {
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/Videos/my_reel.mp4', safeRoots, true)).toBe(true);
      expect(isPathInsideAllowedRoots('C:\\Users\\TestUser\\Documents\\Projects\\recitation.json', safeRoots, true)).toBe(true);
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/AppData/Roaming/IslamicReelsStudio/projects/1.json', safeRoots, true)).toBe(true);
    });

    it('blocks path traversal and parent directory escapes', () => {
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/Videos/../../.ssh/id_rsa', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/Documents/../../../Windows/System32/cmd.exe', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots('C:/Windows/System32/drivers/etc/hosts', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots('D:/UnauthorizedFolder/secret.txt', safeRoots, true)).toBe(false);
    });

    it('explicitly blocks sensitive credential and browser directories even if inside roots', () => {
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/Documents/.ssh/id_ed25519', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/Documents/.aws/credentials', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/Desktop/.gnupg/secring.gpg', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/Desktop/.git/config', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/AppData/Local/Google/Chrome/User Data/Default/Cookies', safeRoots, true)).toBe(false);
    });

    it('blocks null byte injections and empty inputs', () => {
      expect(isPathInsideAllowedRoots('C:/Users/TestUser/Videos/safe.mp4\0.exe', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots('', safeRoots, true)).toBe(false);
      expect(isPathInsideAllowedRoots(null as any, safeRoots, true)).toBe(false);
    });
  });
});
