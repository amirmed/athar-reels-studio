import { describe, it, expect, vi } from 'vitest';
import {
  getMultiCdnFallbackAudioUrls,
  everyAyahReciters,
  resolveReciter,
  isSurahAvailableForReciter,
  getAvailableSurahsForReciter,
} from '../services/quranApi';

describe('Quran API & Audio Multi-CDN Service', () => {
  it('should generate multiple resilient CDN URLs for an ayah', () => {
    const urls = getMultiCdnFallbackAudioUrls('Alafasy_128kbps', 1, 1);
    expect(urls.length).toBeGreaterThanOrEqual(3);
    expect(urls[0]).toBe('https://everyayah.com/data/Alafasy_128kbps/001001.mp3');
    expect(urls.some((u) => u.includes('archive.org'))).toBe(true);
  });

  it('should have complete Quran flag properly set for verified reciters', () => {
    const yasser = everyAyahReciters.find((r) => r.id === 'yasser_128');
    expect(yasser).toBeDefined();
    expect(yasser?.isCompleteQuran).toBe(true);
  });

  it('resolves legacy and alias reciter IDs to their correct target reciter instead of falling back to default', () => {
    // Legacy aliases
    const minshawiMujawwad = resolveReciter('minshawy_mujawwad_192');
    expect(minshawiMujawwad).toBeDefined();
    expect(minshawiMujawwad?.nameAr).toContain('المنشاوي');
    expect(minshawiMujawwad?.subfolder).toContain('Minshawy_Mujawwad');

    const ajamyKetab = resolveReciter('ajamy_ketab_128');
    expect(ajamyKetab).toBeDefined();
    expect(ajamyKetab?.nameAr).toContain('العجمي');

    const basfar64 = resolveReciter('basfar_64');
    expect(basfar64).toBeDefined();
    expect(basfar64?.subfolder).toContain('Basfar');
  });

  it('correctly handles surah availability using resolved reciter aliases', () => {
    expect(isSurahAvailableForReciter('minshawy_mujawwad_192', 1)).toBe(true);
    expect(getAvailableSurahsForReciter('ajamy_ketab_128').length).toBe(114);
  });

  it('should return empty map for unmapped reciters without falling back to Alafasy', async () => {
    const { fetchQuranComTimestamps } = await import('../services/quranApi');
    const result = await fetchQuranComTimestamps('unmapped_reciter_custom_xyz', 1);
    expect(result.size).toBe(0);
  });

  describe('fetchWithRetry per-attempt timeout & timer leak safety', () => {
    it('always clears timeout in finally when network error occurs and succeeds on retry', async () => {
      const { fetchWithRetry } = await import('../services/quranApi');

      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('network error during first attempt');
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as unknown as Response;
      });

      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      const res = await fetchWithRetry('https://api.quran.com/test', undefined, 1, 3000);
      expect(res.ok).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      // Verify clearTimeout was executed for the failed attempt as well as the successful one
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);

      fetchSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });

    it('gives each attempt an independent timeout window', async () => {
      const { fetchWithRetry } = await import('../services/quranApi');

      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 429,
            headers: new Headers({ 'Retry-After': '0' }),
          } as unknown as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as unknown as Response;
      });

      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      const res = await fetchWithRetry('https://api.quran.com/test', undefined, 1, 5000);
      expect(res.ok).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Verify a new 5000ms timeout was scheduled for attempt 1 and attempt 2
      const timeout5000Calls = setTimeoutSpy.mock.calls.filter((call) => call[1] === 5000);
      expect(timeout5000Calls.length).toBe(2);

      fetchSpy.mockRestore();
      setTimeoutSpy.mockRestore();
    });

    it('does not retry and aborts immediately if caller signal aborts', async () => {
      const { fetchWithRetry } = await import('../services/quranApi');

      const callerController = new AbortController();
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        // Simulate caller aborting during the first attempt
        callerController.abort(new DOMException('Caller cancelled', 'AbortError'));
        throw new DOMException('The operation was aborted', 'AbortError');
      });

      await expect(
        fetchWithRetry('https://api.quran.com/test', { signal: callerController.signal }, 2, 5000)
      ).rejects.toThrow();

      // Because the caller cancelled, it must NOT retry
      expect(callCount).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      fetchSpy.mockRestore();
    });

    it('allows retry to succeed even when caller passed their own non-aborted signal', async () => {
      const { fetchWithRetry } = await import('../services/quranApi');

      const callerController = new AbortController();
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new DOMException('Request timed out', 'TimeoutError');
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as unknown as Response;
      });

      const res = await fetchWithRetry(
        'https://api.quran.com/test',
        { signal: callerController.signal },
        1,
        5000
      );
      expect(res.ok).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      fetchSpy.mockRestore();
    });

    it('cancels backoff sleep immediately if caller signal aborts during backoff delay', async () => {
      const { fetchWithRetry } = await import('../services/quranApi');

      const callerController = new AbortController();
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        // First call triggers 429 backoff
        setTimeout(() => callerController.abort(), 20);
        return {
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '5' }),
        } as unknown as Response;
      });

      const start = Date.now();
      await expect(
        fetchWithRetry('https://api.quran.com/test', { signal: callerController.signal }, 2, 5000)
      ).rejects.toThrow();
      const elapsed = Date.now() - start;

      // Must have aborted immediately during sleep (e.g. ~20-100ms) rather than waiting 5000ms
      expect(elapsed).toBeLessThan(1000);
      expect(callCount).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      fetchSpy.mockRestore();
    });
  });
});
