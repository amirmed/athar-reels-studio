import { QURAN_COM_API, fetchWithRetry } from '../client';
import { getCached, setCache, deduplicatedFetch } from '../memoryCache';
import { resolveReciter, EVERYAYAH_TO_QURANCOM_RECITERS } from '../data/reciters';
import type {
  QuranComWordItem,
  QuranComTimestampsPayload,
  QuranComVersesPayload,
} from '../types';
import { logger } from '../../../utils/logger';

/**
 * Low-level cached fetch for Quran.com API v4
 */
export async function fetchQuranCom<T>(endpoint: string): Promise<T> {
  const cacheKey = `qurancom:${endpoint}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  return deduplicatedFetch<T>(cacheKey, async () => {
    const response = await fetchWithRetry(`${QURAN_COM_API}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Quran.com API Error: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    setCache(cacheKey, json);
    return json as T;
  });
}

/**
 * Fetch chapter audio timestamps and segments from Quran.com API v4
 */
export async function fetchQuranComTimestamps(
  reciterId: string,
  surahNumber: number
): Promise<
  Map<
    string,
    { timestampFrom: number; timestampTo: number; duration: number; segments: number[][] }
  >
> {
  const map = new Map<
    string,
    { timestampFrom: number; timestampTo: number; duration: number; segments: number[][] }
  >();

  // Only query Quran.com if this reciter has an authentic, verified Quran.com recitation mapping
  const resolvedReciter = resolveReciter(reciterId);
  const canonicalReciterId = resolvedReciter?.id || reciterId;
  const qdcReciterId =
    EVERYAYAH_TO_QURANCOM_RECITERS[canonicalReciterId] ||
    EVERYAYAH_TO_QURANCOM_RECITERS[reciterId];
  if (!qdcReciterId) {
    // Return empty map so unmapped reciters use accurate phonetic syllable-weighted timing
    return map;
  }

  try {
    const data = await fetchQuranCom<QuranComTimestampsPayload>(
      `/chapter_recitations/${qdcReciterId}/${surahNumber}?segments=true`
    );
    const timestamps = data?.audio_file?.timestamps || [];
    for (const item of timestamps) {
      if (item.verse_key && item.timestamp_from !== undefined && item.timestamp_to !== undefined) {
        map.set(item.verse_key, {
          timestampFrom: item.timestamp_from,
          timestampTo: item.timestamp_to,
          duration: item.duration || item.timestamp_to - item.timestamp_from,
          segments: item.segments || [],
        });
      }
    }
  } catch (err) {
    logger.warn(`[QuranApi] Could not load chapter timestamps for reciter ${reciterId}:`, err);
  }
  return map;
}

/**
 * Fetch verses with words from Quran.com API v4
 */
export async function fetchQuranComWords(
  surahNumber: number
): Promise<Map<string, QuranComWordItem[]>> {
  const map = new Map<string, QuranComWordItem[]>();
  try {
    const data = await fetchQuranCom<QuranComVersesPayload>(
      `/verses/by_chapter/${surahNumber}?language=ar&words=true&word_fields=text_uthmani,location,verse_key&per_page=300`
    );
    const verses = data?.verses || [];
    for (const v of verses) {
      if (v.verse_key) {
        map.set(v.verse_key, v.words || []);
      }
    }
  } catch (err) {
    logger.warn(`[QuranApi] Could not load Quran.com words for surah ${surahNumber}:`, err);
  }
  return map;
}
