/**
 * Centralized Arabic Text Processing & Normalization Utilities
 * Covers Quranic marks, Harakat/Tashkeel, and search normalization.
 */

// Full Unicode range of Arabic Tashkeel, Tanween, Shaddah, Sukun, and Quranic Annotation Marks
const QURANIC_MARKS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;

// Standard Arabic Diacritics (Fatha, Damma, Kasra, Tanween, Sukun, Shaddah)
const TASHKEEL_REGEX = /[\u064B-\u0652\u0670]/g;

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
