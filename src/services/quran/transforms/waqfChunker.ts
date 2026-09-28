import type { QuranWord, AyahChunk } from '../types';
import { removeQuranicMarks, cleanAyahTextForDuration } from '../../../utils/arabicTextUtils';

// Sacred phrases that must never be broken apart
export const SACRED_CONNECTED_PHRASES = [
  'لا إله إلا الله',
  'لا إله إلا هو',
  'لا إله إلا أنت',
  'وما أرسلناك إلا',
  'وما من إله إلا',
  'يا أيها الذين آمنوا',
  'يا أيها الناس',
  'قل هو الله أحد',
  'فويل للمصلين',
  'ولا تقربوا الصلاة',
];

/**
 * Split long Quranic verses into authentic Waqf-aware chunks.
 * Strictly respects Uthmani waqf markers (مـ, قلى, ج, صلى) and avoids forbidden waqf (لا).
 */
export function splitAyahIntoWaqfChunks(
  words: QuranWord[],
  ayahText: string,
  totalDuration: number
): AyahChunk[] {
  if (!words || words.length <= 10) {
    return [
      {
        index: 0,
        text: ayahText,
        words: words || [],
        startTime: words?.[0]?.startTime || 0,
        endTime: words?.[words.length - 1]?.endTime || totalDuration,
      },
    ];
  }

  const chunks: QuranWord[][] = [];
  let currentSlice: QuranWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentSlice.push(word);

    const isLastWord = i === words.length - 1;
    if (isLastWord) {
      chunks.push(currentSlice);
      break;
    }

    // 1. Check for authentic Uthmani Waqf signs (صلى ، قلى ، مـ ، ج ، ۛ)
    // EXCLUDE 'لا' (\u06D9) because 'لا' means 'لا تقف' (Do not stop!)
    const hasAllowedWaqf =
      /[\u06D6\u06D7\u06D8\u06DA\u06DB\u0615]/.test(word.text) && !/[\u06D9]/.test(word.text);

    if (hasAllowedWaqf && currentSlice.length >= 4) {
      chunks.push(currentSlice);
      currentSlice = [];
      continue;
    }

    // 2. Safe grammatical boundary if slice exceeds 8 words
    if (currentSlice.length >= 7 && i + 1 < words.length) {
      const nextWord = words[i + 1].text.trim();
      const currentCombined = currentSlice.map((w) => w.text).join(' ');

      const isProtected = SACRED_CONNECTED_PHRASES.some((phrase) => {
        const cleanPhrase = removeQuranicMarks(phrase);
        const cleanCombined = removeQuranicMarks(currentCombined);
        return (
          cleanPhrase.startsWith(cleanCombined) || cleanCombined.endsWith(cleanPhrase.split(' ')[0])
        );
      });

      const isSafeNextStart = /^(و|فـ|ف|ثم|إذ|إن|أن|الذين|بل|كلا|لكن)/.test(nextWord);

      if (!isProtected && isSafeNextStart && currentSlice.length >= 5) {
        chunks.push(currentSlice);
        currentSlice = [];
      }
    }
  }

  if (currentSlice.length > 0) {
    if (chunks.length > 0 && currentSlice.length <= 3) {
      chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...currentSlice];
    } else {
      chunks.push(currentSlice);
    }
  }

  return chunks.map((chunkWords, idx) => {
    const chunkText = chunkWords.map((w) => w.text).join(' ');
    const startTime = chunkWords[0]?.startTime || 0;
    const endTime = chunkWords[chunkWords.length - 1]?.endTime || totalDuration;
    const waqfMatch = chunkText.match(/[\u06D6\u06D7\u06D8\u06DA\u06DB]/);

    return {
      index: idx,
      text: chunkText,
      words: chunkWords,
      startTime,
      endTime,
      hasWaqfSign: !!waqfMatch,
      waqfSign: waqfMatch ? waqfMatch[0] : undefined,
    };
  });
}

/**
 * Acoustic & Phonetic Timing Constants for Quranic Recitation (Tajweed / Tartil)
 */
export const PHONETIC_CONSTANTS = {
  /** Average time per letter in moderate tartil cadence (~5.5 letters/sec) */
  SECONDS_PER_LETTER: 0.18,
  /** Extra elongation duration for madd vowels (2 to 6 harakat) */
  EXTRA_SEC_PER_MADD_LETTER: 0.12,
  /** Minimum speech cadence floor per word (including intra-verse pause) */
  MIN_WORD_CADENCE_SEC: 0.75,
  /** Absolute minimum duration floor for any single ayah */
  MIN_AYAH_DURATION_SEC: 4.0,
  /** Mujawwad (melodic recitation) is typically ~1.9x slower than tartil */
  MUJAWWAD_CADENCE_RATIO: 1.9,
  /** Standard tartil baseline ratio */
  TARTIL_CADENCE_RATIO: 1.0,
} as const;

/**
 * Smart Phonetic Duration Calculation if Quran.com timestamp is unavailable
 */
export function estimateAyahDuration(
  ayahText: string,
  wordsCount: number,
  isMujawwad: boolean = false
): number {
  const cleanAyahText = cleanAyahTextForDuration(ayahText || '');
  const maddLetters = (cleanAyahText.match(/[آأإاويةىٰـ]/g) || []).length;
  const styleMultiplier = isMujawwad
    ? PHONETIC_CONSTANTS.MUJAWWAD_CADENCE_RATIO
    : PHONETIC_CONSTANTS.TARTIL_CADENCE_RATIO;

  return (
    Math.max(
      cleanAyahText.length * PHONETIC_CONSTANTS.SECONDS_PER_LETTER +
        maddLetters * PHONETIC_CONSTANTS.EXTRA_SEC_PER_MADD_LETTER,
      wordsCount * PHONETIC_CONSTANTS.MIN_WORD_CADENCE_SEC,
      PHONETIC_CONSTANTS.MIN_AYAH_DURATION_SEC
    ) * styleMultiplier
  );
}
