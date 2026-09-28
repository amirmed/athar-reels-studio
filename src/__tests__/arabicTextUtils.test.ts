import { describe, it, expect } from 'vitest';
import {
  removeQuranicMarks,
  removeTashkeel,
  normalizeArabicSearch,
  cleanAyahTextForDuration,
  sanitizeQuranTextForDisplay,
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

  it('should sanitize Quranic text for display by eliminating tofu-box characters', () => {
    // Test sequential tanween (U+08F0, U+08F1, U+08F2)
    const textWithSequentialTanween = 'عَرَبِيًّ\u08F0ا عَدُوٌّ\u08F1 مُّبِينٌ\u08F1 بِقَوْمٍ\u08F2';
    const sanitized = sanitizeQuranTextForDisplay(textWithSequentialTanween);
    expect(sanitized).not.toContain('\u08F0');
    expect(sanitized).not.toContain('\u08F1');
    expect(sanitized).not.toContain('\u08F2');
    expect(sanitized).toContain('\u064B'); // Standard fathatan
    expect(sanitized).toContain('\u064C'); // Standard dammatan
    expect(sanitized).toContain('\u064D'); // Standard kasratan

    // Test zero-width formatting characters (U+2060, U+200A, U+FEFF, U+200B)
    const textWithFormattingChars = 'قُرْءَ\u200Aٰ\u2060\u200Aنًا\uFEFF\u200B';
    const sanitizedFormatting = sanitizeQuranTextForDisplay(textWithFormattingChars);
    expect(sanitizedFormatting).toBe('قُرْءَٰنًا');
    expect(sanitizedFormatting).not.toContain('\u2060');
    expect(sanitizedFormatting).not.toContain('\u200A');
    expect(sanitizedFormatting).not.toContain('\uFEFF');
    expect(sanitizedFormatting).not.toContain('\u200B');

    // Test Farsi Yeh replacement
    expect(sanitizeQuranTextForDisplay('یُوسُفُ')).toBe('يُوسُفُ');
  });

  it('should return empty string on falsy input', () => {
    expect(removeQuranicMarks('')).toBe('');
    expect(normalizeArabicSearch('')).toBe('');
    expect(cleanAyahTextForDuration('')).toBe('');
    expect(sanitizeQuranTextForDisplay('')).toBe('');
  });
});
