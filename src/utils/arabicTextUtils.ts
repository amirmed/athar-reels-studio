/**
 * Centralized Arabic Text Processing & Normalization Utilities
 * Covers Quranic marks, Harakat/Tashkeel, and search normalization.
 */

// Full Unicode range of Arabic Tashkeel, Tanween, Shaddah, Sukun, and Quranic Annotation Marks
const QURANIC_MARKS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u08E4-\u08F3]/g;

// Standard Arabic Diacritics (Fatha, Damma, Kasra, Tanween, Sukun, Shaddah)
export const TASHKEEL_REGEX = /[\u064B-\u0652\u0670]/g;

/**
 * Sanitize Quranic text for flawless visual display across all screens, fonts, and operating systems.
 *
 * Resolves tofu/missing-glyph boxes (▯) caused by:
 * 1. Invisible zero-width formatting characters inserted by Quran text APIs:
 *    - U+2060 (Word Joiner)
 *    - U+200A (Hair Space)
 *    - U+FEFF (Zero Width No-Break Space / BOM)
 *    - U+200B (Zero Width Space)
 * 2. Quranic Extended-A sequential tanween (التنوين المتتابع):
 *    - U+08F0 (Arabic Open Fathatan) -> mapped to standard Fathatan (\u064B ً)
 *    - U+08F1 (Arabic Open Dammatan) -> mapped to standard Dammatan (\u064C ٌ)
 *    - U+08F2 (Arabic Open Kasratan) -> mapped to standard Kasratan (\u064D ٍ)
 * 3. Non-standard characters:
 *    - U+06CC (Farsi Yeh) -> mapped to Arabic Yeh (\u064A ي)
 */
export function sanitizeQuranTextForDisplay(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2060\uFEFF\u200B\u200A]/g, '')
    .replace(/\u08F0/g, '\u064B')
    .replace(/\u08F1/g, '\u064C')
    .replace(/\u08F2/g, '\u064D')
    .replace(/\u06CC/g, '\u064A');
}

/**
 * Remove all Quranic punctuation, stops, and vowel marks
 */
export function removeQuranicMarks(text: string): string {
  if (!text) return '';
  return text.replace(QURANIC_MARKS_REGEX, '');
}

/**
 * Remove standard Arabic Tashkeel (harakat & tanween)
 */
export function removeTashkeel(text: string): string {
  if (!text) return '';
  return text.replace(QURANIC_MARKS_REGEX, '');
}

/**
 * Normalize Arabic text for smart search (Alif variants, Taa Marbuta, Yaa variants)
 */
export function normalizeArabicSearch(text: string): string {
  if (!text) return '';
  return removeQuranicMarks(text)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ+/g, '') // Tatweel
    .trim()
    .toLowerCase();
}

/**
 * Clean Ayah Text for Phonetic Duration & Word Timing Estimation
 */
export function cleanAyahTextForDuration(text: string): string {
  if (!text) return '';
  return text.replace(QURANIC_MARKS_REGEX, '').trim();
}
