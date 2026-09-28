import { fetchTextApi } from './alquranCloud';
import { fetchQuranComWords, fetchQuranComTimestamps } from './quranCom';
import {
  resolveReciter,
  getEveryAyahAudioUrl,
  getMultiCdnFallbackAudioUrls,
} from '../data/reciters';
import { splitAyahIntoWaqfChunks, estimateAyahDuration } from '../transforms/waqfChunker';
import type { AyahData, QuranApiSurahPayload, QuranWord } from '../types';
import { cleanAyahTextForDuration, sanitizeQuranTextForDisplay } from '../../../utils/arabicTextUtils';
import { logger } from '../../../utils/logger';

/**
 * Fetch ayahs text, everyayah audio URLs, and precise Quran.com word segments for karaoke sync.
 */
export async function fetchAyahsWithAudio(
  surahNumber: number,
  fromAyah: number,
  toAyah: number,
  reciterId: string
): Promise<AyahData[]> {
  try {
    const [surahData, wordsMap, timestampsMap] = await Promise.all([
      fetchTextApi<QuranApiSurahPayload>(`/surah/${surahNumber}`),
      fetchQuranComWords(surahNumber),
      fetchQuranComTimestamps(reciterId, surahNumber),
    ]);

    const reciter = resolveReciter(reciterId);
    const canonicalReciterId = reciter?.id || reciterId;
    const subfolder = reciter?.subfolder || 'Alafasy_128kbps';

    const ayahs: AyahData[] = surahData.ayahs
      .filter((a) => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah)
      .map((a) => {
        const verseKey = `${surahNumber}:${a.numberInSurah}`;
        const rawWords = wordsMap.get(verseKey) || [];
        const timing = timestampsMap.get(verseKey);

        const primaryAudioUrl = getEveryAyahAudioUrl(
          subfolder,
          surahNumber,
          a.numberInSurah,
          reciter?.serverUrl,
          canonicalReciterId
        );

        const fallbackUrls = getMultiCdnFallbackAudioUrls(
          subfolder,
          surahNumber,
          a.numberInSurah,
          reciter?.serverUrl,
          canonicalReciterId
        );

        // Smart Phonetic Duration Calculation if Quran.com timestamp is unavailable
        const isMujawwad = reciter?.style === 'مجوّد';
        const wordsCount = rawWords.length || a.text.split(/\s+/).length;
        const estimatedPhoneticSec = estimateAyahDuration(a.text || '', wordsCount, isMujawwad);
        const durationSeconds = timing ? timing.duration / 1000 : estimatedPhoneticSec;

        // Process words and timings
        let words: QuranWord[] = [];

        if (rawWords.length > 0) {
          const segments = timing?.segments || [];
          const verseStartMs = timing?.timestampFrom || 0;

          // Filter out or handle end marker words
          const contentWords = rawWords.filter((w) => w.char_type_name !== 'end');

          if (segments.length > 0) {
            // Exact segments from Quran.com
            words = contentWords.map((w, idx: number) => {
              const seg = segments[idx] || segments.find((s: number[]) => s[0] === w.position);
              let startSec = 0;
              let endSec = 0;

              if (seg && seg.length >= 3) {
                startSec = Math.max(0, (seg[1] - verseStartMs) / 1000);
                endSec = Math.max(startSec + 0.1, (seg[2] - verseStartMs) / 1000);
              } else {
                const fraction = idx / contentWords.length;
                const nextFraction = (idx + 1) / contentWords.length;
                startSec = fraction * durationSeconds;
                endSec = nextFraction * durationSeconds;
              }

              return {
                id: w.id || idx + 1,
                position: w.position || idx + 1,
                text: sanitizeQuranTextForDisplay(w.text_uthmani || w.text || ''),
                translation: w.translation?.text,
                transliteration: w.transliteration?.text,
                startTime: startSec,
                endTime: endSec,
                charTypeName: 'word' as const,
              };
            });
          } else {
            // Intelligent phonetic length weighting fallback
            const wordWeights = contentWords.map((w) => {
              const clean = cleanAyahTextForDuration(w.text_uthmani || w.text || '');
              const madds = (clean.match(/[آأإاويةىٰـ]/g) || []).length;
              return Math.max(1, clean.length + madds * 1.5);
            });
            const totalWeight = wordWeights.reduce((sum: number, wt: number) => sum + wt, 0);

            let accumulatedTime = 0;
            words = contentWords.map((w, idx: number) => {
              const wordDuration = (wordWeights[idx] / totalWeight) * durationSeconds;
              const start = accumulatedTime;
              const end = start + wordDuration;
              accumulatedTime = end;

              return {
                id: w.id || idx + 1,
                position: w.position || idx + 1,
                text: sanitizeQuranTextForDisplay(w.text_uthmani || w.text || ''),
                translation: w.translation?.text,
                transliteration: w.transliteration?.text,
                startTime: start,
                endTime: end,
                charTypeName: 'word' as const,
              };
            });
          }
        } else {
          // Fallback: split text by space if Quran.com words failed to load
          const rawTokens = a.text.trim().split(/\s+/);
          const totalWords = rawTokens.length;
          const wordDuration = durationSeconds / Math.max(totalWords, 1);

          words = rawTokens.map((token: string, idx: number) => ({
            id: idx + 1,
            position: idx + 1,
            text: sanitizeQuranTextForDisplay(token),
            startTime: idx * wordDuration,
            endTime: (idx + 1) * wordDuration,
            charTypeName: 'word' as const,
          }));
        }

        // Guarantee authentic Arabic text: if a.text is missing or corrupted, reconstruct from words
        let finalArabicText = sanitizeQuranTextForDisplay((a.text || '').trim());
        if (!/[\u0600-\u06FF]/.test(finalArabicText) && words.length > 0) {
          const reconstructed = words
            .map((w) => w.text)
            .join(' ')
            .trim();
          if (/[\u0600-\u06FF]/.test(reconstructed)) {
            finalArabicText = reconstructed;
          }
        }

        const chunks = splitAyahIntoWaqfChunks(words, finalArabicText, durationSeconds);

        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          text: finalArabicText,
          audioUrl: primaryAudioUrl,
          fallbackUrls,
          surahNumber: surahData.number,
          surahName: surahData.name,
          juz: a.juz,
          page: a.page,
          duration: durationSeconds,
          startTimeMs: timing?.timestampFrom,
          endTimeMs: timing?.timestampTo,
          isFullSurahFile: !!reciter?.serverUrl,
          words,
          chunks,
        };
      });

    return ayahs;
  } catch (error) {
    logger.error('Error fetching ayahs with audio and words:', error);
    throw error;
  }
}
