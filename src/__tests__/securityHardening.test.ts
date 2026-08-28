import { describe, it, expect } from 'vitest';
import { isSafeRemoteDownloadUrl } from '../utils/securityUtils';

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
});
