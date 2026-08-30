import { describe, it, expect } from 'vitest';
import { DAILY_VERSES, getTodayDailyVerse } from '../data/dailyVerses';

describe('Daily Inspiring Verses Data & Helper', () => {
  it('contains 7 curated verses for all days of the week', () => {
    expect(DAILY_VERSES).toHaveLength(7);
    DAILY_VERSES.forEach((v, index) => {
      expect(v.day).toBe(index);
      expect(v.surahName).toBeTruthy();
      expect(v.surahNumber).toBeGreaterThan(0);
      expect(v.fromAyah).toBeGreaterThan(0);
      expect(v.toAyah).toBeGreaterThanOrEqual(v.fromAyah);
      expect(v.text).toBeTruthy();
      expect(v.reciter).toBeTruthy();
      expect(v.reciterId).toBeTruthy();
    });
  });

  it('getTodayDailyVerse returns correct verse for specific days', () => {
    // Test Friday (day 5)
    const friday = new Date('2026-08-28T12:00:00Z'); // Friday
    const fridayVerse = getTodayDailyVerse(friday);
    expect(fridayVerse.surahName).toBe('الكهف');

    // Test Monday (day 1)
    const monday = new Date('2026-08-24T12:00:00Z'); // Monday
    const mondayVerse = getTodayDailyVerse(monday);
    expect(mondayVerse.surahName).toBe('الضحى');
  });
});
