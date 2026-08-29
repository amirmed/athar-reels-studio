import { describe, it, expect } from 'vitest';
import { isSafeRemoteDownloadUrl, isPathInsideAllowedRoots } from '../utils/securityUtils';

describe('Security Hardening & Protection Suite', () => {
  describe('SSRF & Remote URL Security (isSafeRemoteDownloadUrl)', () => {
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

    it('blocks IPv6 loopback and link-local addresses', () => {
      expect(isSafeRemoteDownloadUrl('https://[::1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[fe80::1]/')).toBe(false);
      expect(isSafeRemoteDownloadUrl('https://[fc00::1]/')).toBe(false);
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
