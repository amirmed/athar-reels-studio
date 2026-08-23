import { describe, it, expect } from 'vitest';
import { generateViralCaption, getSocialShareLinks } from '../services/viralCaptionService';

describe('Viral Caption Service', () => {
  it('should generate caption with default spiritual tone', () => {
    const result = generateViralCaption({
      surahName: 'الفاتحة',
      ayahRange: '1 - 7',
      ayahText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translationText: 'In the name of Allah, the Entirely Merciful',
      tone: 'spiritual',
    });

    expect(result.surahName).toBe('الفاتحة');
    expect(result.verseRange).toBe('1 - 7');
    expect(result.fullCaption).toContain('الفاتحة');
    expect(result.fullCaption).toContain('سكينة');
    expect(result.hashtags.length).toBeGreaterThan(0);
    expect(result.goldenHashtags.length).toBe(7);
  });

  it('should include parent dedication when enabled', () => {
    const result = generateViralCaption({
      surahName: 'الملك',
      ayahRange: '1 - 5',
      dedicateToParents: true,
      customParentName: 'أبي رحمه الله',
    });

    expect(result.fullCaption).toContain('أبي رحمه الله');
    expect(result.fullCaption).toContain('صدقة جارية');
  });

  it('should generate share URLs correctly', () => {
    const links = getSocialShareLinks('تلاوة خاشعة');
    expect(links.whatsapp).toContain('https://api.whatsapp.com/send?text=');
    expect(links.telegram).toContain('https://t.me/share/url?');
    expect(links.x).toContain('https://twitter.com/intent/tweet?');
  });
});
