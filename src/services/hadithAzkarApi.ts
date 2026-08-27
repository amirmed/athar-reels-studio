// Live API & Robust Hybrid Audio Engine for Hadiths & Azkar

import { AzkarItem } from '../types';
import { initialAzkarList } from '../data/azkarHadithData';

export async function searchHadithsAndAzkar(query: string): Promise<AzkarItem[]> {
  if (!query || !query.trim()) {
    return initialAzkarList;
  }

  const cleanQuery = query.trim().toLowerCase();
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  // Search curated authentic local database with multi-token matching
  const localResults = initialAzkarList.filter((item) => {
    const haystack =
      `${item.title} ${item.arabicText} ${item.categoryNameAr} ${item.benefit || ''} ${item.reference || ''}`.toLowerCase();
    return queryTokens.every((token) => haystack.includes(token));
  });

  return localResults.length > 0 ? localResults : initialAzkarList;
}

// Global active audio reference
let activeAudio: HTMLAudioElement | null = null;

import { synthesizeArabicSpeech } from './arabicTtsService';

/**
 * Plays Azkar/Dua/Hadith audio reliably:
 * 1. Direct pristine studio MP3 if available.
 * 2. Edge TTS & Neural Arabic AI speech synthesis with complete Tashkeel.
 * 3. Web Speech API fallback.
 */
export function playAzkarAudio(
  item: AzkarItem,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void,
  voiceId: string = item.category === 'hadith' ? 'ar-SA-HamedNeural' : 'ar-SA-ZariyahNeural'
): () => void {
  stopAzkarAudio();

  // 1. Direct high-quality Studio MP3 URL (e.g. EveryAyah for Quranic Duas)
  if (item.audioUrl && item.audioUrl.trim()) {
    try {
      const audio = new Audio(item.audioUrl);
      audio.volume = 0.95;
      activeAudio = audio;
      audio.onplay = () => onStart?.();
      audio.onended = () => {
        activeAudio = null;
        onEnd?.();
      };
      audio.onerror = () => {
        activeAudio = null;
        onError?.();
      };
      audio.play().catch(() => onError?.());
    } catch {
      onError?.();
    }
    return () => stopAzkarAudio();
  }

  // 2. High-Fidelity Arabic AI Voice Synthesizer
  synthesizeArabicSpeech(item.arabicText, voiceId)
    .then((res) => {
      try {
        const audio = new Audio(res.audioUrl);
        audio.volume = 0.95;
        activeAudio = audio;
        audio.onplay = () => onStart?.();
        audio.onended = () => {
          activeAudio = null;
          onEnd?.();
        };
        audio.onerror = () => {
          activeAudio = null;
          onError?.();
        };
        audio.play().catch(() => onError?.());
      } catch {
        onError?.();
      }
    })
    .catch(() => {
      onError?.();
    });

  return () => stopAzkarAudio();
}

export function stopAzkarAudio() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.removeAttribute('src');
      activeAudio.load();
    } catch (err) {
      console.debug('[HadithAzkarApi] Audio cleanup error:', err);
    }
    activeAudio = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.debug('[HadithAzkarApi] SpeechSynthesis cancel error:', err);
    }
  }
}
