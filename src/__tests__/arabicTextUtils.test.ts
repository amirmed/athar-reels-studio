import { describe, it, expect } from 'vitest';
import {
  removeQuranicMarks,
  removeTashkeel,
  normalizeArabicSearch,
  cleanAyahTextForDuration,
} from '../utils/arabicTextUtils';

describe('Arabic Text Utilities', () => {
  it('should remove Quranic marks and Tashkeel correctly', () => {
    const ayahWithMarks = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝١';
    const cleaned = removeTashkeel(ayahWithMarks);
    expect(cleaned).toContain('بسم الله الرحمن الرحيم');
    expect(cleaned).not.toContain('ِ');
    expect(cleaned).not.toContain('َّ');
    expect(cleaned).not.toContain('ٰ');
  });

  it('should normalize Arabic search queries with variations', () => {
    const rawSearch = 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ';
    const normalized = normalizeArabicSearch(rawSearch);
    expect(normalized).toBe('اياك نعبد واياك نستعين');
  });

  it('should handle Alif variants and Taa Marbuta', () => {
    expect(normalizeArabicSearch('أَكْرَمَ الإِنْسَانَ بِالرَّحْمَةِ')).toBe(
      'اكرم الانسان بالرحمه'
    );
  });

  it('should return empty string on falsy input', () => {
    expect(removeQuranicMarks('')).toBe('');
    expect(normalizeArabicSearch('')).toBe('');
    expect(cleanAyahTextForDuration('')).toBe('');
  });
});
