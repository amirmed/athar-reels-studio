import type { QuranWord, AyahChunk } from '../../types';

export type { QuranWord, AyahChunk };

export interface EveryAyahReciter {
  id: string;
  subfolder: string;
  nameAr: string;
  nameEn: string;
  style: string;
  bitrate: string;
  serverUrl?: string;
  sampleAudioUrl?: string;
  isCompleteQuran?: boolean;
  availableSurahs?: number[];
}

export interface AyahData {
  number: number; // Global ayah number
  numberInSurah: number; // Ayah number within surah
  text: string; // Arabic text
  audioUrl: string; // Direct MP3 URL from everyayah.com
  fallbackUrls?: string[]; // Backup CDN URLs if primary 404s
  surahNumber: number;
  surahName: string;
  juz: number;
  page: number;
  duration?: number; // Ayah duration in seconds
  startTimeMs?: number; // Start timestamp in ms for full-surah files
  endTimeMs?: number; // End timestamp in ms for full-surah files
  isFullSurahFile?: boolean;
  words?: QuranWord[]; // Word-by-word data and timing
  chunks?: AyahChunk[]; // Waqf-aware authenticated slices
  translationText?: string;
}

export interface TranslationData {
  numberInSurah: number;
  text: string;
}

export interface SurahMetadata {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface QuranApiAyahItem {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

export interface QuranApiSurahPayload {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation?: string;
  numberOfAyahs: number;
  revelationType?: string;
  ayahs: QuranApiAyahItem[];
}

export interface QuranComWordItem {
  id?: number;
  position?: number;
  text_uthmani?: string;
  text?: string;
  char_type_name?: string;
  translation?: { text?: string };
  transliteration?: { text?: string };
}

export interface QuranComTimestampsPayload {
  audio_file?: {
    timestamps?: Array<{
      verse_key: string;
      timestamp_from: number;
      timestamp_to: number;
      duration?: number;
      segments?: Array<[number, number, number]>;
    }>;
  };
}

export interface QuranComVersesPayload {
  verses?: Array<{
    id: number;
    verse_number: number;
    verse_key: string;
    juz_number: number;
    page_number: number;
    text_uthmani?: string;
    words?: QuranComWordItem[];
  }>;
}
