import { describe, it, expect } from 'vitest';
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
});
