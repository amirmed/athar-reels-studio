import { TEXT_API, fetchWithRetry } from '../client';
import { getCached, setCache, deduplicatedFetch } from '../memoryCache';
import { quranCacheService } from '../../quranCacheService';
import { fetchQuranCom } from './quranCom';
import { TRANSLATION_EDITIONS } from '../data/editions';
import type {
  AyahData,
  TranslationData,
  SurahMetadata,
  QuranApiSurahPayload,
  QuranComVersesPayload,
} from '../types';
import { logger } from '../../../utils/logger';

/**
 * Fetch from AlQuran.cloud API with in-memory caching and persistent IndexedDB fallback
 */
export async function fetchTextApi<T>(endpoint: string): Promise<T> {
  const cacheKey = `text:${endpoint}`;
  const memoryCached = getCached<T>(cacheKey);
  if (memoryCached) return memoryCached;

  // Check persistent IndexedDB cache with explicit edition separation
  const surahMatch = endpoint.match(/\/surah\/(\d+)(?:\/([a-zA-Z0-9._-]+))?$/);
  const sNum = surahMatch ? Number(surahMatch[1]) : 0;
  const edition = surahMatch && surahMatch[2] ? surahMatch[2] : 'quran-uthmani';

  if (surahMatch && sNum > 0) {
    const localCached = await quranCacheService.getCachedAyahs(sNum, edition);
    if (localCached) {
      setCache(cacheKey, localCached);
      return localCached as T;
    }
  }

  return deduplicatedFetch<T>(cacheKey, async () => {
    try {
      const response = await fetchWithRetry(`${TEXT_API}${endpoint}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();

      if (json.code !== 200) {
        throw new Error(`API Error: ${json.status}`);
      }

      setCache(cacheKey, json.data);
      if (surahMatch && sNum > 0) {
        quranCacheService.setCachedAyahs(sNum, json.data, edition).catch((err) => {
          logger.debug('[QuranApi] setCachedAyahs error:', err);
        });
      }
      return json.data as T;
    } catch (primaryErr) {
      logger.warn(
        `[QuranApi] Primary Text API failed for ${endpoint}, checking fallbacks...`,
        primaryErr
      );

      // Fallback: try fetching from Quran.com API v4 directly for Arabic text
      if (surahMatch && sNum > 0 && (edition.includes('ar') || edition.includes('uthmani'))) {
        try {
          const qdcData = await fetchQuranCom<QuranComVersesPayload>(
            `/verses/by_chapter/${sNum}?language=ar&words=true&word_fields=text_uthmani,location,verse_key&per_page=300`
          );
          if (qdcData?.verses) {
            const transformed = {
              number: sNum,
              name: '',
              englishName: '',
              numberOfAyahs: qdcData.verses.length,
              ayahs: qdcData.verses.map((v) => ({
                number: v.id,
                text:
                  v.text_uthmani ||
                  v.words?.map((w) => w.text_uthmani || w.text).join(' ') ||
                  '',
                numberInSurah: v.verse_number,
                juz: v.juz_number,
                page: v.page_number,
              })),
            };
            setCache(cacheKey, transformed);
            quranCacheService.setCachedAyahs(sNum, transformed, edition).catch((err) => {
              logger.debug('[QuranApi] setCachedAyahs fallback error:', err);
            });
            return transformed as unknown as T;
          }
        } catch (fallbackErr) {
          logger.warn(`[QuranApi] Quran.com fallback also failed for surah ${sNum}:`, fallbackErr);
        }
      }
      throw primaryErr;
    }
  });
}

/**
 * Fetch ayah text only (no audio)
 */
export async function fetchAyahs(
  surahNumber: number,
  fromAyah: number,
  toAyah: number
): Promise<AyahData[]> {
  try {
    const surahData = await fetchTextApi<QuranApiSurahPayload>(`/surah/${surahNumber}`);
    const ayahs: AyahData[] = surahData.ayahs
      .filter((a) => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah)
      .map((a) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        audioUrl: '',
        surahNumber: surahData.number,
        surahName: surahData.name,
        juz: a.juz,
        page: a.page,
      }));
    return ayahs;
  } catch (error) {
    logger.error('Error fetching ayahs:', error);
    throw error;
  }
}

/**
 * Fetch multi-language translation for a surah range (English, French, Urdu, Turkish...)
 */
export async function fetchTranslation(
  surahNumber: number,
  fromAyah: number,
  toAyah: number,
  languageOrEdition: string = 'en'
): Promise<TranslationData[]> {
  try {
    const edition = TRANSLATION_EDITIONS[languageOrEdition]?.id || languageOrEdition || 'en.sahih';
    const surahData = await fetchTextApi<QuranApiSurahPayload>(`/surah/${surahNumber}/${edition}`);
    return surahData.ayahs
      .filter((a) => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah)
      .map((a) => ({
        numberInSurah: a.numberInSurah,
        text: a.text,
      }));
  } catch (error) {
    logger.error('Error fetching translation:', error);
    throw error;
  }
}

/**
 * Fetch all 114 surahs metadata
 */
export async function fetchAllSurahs(): Promise<SurahMetadata[]> {
  try {
    const data = await fetchTextApi<SurahMetadata[]>('/surah');
    return data.map((s) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    }));
  } catch (error) {
    logger.error('Error fetching surahs:', error);
    throw error;
  }
}
